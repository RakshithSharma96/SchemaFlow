"""
Response Formatter Service.
Standardizes all API responses into the ApiResponse envelope.
"""

from typing import Any
from app.models.responses import ApiResponse
from app.utils.logger import get_logger

logger = get_logger(__name__)


class ResponseFormatter:
    """
    Wraps data or errors in the standard ApiResponse envelope.
    Keeps endpoint handlers thin by centralising response shaping.
    """

    @staticmethod
    def success(data: Any) -> ApiResponse:
        return ApiResponse(success=True, data=data)

    @staticmethod
    def error(message: str, detail: str | None = None) -> ApiResponse:
        logger.warning("API error: %s | detail: %s", message, detail)
        return ApiResponse(success=False, error=message, detail=detail)


# Module-level singleton
response_formatter = ResponseFormatter()
