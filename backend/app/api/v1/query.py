"""
Query endpoints:
  POST /query/generate          — NL question → validated SQL (no execution)
  POST /query/execute           — Execute provided SQL
  POST /query/generate-execute  — Full pipeline: NL → SQL → execute
"""

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.llm.factory import get_llm_provider
from app.models.requests import (
    ExecuteQueryRequest,
    GenerateAndExecuteRequest,
    GenerateQueryRequest,
)
from app.models.responses import (
    ApiResponse,
    FullQueryResponse,
    GeneratedSQL,
    QueryResult,
    SchemaInfo,
)
from app.services.connection_manager import connection_manager
from app.services.query_executor import query_executor
from app.services.response_formatter import response_formatter
from app.services.schema_extractor import schema_extractor
from app.services.sql_generator import SQLGenerator
from app.services.sql_validator import sql_validator
from app.services.metadata_store import metadata_store
from app.utils.exceptions import (
    AgentBaseException,
    SessionNotFoundError,
    SQLValidationError,
)
from app.utils.logger import get_logger
from app.api.deps import get_current_user
from app.models.domain import User
from app.db.database import get_db

router = APIRouter()
logger = get_logger(__name__)


def _get_schema(session_id: str) -> SchemaInfo:
    """Helper: return cached schema or extract fresh."""
    session = connection_manager.get_session(session_id)
    cached = connection_manager.get_schema_cache(session_id)
    if cached:
        return SchemaInfo(**cached)
    schema = schema_extractor.extract(
        engine=session.engine,
        database_name=session.database_name,
        db_type=session.db_type,
    )
    connection_manager.set_schema_cache(session_id, schema.model_dump())
    return schema



@router.post("/generate", response_model=ApiResponse[GeneratedSQL])
async def generate_sql(request: GenerateQueryRequest, user: User = Depends(get_current_user)):
    """Convert a natural-language question to validated SQL without executing it."""
    try:
        schema = _get_schema(request.session_id)
        generator = SQLGenerator(llm_provider=get_llm_provider())
        result = generator.generate(schema=schema, question=request.question, session_id=request.session_id)
        return response_formatter.success(result)
    except SessionNotFoundError as exc:
        return JSONResponse(
            status_code=404,
            content=response_formatter.error(exc.message, exc.detail).model_dump(),
        )
    except SQLValidationError as exc:
        return JSONResponse(
            status_code=422,
            content=response_formatter.error(exc.message, exc.detail).model_dump(),
        )
    except AgentBaseException as exc:
        return JSONResponse(
            status_code=400,
            content=response_formatter.error(exc.message, exc.detail).model_dump(),
        )
    except Exception as exc:
        logger.error("SQL generation error: %s", exc)
        return JSONResponse(
            status_code=500,
            content=response_formatter.error("SQL generation failed", str(exc)).model_dump(),
        )



@router.post("/execute", response_model=ApiResponse[QueryResult])
async def execute_sql(request: ExecuteQueryRequest, user: User = Depends(get_current_user)):
    """
    Validate and execute a SQL query provided directly by the user.
    The SQL is validated before execution — unsafe queries are rejected.
    """
    try:
        session = connection_manager.get_session(request.session_id)
        validated_sql = sql_validator.validate(request.sql)
        result = query_executor.execute(engine=session.engine, sql=validated_sql)
        return response_formatter.success(result)
    except SessionNotFoundError as exc:
        return JSONResponse(
            status_code=404,
            content=response_formatter.error(exc.message, exc.detail).model_dump(),
        )
    except SQLValidationError as exc:
        return JSONResponse(
            status_code=422,
            content=response_formatter.error(exc.message, exc.detail).model_dump(),
        )
    except AgentBaseException as exc:
        return JSONResponse(
            status_code=400,
            content=response_formatter.error(exc.message, exc.detail).model_dump(),
        )
    except Exception as exc:
        logger.error("Query execution error: %s", exc)
        return JSONResponse(
            status_code=500,
            content=response_formatter.error("Query execution failed", str(exc)).model_dump(),
        )



@router.post("/generate-execute", response_model=ApiResponse[FullQueryResponse])
async def generate_and_execute(request: GenerateAndExecuteRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Full pipeline: NL question → generate SQL → validate → execute → return results.
    This is the primary endpoint used by the chat interface.
    """
    try:
        session = connection_manager.get_session(request.session_id)
        schema = _get_schema(request.session_id)

        # Generate validated SQL
        generator = SQLGenerator(llm_provider=get_llm_provider())
        generated = generator.generate(schema=schema, question=request.question, session_id=request.session_id)

        # Execute
        query_result = query_executor.execute(
            engine=session.engine, sql=generated.sql
        )

        # Log query to history
        metadata_store.add_query_history(
            db=db,
            user_id=user.id,
            session_id=request.session_id,
            question=request.question,
            sql=generated.sql,
            database_name=session.database_name,
            db_type=session.db_type,
            execution_time_ms=query_result.execution_time_ms
        )

        # Store in conversation memory ONLY after successful execution
        from app.services.memory import conversation_memory
        conversation_memory.add_exchange(request.session_id, request.question, generated.sql)

        return response_formatter.success(
            FullQueryResponse(
                question=request.question,
                sql=generated.sql,
                model_used=generated.model_used,
                columns=query_result.columns,
                rows=query_result.rows,
                row_count=query_result.row_count,
                execution_time_ms=query_result.execution_time_ms,
            )
        )

    except SessionNotFoundError as exc:
        return JSONResponse(
            status_code=404,
            content=response_formatter.error(exc.message, exc.detail).model_dump(),
        )
    except SQLValidationError as exc:
        return JSONResponse(
            status_code=422,
            content=response_formatter.error(exc.message, exc.detail).model_dump(),
        )
    except AgentBaseException as exc:
        return JSONResponse(
            status_code=400,
            content=response_formatter.error(exc.message, exc.detail).model_dump(),
        )
    except Exception as exc:
        logger.error("Generate-execute pipeline error: %s", exc)
        return JSONResponse(
            status_code=500,
            content=response_formatter.error("Pipeline failed", str(exc)).model_dump(),
        )
