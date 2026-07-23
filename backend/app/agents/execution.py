"""
Execution Agent.
Executes the validated SQL against the database, records execution time, and returns raw results.
"""

from typing import Dict, Any
from app.agents.base import BaseAgent
from app.services.connection_manager import connection_manager
from app.core.observability import get_logger

logger = get_logger(__name__)

class ExecutionAgent(BaseAgent):
    async def _execute(self, context: Dict[str, Any], **kwargs) -> Dict[str, Any]:
        plan = context.get("plan", {})
        if plan.get("task") != "sql_analysis":
            return context

        if not context.get("is_validated"):
            raise RuntimeError("Cannot execute unvalidated SQL.")
            
        session_id = context.get("session_id")
        sql = context.get("generated_sql")
        
        try:
            result = connection_manager.execute_query(session_id, sql)
            
            context["columns"] = result["columns"]
            context["rows"] = result["rows"]
            context["row_count"] = result["row_count"]
            context["execution_time_ms"] = result["execution_time_ms"]
            
            logger.info("SQL Execution successful", row_count=result["row_count"])
            
        except Exception as exc:
            logger.error("Execution failed", error=str(exc))
            raise
            
        return context
