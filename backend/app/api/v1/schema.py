"""
Schema retrieval endpoint.
Returns cached schema for an active session, or extracts fresh schema.
"""

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from app.models.responses import ApiResponse, SchemaInfo
from app.services.connection_manager import connection_manager
from app.services.schema_extractor import schema_extractor
from app.services.response_formatter import response_formatter
from app.utils.exceptions import AgentBaseException, SessionNotFoundError
from app.utils.logger import get_logger

router = APIRouter()
logger = get_logger(__name__)


@router.get("/{session_id}/schema", response_model=ApiResponse[SchemaInfo])
async def get_schema(session_id: str, force_refresh: bool = False):
    """
    Return the schema for the connected database.
    Serves from in-memory cache on repeat calls; extracts fresh on first call.
    """
    try:
        session = connection_manager.get_session(session_id)

        # Serve from cache if available and not forcing refresh
        if not force_refresh:
            cached = connection_manager.get_schema_cache(session_id)
            if cached:
                logger.debug("Schema cache hit for session %s", session_id)
                return response_formatter.success(SchemaInfo(**cached))

        # Extract fresh schema
        schema = schema_extractor.extract(
            engine=session.engine,
            database_name=session.database_name,
            db_type=session.db_type,
        )

        # Store in cache
        connection_manager.set_schema_cache(session_id, schema.model_dump())

        return response_formatter.success(schema)

    except SessionNotFoundError as exc:
        return JSONResponse(
            status_code=404,
            content=response_formatter.error(exc.message, exc.detail).model_dump(),
        )
    except AgentBaseException as exc:
        return JSONResponse(
            status_code=400,
            content=response_formatter.error(exc.message, exc.detail).model_dump(),
        )
    except Exception as exc:
        logger.error("Schema extraction failed: %s", exc)
        return JSONResponse(
            status_code=500,
            content=response_formatter.error(
                "Failed to extract schema", str(exc)
            ).model_dump(),
        )
