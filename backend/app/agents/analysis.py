"""
Analysis Agent.
Generates structured business insights based on the query results and NumPy statistics.
"""

from typing import Dict, Any
from app.agents.base import BaseAgent
from app.llm.factory import get_llm_provider
from app.core.observability import get_logger
from app.services.context_builder import context_builder

logger = get_logger(__name__)

class AnalysisAgent(BaseAgent):
    async def _execute(self, context: Dict[str, Any], **kwargs) -> Dict[str, Any]:
        plan = context.get("plan", {})
        if plan.get("task") != "sql_analysis":
            return context

        question = context.get("question")
        sql = context.get("generated_sql")
        stats = context.get("statistics")
        
        if not stats:
            logger.warn("No statistics found for Analysis Agent. Skipping analysis.")
            return context

        # 1. Build prompt context
        prompt = context_builder.build_analysis_prompt(question, sql, stats)
        
        # 2. Compute confidence deterministically
        confidence = context_builder.calculate_confidence(stats["total_rows"], stats["numeric_stats"], stats["categorical_stats"])
        
        # 3. Call LLM
        llm = get_llm_provider()
        
        # We return the generator so it can be streamed to the client by the API router
        try:
            generator = llm.generate_json_stream([
                {"role": "system", "content": "You are an Enterprise AI Data Analyst. Return a JSON object with executive_summary, key_insights, patterns, limitations, and suggested_questions."},
                {"role": "user", "content": prompt}
            ])
            context["analysis_stream"] = generator
            context["confidence_score"] = confidence
        except Exception as exc:
            logger.error("Analysis generation failed", error=str(exc))
            # Even if analysis fails, we can still return the raw sql results
            
        return context
