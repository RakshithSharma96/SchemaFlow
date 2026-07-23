"""
Database connection endpoints.
Handles connect (SQLite file upload + PostgreSQL/MySQL string)
and disconnect operations.
"""

import os
import shutil
import uuid
from pathlib import Path

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import JSONResponse

from app.config import get_settings
from app.plugins.databases.mysql import MySQLConnector
from app.plugins.databases.postgres import PostgreSQLConnector
from app.plugins.databases.sqlite import SQLiteConnector
from app.models.requests import MySQLConnectionRequest, PostgreSQLConnectionRequest
from app.models.responses import ApiResponse, ConnectionInfo
from app.services.connection_manager import connection_manager
from app.services.response_formatter import response_formatter
from app.utils.exceptions import (
    AgentBaseException,
    DatabaseConnectionError,
    SessionNotFoundError,
)
from app.utils.logger import get_logger

router = APIRouter()
logger = get_logger(__name__)



@router.get("", response_model=ApiResponse[list[dict]])
async def list_connections():
    """Return all active database sessions."""
    try:
        connections = connection_manager.get_all_session_info()
        return response_formatter.success(connections)
    except Exception as exc:
        return JSONResponse(
            status_code=500,
            content=response_formatter.error("Failed to list connections", str(exc)).model_dump(),
        )


@router.post("/connect/sqlite", response_model=ApiResponse[ConnectionInfo])
async def connect_sqlite(file: UploadFile = File(...)):
    """
    Accept a SQLite database file upload, store it in a secure temp
    directory, and return a session ID.
    """
    settings = get_settings()

    # Validate file extension
    filename = file.filename or "database.db"
    if not filename.lower().endswith((".db", ".sqlite", ".sqlite3")):
        raise HTTPException(
            status_code=400,
            detail="Only .db, .sqlite, or .sqlite3 files are accepted.",
        )

    # Create per-upload temp directory
    temp_dir = Path(settings.upload_temp_dir) / str(uuid.uuid4())
    temp_dir.mkdir(parents=True, exist_ok=True)
    file_path = temp_dir / filename

    try:
        # Save uploaded file
        contents = await file.read()
        if len(contents) == 0:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")
        file_path.write_bytes(contents)

        # Create connector and engine
        connector = SQLiteConnector(str(file_path))
        engine = connector.create_engine()

        session_id = connection_manager.create_session(
            engine=engine,
            db_type=connector.get_db_type(),
            database_name=connector.get_database_name(),
            sqlite_file_path=str(file_path),
        )

        logger.info("SQLite session created: %s (%s)", session_id, filename)
        return response_formatter.success(
            ConnectionInfo(
                session_id=session_id,
                db_type="sqlite",
                database_name=connector.get_database_name(),
                message=f"Connected to SQLite database: {filename}",
            )
        )

    except (DatabaseConnectionError, HTTPException):
        shutil.rmtree(temp_dir, ignore_errors=True)
        raise
    except Exception as exc:
        shutil.rmtree(temp_dir, ignore_errors=True)
        logger.error("SQLite connect error: %s", exc)
        return JSONResponse(
            status_code=500,
            content=response_formatter.error(
                "Failed to connect to SQLite database", str(exc)
            ).model_dump(),
        )



@router.post("/connect/postgresql", response_model=ApiResponse[ConnectionInfo])
async def connect_postgresql(request: PostgreSQLConnectionRequest):
    """Connect to a PostgreSQL database using explicit connection parameters."""
    try:
        connector = PostgreSQLConnector(
            host=request.host,
            port=request.port,
            database=request.database,
            username=request.username,
            password=request.password,
        )
        engine = connector.create_engine()
        session_id = connection_manager.create_session(
            engine=engine,
            db_type=connector.get_db_type(),
            database_name=connector.get_database_name(),
        )
        return response_formatter.success(
            ConnectionInfo(
                session_id=session_id,
                db_type="postgresql",
                database_name=connector.get_database_name(),
                message=f"Connected to PostgreSQL database: {request.database}",
            )
        )
    except AgentBaseException as exc:
        return JSONResponse(
            status_code=400,
            content=response_formatter.error(exc.message, exc.detail).model_dump(),
        )
    except Exception as exc:
        return JSONResponse(
            status_code=500,
            content=response_formatter.error("Unexpected connection error", str(exc)).model_dump(),
        )



@router.post("/connect/mysql", response_model=ApiResponse[ConnectionInfo])
async def connect_mysql(request: MySQLConnectionRequest):
    """Connect to a MySQL database using explicit connection parameters."""
    try:
        connector = MySQLConnector(
            host=request.host,
            port=request.port,
            database=request.database,
            username=request.username,
            password=request.password,
        )
        engine = connector.create_engine()
        session_id = connection_manager.create_session(
            engine=engine,
            db_type=connector.get_db_type(),
            database_name=connector.get_database_name(),
        )
        return response_formatter.success(
            ConnectionInfo(
                session_id=session_id,
                db_type="mysql",
                database_name=connector.get_database_name(),
                message=f"Connected to MySQL database: {request.database}",
            )
        )
    except AgentBaseException as exc:
        return JSONResponse(
            status_code=400,
            content=response_formatter.error(exc.message, exc.detail).model_dump(),
        )
    except Exception as exc:
        return JSONResponse(
            status_code=500,
            content=response_formatter.error("Unexpected connection error", str(exc)).model_dump(),
        )



@router.delete("/disconnect/{session_id}", response_model=ApiResponse[dict])
async def disconnect(session_id: str):
    """Disconnect a session, release resources, and delete any temp files."""
    try:
        connection_manager.remove_session(session_id)
        return response_formatter.success({"message": "Disconnected successfully."})
    except SessionNotFoundError as exc:
        return JSONResponse(
            status_code=404,
            content=response_formatter.error(exc.message, exc.detail).model_dump(),
        )
    except Exception as exc:
        return JSONResponse(
            status_code=500,
            content=response_formatter.error("Failed to disconnect", str(exc)).model_dump(),
        )
