"""
Orchestrator Pipeline.
Coordinates the execution of all independent agents.
"""

from typing import Dict, Any
import asyncio
from app.agents.planner import PlannerAgent
from app.agents.schema import SchemaAgent
from app.agents.sql_gen import SQLAgent
from app.agents.validation import ValidationAgent
from app.agents.execution import ExecutionAgent
from app.agents.statistics import StatisticsAgent
from app.agents.analysis import AnalysisAgent
from app.agents.response_builder import ResponseBuilderAgent
from app.core.observability import get_logger, track_latency
from app.core.security import security_service

logger = get_logger(__name__)

class Orchestrator:
    def __init__(self):
        self.planner = PlannerAgent()
        self.schema_agent = SchemaAgent()
        self.sql_agent = SQLAgent()
        self.validation = ValidationAgent()
        self.executor = ExecutionAgent()
        self.statistics = StatisticsAgent()
        self.analysis = AnalysisAgent()
        self.response_builder = ResponseBuilderAgent()

    async def run_pipeline(self, session_id: str, question: str, db_type: str = "sqlite", user_id: str = None, db=None):
        """
        Main entry point for user queries.
        Executes the multi-agent pipeline and yields Server-Sent Events (SSE).
        """
        context = {
            "session_id": session_id,
            "question": question,
            "db_type": db_type,
            "pipeline_status": "started",
            "user_id": user_id,
            "db": db
        }
        
        with track_latency("OrchestratorPipeline", session_id=session_id):
            try:
                # 1. Planning
                yield {"type": "status", "message": "Planning..."}
                context = await self.planner.execute(context)
                plan = context.get("plan", {})
                
                # 2. Schema Selection
                yield {"type": "status", "message": "Selecting schema..."}
                context = await self.schema_agent.execute(context)
                
                # 3. SQL Generation & Validation
                yield {"type": "status", "message": "Generating SQL..."}
                context = await self.sql_agent.execute(context)
                context = await self.validation.execute(context)
                
                # 4. Execution
                yield {"type": "status", "message": "Executing query..."}
                context = await self.executor.execute(context)
                
                # Yield query results immediately so the UI can show the table
                yield {
                    "type": "query_results", 
                    "data": {
                        "sql": context.get("generated_sql"),
                        "columns": context.get("columns", []),
                        "rows": context.get("rows", []),
                        "row_count": context.get("row_count", 0),
                        "execution_time_ms": context.get("execution_time_ms", 0),
                    }
                }
                
                # 5. Statistics
                yield {"type": "status", "message": "Analyzing statistics..."}
                context = await self.statistics.execute(context)
                
                # 6. Analysis Stream
                context = await self.analysis.execute(context)
                
                # The analysis agent put a generator in context["analysis_stream"]
                analysis_stream = context.get("analysis_stream")
                if analysis_stream:
                    async for chunk in analysis_stream:
                        yield {"type": "analysis_chunk", "chunk": chunk}
                        
                # 7. Response Building
                context = await self.response_builder.execute(context)
                
                # Security Audit Log
                security_service.audit_query(
                    session_id=session_id, 
                    user_intent=plan.get("task", "unknown"),
                    sql=context.get("generated_sql"),
                    success=True
                )
                
                # Save Query History
                if context.get("generated_sql") and plan.get("task") == "sql_analysis":
                    from app.services.metadata_store import metadata_store
                    from app.services.connection_manager import connection_manager
                    session = connection_manager.get_session(session_id)
                    db = context.get("db")
                    user_id = context.get("user_id")
                    if db and user_id:
                        metadata_store.add_query_history(
                            db=db,
                            user_id=user_id,
                            session_id=session_id,
                            question=question,
                            sql=context.get("generated_sql"),
                            database_name=session.database_name,
                            db_type=session.db_type,
                            execution_time_ms=context.get("execution_time_ms", 0)
                        )

                yield {"type": "complete", "data": context.get("final_response", {})}
                
            except Exception as exc:
                logger.error("Pipeline failed", error=str(exc))
                security_service.audit_query(
                    session_id=session_id,
                    user_intent=context.get("plan", {}).get("task", "unknown"),
                    sql=context.get("generated_sql", ""),
                    success=False,
                    error=str(exc)
                )
                yield {"type": "error", "message": str(exc)}

orchestrator = Orchestrator()
