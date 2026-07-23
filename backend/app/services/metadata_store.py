"""
Metadata Store Service (SQLAlchemy Implementation).
Replaces the old raw SQLite implementation.
Uses Fernet encryption to safely store connection passwords.
"""

import os
import uuid
from typing import List, Dict, Any, Optional
from cryptography.fernet import Fernet
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.models.domain import SavedConnection, QueryHistory
from app.utils.logger import get_logger

logger = get_logger(__name__)

class MetadataStore:
    def __init__(self, key_path: str = ".secret.key"):
        self.key_path = key_path
        self._fernet = self._load_or_create_key()

    def _load_or_create_key(self) -> Fernet:
        """Load the Fernet key from .secret.key or create it if missing."""
        if not os.path.exists(self.key_path):
            key = Fernet.generate_key()
            with open(self.key_path, "wb") as f:
                f.write(key)
            logger.info("Generated new encryption key at %s", self.key_path)
        else:
            with open(self.key_path, "rb") as f:
                key = f.read()
        return Fernet(key)


    def encrypt_password(self, password: str) -> str:
        if not password:
            return ""
        return self._fernet.encrypt(password.encode()).decode()

    def decrypt_password(self, encrypted: str) -> str:
        if not encrypted:
            return ""
        try:
            return self._fernet.decrypt(encrypted.encode()).decode()
        except Exception as e:
            logger.error("Failed to decrypt password: %s", e)
            return ""


    def save_connection(self, db: Session, user_id: str, name: str, db_type: str, host: str = "", port: int = 0, 
                        database: str = "", username: str = "", password: str = "") -> dict:
        
        pwd_enc = self.encrypt_password(password)
        conn = SavedConnection(
            user_id=user_id,
            name=name,
            db_type=db_type,
            host=host,
            port=port,
            database=database,
            username=username,
            password_encrypted=pwd_enc
        )
        db.add(conn)
        db.commit()
        db.refresh(conn)
        return self._conn_to_dict(conn)

    def get_connection(self, db: Session, conn_id: str, user_id: str) -> Optional[dict]:
        conn = db.query(SavedConnection).filter(SavedConnection.id == conn_id, SavedConnection.user_id == user_id).first()
        if not conn:
            return None
        return self._conn_to_dict(conn, include_password=True)

    def list_connections(self, db: Session, user_id: str) -> List[dict]:
        conns = db.query(SavedConnection).filter(SavedConnection.user_id == user_id).order_by(desc(SavedConnection.created_at)).all()
        return [self._conn_to_dict(c, include_password=False) for c in conns]

    def delete_connection(self, db: Session, conn_id: str, user_id: str):
        conn = db.query(SavedConnection).filter(SavedConnection.id == conn_id, SavedConnection.user_id == user_id).first()
        if conn:
            db.delete(conn)
            db.commit()

    def _conn_to_dict(self, conn: SavedConnection, include_password: bool = False) -> dict:
        d = {
            "id": conn.id,
            "user_id": conn.user_id,
            "name": conn.name,
            "db_type": conn.db_type,
            "host": conn.host,
            "port": conn.port,
            "database": conn.database,
            "username": conn.username,
            "created_at": conn.created_at.isoformat() if conn.created_at else None
        }
        if include_password:
            d["password"] = self.decrypt_password(conn.password_encrypted)
        return d


    def add_query_history(self, db: Session, user_id: str, session_id: str, question: str, sql: str, 
                          database_name: str, db_type: str, execution_time_ms: float) -> dict:
        qh = QueryHistory(
            user_id=user_id,
            session_id=session_id,
            question=question,
            sql=sql,
            database_name=database_name,
            db_type=db_type,
            execution_time_ms=execution_time_ms
        )
        db.add(qh)
        db.commit()
        db.refresh(qh)
        return self._query_to_dict(qh)

    def get_query_history(self, db: Session, q_id: str, user_id: str) -> Optional[dict]:
        qh = db.query(QueryHistory).filter(QueryHistory.id == q_id, QueryHistory.user_id == user_id).first()
        return self._query_to_dict(qh) if qh else None

    def list_query_history(self, db: Session, user_id: str, limit: int = 50) -> List[dict]:
        qhs = db.query(QueryHistory).filter(QueryHistory.user_id == user_id).order_by(desc(QueryHistory.created_at)).limit(limit).all()
        return [self._query_to_dict(qh) for qh in qhs]
            
    def delete_query_history(self, db: Session, q_id: str, user_id: str):
        qh = db.query(QueryHistory).filter(QueryHistory.id == q_id, QueryHistory.user_id == user_id).first()
        if qh:
            db.delete(qh)
            db.commit()

    def delete_all_query_history(self, db: Session, user_id: str):
        db.query(QueryHistory).filter(QueryHistory.user_id == user_id).delete()
        db.commit()

    def _query_to_dict(self, qh: QueryHistory) -> dict:
        return {
            "id": qh.id,
            "user_id": qh.user_id,
            "session_id": qh.session_id,
            "question": qh.question,
            "sql": qh.sql,
            "database_name": qh.database_name,
            "db_type": qh.db_type,
            "execution_time_ms": qh.execution_time_ms,
            "is_favorite": qh.is_favorite,
            "created_at": qh.created_at.isoformat() if qh.created_at else None
        }

# Module-level singleton
metadata_store = MetadataStore()
