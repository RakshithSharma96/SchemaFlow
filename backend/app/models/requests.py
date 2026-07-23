"""
Pydantic request models for all API endpoints.
"""

from enum import Enum
from pydantic import BaseModel, field_validator


class DatabaseType(str, Enum):
    SQLITE = "sqlite"
    POSTGRESQL = "postgresql"
    MYSQL = "mysql"


class PostgreSQLConnectionRequest(BaseModel):
    """Connection request for PostgreSQL databases."""
    db_type: DatabaseType = DatabaseType.POSTGRESQL
    host: str
    port: int = 5432
    database: str
    username: str
    password: str

    @field_validator("host")
    @classmethod
    def host_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Host cannot be empty")
        return v.strip()


class MySQLConnectionRequest(BaseModel):
    """Connection request for MySQL databases."""
    db_type: DatabaseType = DatabaseType.MYSQL
    host: str
    port: int = 3306
    database: str
    username: str
    password: str

    @field_validator("host")
    @classmethod
    def host_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Host cannot be empty")
        return v.strip()


class GenerateQueryRequest(BaseModel):
    """Request to generate SQL from a natural-language question."""
    session_id: str
    question: str

    @field_validator("question")
    @classmethod
    def question_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Question cannot be empty")
        return v.strip()


class ExecuteQueryRequest(BaseModel):
    """Request to execute a SQL query directly."""
    session_id: str
    sql: str

    @field_validator("sql")
    @classmethod
    def sql_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("SQL cannot be empty")
        return v.strip()


class GenerateAndExecuteRequest(BaseModel):
    """Full pipeline: NL question → generate SQL → validate → execute."""
    session_id: str
    question: str

    @field_validator("question")
    @classmethod
    def question_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Question cannot be empty")
        return v.strip()

class IntelligenceRequest(BaseModel):
    """Request to analyze results, suggest questions, or recommend charts."""
    question: str
    sql: str
    columns: list[str]
    rows: list[list]

class ExplainSqlRequest(BaseModel):
    """Request to explain a SQL query."""
    sql: str

class ExplainErrorRequest(BaseModel):
    """Request to explain a SQL error."""
    error_msg: str
    sql: str

class UserRegisterRequest(BaseModel):
    name: str
    email: str
    password: str

    @field_validator("email")
    @classmethod
    def email_valid(cls, v: str) -> str:
        if "@" not in v:
            raise ValueError("Invalid email format")
        return v.strip().lower()
        
    @field_validator("password")
    @classmethod
    def password_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v

class UserLoginRequest(BaseModel):
    email: str
    password: str

class RefreshTokenRequest(BaseModel):
    refresh_token: str
