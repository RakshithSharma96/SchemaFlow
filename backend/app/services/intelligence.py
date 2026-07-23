"""
Enterprise Intelligence Service.
Responsible for analyzing query results, explaining SQL, suggesting follow-ups,
and recommending visualizations deterministically.
"""

from typing import List, Dict, Any, Generator
import json
from app.llm.factory import get_llm_provider, get_fast_llm_provider
from app.services.statistics import statistics_service
from app.services.context_builder import context_builder
from app.services.prompts.analysis_prompt import ANALYSIS_SYSTEM_PROMPT, EXPLAIN_SQL_PROMPT, EXPLAIN_ERROR_PROMPT
from app.utils.logger import get_logger

logger = get_logger(__name__)


class IntelligenceService:
    def _get_llm(self):
        return get_fast_llm_provider()

    def analyze_results(self, question: str, sql: str, columns: List[str], rows: List[List[Any]]) -> Generator[str, None, None]:
        """
        Calculates statistics, builds context, and streams structured JSON analysis 
        from the LLM.
        """
        # 1. Compute stats using NumPy
        stats = statistics_service.analyze(columns, rows)
        
        # 2. Build compact context for LLM
        user_context = context_builder.build_context(question, sql, stats)
        
        llm = self._get_llm()
        messages = [
            {"role": "system", "content": ANALYSIS_SYSTEM_PROMPT}, 
            {"role": "user", "content": user_context}
        ]
        
        # Stream the JSON string
        return llm.generate_json_stream(messages)
        
    def calculate_confidence(self, columns: List[str], rows: List[List[Any]]) -> str:
        stats = statistics_service.analyze(columns, rows)
        return context_builder.calculate_confidence(stats)

    def explain_sql(self, sql: str) -> Generator[str, None, None]:
        """Stream an explanation of the SQL logic."""
        llm = self._get_llm()
        messages = [
            {"role": "system", "content": EXPLAIN_SQL_PROMPT}, 
            {"role": "user", "content": f"Explain this SQL:\n{sql}"}
        ]
        return llm.generate_stream(messages)

    def recommend_chart(self, columns: List[str], rows: List[List[Any]]) -> Dict[str, Any]:
        """
        Deterministically recommend a chart type based on column types using backend heuristics.
        No LLM is used.
        """
        stats = statistics_service.analyze(columns, rows)
        col_types = stats.get("columns", [])
        
        num_cols = [c["name"] for c in col_types if c["type"] == "numeric"]
        cat_cols = [c["name"] for c in col_types if c["type"] == "categorical"]
        
        if len(num_cols) == 2 and len(cat_cols) == 0:
            return {"chart_type": "scatter", "x_axis": num_cols[0], "y_axis": num_cols[1]}
        elif len(cat_cols) == 1 and len(num_cols) >= 1:
            cat_name = cat_cols[0].lower()
            if any(x in cat_name for x in ["date", "time", "year", "month", "day"]):
                return {"chart_type": "line", "x_axis": cat_cols[0], "y_axis": num_cols[0]}
            else:
                return {"chart_type": "bar", "x_axis": cat_cols[0], "y_axis": num_cols[0]}
        elif len(num_cols) == 1 and len(cat_cols) == 0:
            return {"chart_type": "histogram", "x_axis": num_cols[0], "y_axis": None}
            
        return {"chart_type": "table"}

    def explain_error(self, error_msg: str, sql: str) -> str:
        """Explain an execution error."""
        llm = self._get_llm()
        messages = [
            {"role": "system", "content": EXPLAIN_ERROR_PROMPT}, 
            {"role": "user", "content": f"SQL: {sql}\nError: {error_msg}"}
        ]
        return llm.generate_chat(messages)


# Module-level singleton
intelligence_service = IntelligenceService()
