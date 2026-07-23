"""
Security Core.
Provides audit logging and sensitive column masking for the Enterprise AI Platform.
"""

from typing import List, Dict, Any, Optional, Union
from datetime import datetime, timedelta, timezone
import jwt
from passlib.context import CryptContext
from app.core.observability import get_logger
from app.config import get_settings

logger = get_logger("security")
settings = get_settings()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Config from settings or defaults
SECRET_KEY = settings.secret_key or "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(subject: Union[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {"exp": expire, "sub": str(subject), "type": "access"}
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

import uuid

def create_refresh_token(subject: Union[str, Any]) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode = {"exp": expire, "sub": str(subject), "type": "refresh", "jti": uuid.uuid4().hex}
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str, token_type: str = "access") -> dict:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != token_type:
            raise jwt.InvalidTokenError("Invalid token type")
        return payload
    except jwt.PyJWTError:
        return None

# A simplistic rule engine for sensitive columns.
# In a real enterprise system, this would be loaded from a DB or configuration.
SENSITIVE_PATTERNS = ["password", "ssn", "credit_card", "token", "secret", "salary", "hash"]

class SecurityService:
    def audit_query(self, session_id: str, user_intent: str, sql: Optional[str] = None, success: bool = True, error: Optional[str] = None):
        """
        Logs an audit event for compliance tracking.
        """
        audit_event = {
            "event": "query_execution",
            "session_id": session_id,
            "timestamp": datetime.utcnow().isoformat(),
            "intent": user_intent,
            "sql": sql,
            "success": success,
            "error": error
        }
        
        if success:
            logger.info("Audit log recorded", **audit_event)
        else:
            logger.warn("Audit log recorded (Failed)", **audit_event)

    def filter_schema(self, tables: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Filters out highly sensitive columns from the schema so the AI never sees them.
        Accepts the schema format from our schema extraction (list of table dicts).
        """
        safe_tables = []
        masked_count = 0
        
        for table in tables:
            safe_columns = []
            for col in table.get("columns", []):
                col_name = col.get("name", "").lower()
                is_sensitive = any(pattern in col_name for pattern in SENSITIVE_PATTERNS)
                
                if not is_sensitive:
                    safe_columns.append(col)
                else:
                    masked_count += 1
            
            # Deepish copy for the table
            safe_table = dict(table)
            safe_table["columns"] = safe_columns
            safe_tables.append(safe_table)
            
        if masked_count > 0:
            logger.info(f"Masked {masked_count} sensitive columns from schema")
            
        return safe_tables

security_service = SecurityService()
