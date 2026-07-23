"""
Query Executor Service.
Executes validated SQL against an active SQLAlchemy engine
with timeout enforcement and comprehensive error handling.
"""

import time
import threading
from sqlalchemy import Engine, text
from sqlalchemy.exc import SQLAlchemyError, OperationalError
from app.models.responses import QueryResult
from app.config import get_settings
from app.utils.exceptions import (
    DatabaseExecutionError,
    QueryTimeoutError,
)
from app.utils.logger import get_logger

logger = get_logger(__name__)


class QueryExecutor:
    """
    Executes a single validated SQL SELECT query.
    Enforces a configurable timeout and returns structured results.
    """

    def __init__(self):
        self._timeout = get_settings().query_timeout_seconds

    def execute(self, engine: Engine, sql: str) -> QueryResult:
        """
        Execute SQL and return structured QueryResult.

        Args:
            engine: Active SQLAlchemy engine for the session.
            sql: Validated SQL string (SELECT only).

        Returns:
            QueryResult with columns, rows, row_count, and execution_time_ms.

        Raises:
            QueryTimeoutError: If execution exceeds the timeout.
            DatabaseExecutionError: On SQL or connection errors.
        """
        logger.info("Executing SQL (timeout=%ds): %s", self._timeout, sql[:120])
        result_holder: dict = {}
        error_holder: dict = {}

        def _run():
            try:
                start = time.perf_counter()
                with engine.connect() as conn:
                    # Set statement timeout per-connection for PostgreSQL
                    if "postgresql" in str(engine.url):
                        conn.execute(
                            text(f"SET statement_timeout = {self._timeout * 1000}")
                        )
                    cursor_result = conn.execute(text(sql))
                    rows = cursor_result.fetchall()
                    columns = list(cursor_result.keys())
                elapsed_ms = (time.perf_counter() - start) * 1000

                # Serialize rows to plain Python lists (JSON-serialisable)
                serialized_rows = [
                    [self._serialize_value(v) for v in row]
                    for row in rows
                ]
                result_holder["result"] = QueryResult(
                    columns=columns,
                    rows=serialized_rows,
                    row_count=len(rows),
                    execution_time_ms=round(elapsed_ms, 2),
                    sql=sql,
                )
            except SQLAlchemyError as exc:
                error_holder["error"] = DatabaseExecutionError(
                    "Query execution failed",
                    detail=str(exc),
                )
            except Exception as exc:
                error_holder["error"] = DatabaseExecutionError(
                    "Unexpected error during query execution",
                    detail=str(exc),
                )

        thread = threading.Thread(target=_run, daemon=True)
        thread.start()
        thread.join(timeout=self._timeout)

        if thread.is_alive():
            raise QueryTimeoutError(
                f"Query exceeded the {self._timeout}-second timeout",
                detail="Try simplifying your query or adding a LIMIT clause.",
            )

        if "error" in error_holder:
            raise error_holder["error"]

        result: QueryResult = result_holder["result"]
        logger.info(
            "Query completed: %d rows in %.2fms",
            result.row_count, result.execution_time_ms,
        )
        return result

    @staticmethod
    def _serialize_value(value) -> str | int | float | bool | None:
        """Convert database-specific types to JSON-serialisable Python types."""
        if value is None:
            return None
        if isinstance(value, (int, float, bool, str)):
            return value
        return str(value)


# Module-level singleton
query_executor = QueryExecutor()
