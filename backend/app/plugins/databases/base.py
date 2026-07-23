"""
Abstract base class for all database connectors.
Concrete connectors (SQLite, PostgreSQL, MySQL) extend this class.
"""

from abc import ABC, abstractmethod
from sqlalchemy import Engine


class BaseConnector(ABC):
    """
    Interface that every DB connector must implement.
    Responsible only for creating and validating a SQLAlchemy Engine.
    """

    @abstractmethod
    def create_engine(self) -> Engine:
        """
        Build and return a configured SQLAlchemy Engine.
        Must raise DatabaseConnectionError on failure.
        """
        ...

    @abstractmethod
    def get_database_name(self) -> str:
        """Return a human-readable database identifier."""
        ...

    @abstractmethod
    def get_db_type(self) -> str:
        """Return the database type string (sqlite | postgresql | mysql)."""
        ...
