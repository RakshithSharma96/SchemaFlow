"""
Pydantic response models for all API endpoints.
Uses a generic ApiResponse envelope for consistency.
"""

from typing import Any, Generic, TypeVar
from pydantic import BaseModel

T = TypeVar("T")


class ApiResponse(BaseModel, Generic[T]):
    """Standard API response envelope."""
    success: bool
    data: T | None = None
    error: str | None = None
    detail: str | None = None



class ConnectionInfo(BaseModel):
    """Returned after a successful database connection."""
    session_id: str
    db_type: str
    database_name: str
    message: str



class ColumnInfo(BaseModel):
    name: str
    data_type: str
    nullable: bool
    primary_key: bool
    foreign_key: str | None = None   # "referenced_table.referenced_column"


class TableInfo(BaseModel):
    name: str
    columns: list[ColumnInfo]
    row_count: int | None = None


class SchemaInfo(BaseModel):
    database_name: str
    db_type: str
    tables: list[TableInfo]
    table_count: int



class GeneratedSQL(BaseModel):
    """SQL returned by the LLM before execution."""
    sql: str
    question: str
    model_used: str


class QueryResult(BaseModel):
    """Result of a successfully executed SQL query."""
    columns: list[str]
    rows: list[list[Any]]
    row_count: int
    execution_time_ms: float
    sql: str


class FullQueryResponse(BaseModel):
    """Combined response from the generate-and-execute pipeline."""
    question: str
    sql: str
    model_used: str
    columns: list[str]
    rows: list[list[Any]]
    row_count: int
    execution_time_ms: float



class HealthResponse(BaseModel):
    status: str
    version: str = "1.0.0"
    llm_provider: str = "nvidia"

class SuggestionsResponse(BaseModel):
    suggestions: list[str]

class ChartConfigResponse(BaseModel):
    chart_type: str
    x_axis: str | None = None
    y_axis: str | None = None

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: dict
