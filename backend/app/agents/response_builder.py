"""
Response Builder Agent.
Merges outputs from all previous agents into a single structured payload.
"""

from typing import Dict, Any
from app.agents.base import BaseAgent
from app.core.observability import get_logger

logger = get_logger(__name__)

class ResponseBuilderAgent(BaseAgent):
    async def _execute(self, context: Dict[str, Any], **kwargs) -> Dict[str, Any]:
        plan = context.get("plan", {})
        
        # We ensure a consistent shape for the orchestrator to return
        response = {
            "task": plan.get("task"),
            "question": context.get("question"),
            "session_id": context.get("session_id"),
            "db_type": context.get("db_type")
        }
        
        if plan.get("task") == "sql_analysis":
            response.update({
                "sql": context.get("generated_sql"),
                "columns": context.get("columns", []),
                "rows": context.get("rows", []),
                "row_count": context.get("row_count", 0),
                "execution_time_ms": context.get("execution_time_ms", 0),
                "statistics": context.get("statistics"),
                "analysis_stream": context.get("analysis_stream"),
                "confidence_score": context.get("confidence_score", "Medium"),
                "chart_config": context.get("chart_config")
            })
            
        elif plan.get("task") == "explain_sql":
            response.update({
                "sql": context.get("generated_sql"),
                "explanation_stream": context.get("explanation_stream")
            })
            
        context["final_response"] = response
        logger.info("Response built successfully")
        
        return context
