"""
Database Configuration.
Sets up SQLAlchemy for SQLite.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import get_settings

settings = get_settings()

# We are using SQLite for the metadata DB as requested.
# Using check_same_thread=False is needed in FastAPI for SQLite
SQLALCHEMY_DATABASE_URL = "sqlite:///./app_metadata.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    """FastAPI Dependency for database sessions."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
