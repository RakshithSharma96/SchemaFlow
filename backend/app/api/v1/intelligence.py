"""
Intelligence endpoints:
  POST /intelligence/analyze      — Stream results explanation
  POST /intelligence/explain-sql  — Stream SQL explanation
  POST /intelligence/suggest      — Generate follow-up questions
  POST /intelligence/chart        — Recommend chart type
"""

from fastapi import APIRouter
from fastapi.responses import JSONResponse, StreamingResponse

from app.models.requests import (
    IntelligenceRequest,
    ExplainSqlRequest,
    ExplainErrorRequest
)
from app.models.responses import (
    ApiResponse,
    SuggestionsResponse,
    ChartConfigResponse
)
from app.services.intelligence import intelligence_service
from app.services.response_formatter import response_formatter
from app.utils.logger import get_logger

router = APIRouter()
logger = get_logger(__name__)


@router.post("/analyze")
async def analyze_results(request: IntelligenceRequest):
    """Stream an AI summary and analysis of the query results."""
    try:
        # Calculate deterministic confidence first
        confidence = intelligence_service.calculate_confidence(request.columns, request.rows)
        
        generator = intelligence_service.analyze_results(
            question=request.question,
            sql=request.sql,
            columns=request.columns,
            rows=request.rows
        )
        return StreamingResponse(
            generator, 
            media_type="text/event-stream",
            headers={"X-Confidence-Score": confidence}
        )
    except Exception as exc:
        logger.error("Analyze error: %s", exc)
        return JSONResponse(
            status_code=500,
            content=response_formatter.error("Analysis failed", str(exc)).model_dump()
        )

@router.post("/explain-sql")
async def explain_sql(request: ExplainSqlRequest):
    """Stream an explanation of the generated SQL query."""
    try:
        generator = intelligence_service.explain_sql(request.sql)
        return StreamingResponse(generator, media_type="text/event-stream")
    except Exception as exc:
        logger.error("Explain SQL error: %s", exc)
        return JSONResponse(
            status_code=500,
            content=response_formatter.error("Explain SQL failed", str(exc)).model_dump()
        )

@router.post("/chart", response_model=ApiResponse[ChartConfigResponse])
async def recommend_chart(request: IntelligenceRequest):
    """Recommend a chart configuration based on the results schema and data."""
    try:
        config = intelligence_service.recommend_chart(
            columns=request.columns,
            rows=request.rows
        )
        # Ensure x_axis and y_axis exist even if the LLM omits them for 'table' type
        resp = ChartConfigResponse(
            chart_type=config.get("chart_type", "table"),
            x_axis=config.get("x_axis"),
            y_axis=config.get("y_axis")
        )
        return response_formatter.success(resp)
    except Exception as exc:
        logger.error("Chart error: %s", exc)
        return JSONResponse(
            status_code=500,
            content=response_formatter.error("Chart failed", str(exc)).model_dump()
        )
