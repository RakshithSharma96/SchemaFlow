"""
SQLite database connector.
Wraps a file path (from a temporary upload) into a SQLAlchemy Engine.
"""

from pathlib import Path
from sqlalchemy import create_engine, text, Engine
from app.plugins.databases.base import BaseConnector
from app.utils.exceptions import DatabaseConnectionError
from app.utils.logger import get_logger

logger = get_logger(__name__)


class SQLiteConnector(BaseConnector):
    """Connector for SQLite databases (uploaded .db / .sqlite files)."""

    def __init__(self, file_path: str):
        self._file_path = Path(file_path)
        if not self._file_path.exists():
            raise DatabaseConnectionError(
                "SQLite file not found",
                detail=f"Path: {file_path}",
            )

    def create_engine(self) -> Engine:
        """Create a read-only SQLAlchemy Engine for the SQLite file."""
        try:
            # uri=True enables the SQLite URI format which supports mode=ro
            connection_url = f"sqlite:///{self._file_path.as_posix()}"
            engine = create_engine(
                connection_url,
                connect_args={"check_same_thread": False},
                pool_pre_ping=True,
            )
            # Validate connection
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            logger.info("SQLite engine created: %s", self._file_path.name)
            return engine
        except DatabaseConnectionError:
            raise
        except Exception as exc:
            raise DatabaseConnectionError(
                "Failed to connect to SQLite database",
                detail=str(exc),
            ) from exc

    def get_database_name(self) -> str:
        return self._file_path.stem

    def get_db_type(self) -> str:
        return "sqlite"
