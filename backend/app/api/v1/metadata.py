"""
Metadata endpoints:
  GET    /metadata/connections       — List saved connections
  POST   /metadata/connections       — Save a new connection
  DELETE /metadata/connections/{id}  — Delete a saved connection
  
  GET    /metadata/history           — List query history
  DELETE /metadata/history/{id}      — Delete a query history item
"""

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.models.responses import ApiResponse
from app.models.domain import User
from app.services.metadata_store import metadata_store
from app.services.response_formatter import response_formatter
from app.utils.logger import get_logger
from app.api.deps import get_current_user
from app.db.database import get_db

router = APIRouter()
logger = get_logger(__name__)


class SaveConnectionRequest(BaseModel):
    name: str
    db_type: str
    host: str = ""
    port: int = 0
    database: str = ""
    username: str = ""
    password: str = ""


@router.get("/connections")
async def list_connections(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        conns = metadata_store.list_connections(db, user.id)
        return response_formatter.success(conns)
    except Exception as exc:
        logger.error("List connections error: %s", exc)
        return JSONResponse(status_code=500, content=response_formatter.error("Failed to list connections", str(exc)).model_dump())

@router.post("/connections")
async def save_connection(request: SaveConnectionRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        conn = metadata_store.save_connection(
            db=db,
            user_id=user.id,
            name=request.name,
            db_type=request.db_type,
            host=request.host,
            port=request.port,
            database=request.database,
            username=request.username,
            password=request.password
        )
        return response_formatter.success(conn)
    except Exception as exc:
        logger.error("Save connection error: %s", exc)
        return JSONResponse(status_code=500, content=response_formatter.error("Failed to save connection", str(exc)).model_dump())

@router.delete("/connections/{conn_id}")
async def delete_connection(conn_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        metadata_store.delete_connection(db, conn_id, user.id)
        return response_formatter.success({"deleted": True})
    except Exception as exc:
        logger.error("Delete connection error: %s", exc)
        return JSONResponse(status_code=500, content=response_formatter.error("Failed to delete connection", str(exc)).model_dump())

@router.get("/history")
async def list_history(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        hist = metadata_store.list_query_history(db, user.id)
        return response_formatter.success(hist)
    except Exception as exc:
        logger.error("List history error: %s", exc)
        return JSONResponse(status_code=500, content=response_formatter.error("Failed to list history", str(exc)).model_dump())

@router.delete("/history/{q_id}")
async def delete_history(q_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        metadata_store.delete_query_history(db, q_id, user.id)
        return response_formatter.success({"deleted": True})
    except Exception as exc:
        logger.error("Delete history error: %s", exc)
        return JSONResponse(status_code=500, content=response_formatter.error("Failed to delete history", str(exc)).model_dump())

@router.delete("/history")
async def delete_all_history(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        metadata_store.delete_all_query_history(db, user.id)
        return response_formatter.success({"deleted": True})
    except Exception as exc:
        logger.error("Delete all history error: %s", exc)
        return JSONResponse(status_code=500, content=response_formatter.error("Failed to delete all history", str(exc)).model_dump())
