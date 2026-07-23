"""
Orchestrator API Endpoints.
Provides a unified SSE endpoint for the full Enterprise AI Pipeline.
"""

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
import json
from sqlalchemy.orm import Session
from app.models.requests import IntelligenceRequest
from app.orchestrator.pipeline import orchestrator
from app.utils.logger import get_logger
from app.api.deps import get_current_user
from app.models.domain import User
from app.db.database import get_db
from app.services.connection_manager import connection_manager

router = APIRouter()
logger = get_logger(__name__)

@router.post("/ask")
async def ask_orchestrator(
    request: IntelligenceRequest, 
    session_id: str, 
    user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """
    Unified endpoint that streams status updates, SQL results, and AI analysis.
    """
    async def sse_generator():
        # Get db_type from the session manager
        try:
            db_session = connection_manager.get_session(session_id)
            db_type = db_session.db_type
        except Exception:
            db_type = "sqlite"

        try:
            async for event in orchestrator.run_pipeline(session_id, request.question, db_type, user_id=user.id, db=db):
                # Format as Server-Sent Events (SSE)
                yield f"data: {json.dumps(event)}\n\n"
        except Exception as e:
            logger.error("SSE stream error", error=str(e))
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(sse_generator(), media_type="text/event-stream")
