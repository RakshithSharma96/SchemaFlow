"""Health check endpoint."""

from fastapi import APIRouter
from app.models.responses import ApiResponse, HealthResponse

router = APIRouter()


@router.get("/health", response_model=ApiResponse[HealthResponse])
async def health_check():
    """Returns server status and LLM provider info."""
    return ApiResponse(
        success=True,
        data=HealthResponse(status="ok"),
    )
