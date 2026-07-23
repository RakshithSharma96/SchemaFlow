"""
Database Connection Manager.
Maintains an in-memory map of session_id → (Engine, metadata).
Handles connect, disconnect, and SQLite temp-file cleanup.
"""

import os
import uuid
import shutil
from dataclasses import dataclass, field
from pathlib import Path
from sqlalchemy import Engine
from app.utils.exceptions import SessionNotFoundError
from app.utils.logger import get_logger

logger = get_logger(__name__)


@dataclass
class SessionData:
    """All data associated with a single database session."""
    session_id: str
    engine: Engine
    db_type: str
    database_name: str
    sqlite_file_path: str | None = None   # Only set for SQLite sessions
    schema_cache: dict = field(default_factory=dict)


class ConnectionManager:
    """
    In-memory store for active database sessions.
    Thread-safety note: FastAPI runs in a single async event loop;
    for multi-worker deployments, replace with a Redis-backed store.
    """

    def __init__(self):
        self._sessions: dict[str, SessionData] = {}


    def create_session(
        self,
        engine: Engine,
        db_type: str,
        database_name: str,
        sqlite_file_path: str | None = None,
    ) -> str:
        """Register a new session and return the generated session ID."""
        session_id = str(uuid.uuid4())
        self._sessions[session_id] = SessionData(
            session_id=session_id,
            engine=engine,
            db_type=db_type,
            database_name=database_name,
            sqlite_file_path=sqlite_file_path,
        )
        logger.info(
            "Session created [%s] db_type=%s database=%s",
            session_id, db_type, database_name,
        )
        return session_id

    def get_session(self, session_id: str) -> SessionData:
        """Return session data or raise SessionNotFoundError."""
        session = self._sessions.get(session_id)
        if not session:
            raise SessionNotFoundError(
                f"Session '{session_id}' not found",
                detail="The session may have expired or been disconnected.",
            )
        return session

    def remove_session(self, session_id: str) -> None:
        """
        Disconnect and clean up a session.
        Disposes the SQLAlchemy engine and deletes any SQLite temp file.
        """
        session = self._sessions.pop(session_id, None)
        if not session:
            logger.warning("Attempted to remove non-existent session: %s", session_id)
            return

        # Dispose engine connection pool
        try:
            session.engine.dispose()
        except Exception as exc:
            logger.warning("Error disposing engine for session %s: %s", session_id, exc)

        # Delete temporary SQLite file
        if session.sqlite_file_path:
            self._delete_sqlite_file(session.sqlite_file_path)

        logger.info("Session removed [%s]", session_id)

    def set_schema_cache(self, session_id: str, schema: dict) -> None:
        """Cache extracted schema for a session."""
        session = self.get_session(session_id)
        session.schema_cache = schema

    def get_schema_cache(self, session_id: str) -> dict | None:
        """Return cached schema, or None if not yet extracted."""
        session = self.get_session(session_id)
        return session.schema_cache if session.schema_cache else None

    def list_sessions(self) -> list[str]:
        """Return all active session IDs."""
        return list(self._sessions.keys())

    def get_all_session_info(self) -> list[dict]:
        """Return detailed info for all active sessions."""
        return [
            {
                "id": session.session_id,
                "name": session.database_name,
                "db_type": session.db_type,
            }
            for session in self._sessions.values()
        ]


    @staticmethod
    def _delete_sqlite_file(file_path: str) -> None:
        """Safely delete a temporary SQLite file and its parent dir."""
        try:
            path = Path(file_path)
            if path.exists():
                path.unlink()
                # Remove the per-session temp directory if now empty
                parent = path.parent
                if parent.exists() and not any(parent.iterdir()):
                    shutil.rmtree(parent, ignore_errors=True)
            logger.info("Temporary SQLite file deleted: %s", file_path)
        except Exception as exc:
            logger.warning("Failed to delete SQLite temp file %s: %s", file_path, exc)


# Singleton instance — imported by FastAPI dependencies
connection_manager = ConnectionManager()
