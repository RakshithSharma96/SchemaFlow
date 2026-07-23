"""
PostgreSQL database connector.
"""

from sqlalchemy import create_engine, text, Engine
from app.plugins.databases.base import BaseConnector
from app.utils.exceptions import DatabaseConnectionError
from app.utils.logger import get_logger

logger = get_logger(__name__)


class PostgreSQLConnector(BaseConnector):
    """Connector for PostgreSQL databases via connection string."""

    def __init__(
        self,
        host: str,
        port: int,
        database: str,
        username: str,
        password: str,
    ):
        self._host = host
        self._port = port
        self._database = database
        self._username = username
        self._password = password

    def _build_url(self) -> str:
        return (
            f"postgresql+psycopg2://{self._username}:{self._password}"
            f"@{self._host}:{self._port}/{self._database}"
        )

    def create_engine(self) -> Engine:
        try:
            engine = create_engine(
                self._build_url(),
                pool_pre_ping=True,
                pool_size=5,
                max_overflow=10,
            )
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            logger.info(
                "PostgreSQL engine created: %s@%s:%s/%s",
                self._username, self._host, self._port, self._database,
            )
            return engine
        except Exception as exc:
            raise DatabaseConnectionError(
                "Failed to connect to PostgreSQL database",
                detail=str(exc),
            ) from exc

    def get_database_name(self) -> str:
        return self._database

    def get_db_type(self) -> str:
        return "postgresql"
