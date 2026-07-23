"""
Context Builder Service.
Responsible for assembling the context prompt from query statistics 
and calculating the deterministic Confidence Score.
"""

from typing import Dict, Any
import json
from app.utils.logger import get_logger

logger = get_logger(__name__)

class ContextBuilder:
    def build_context(self, question: str, sql: str, stats: Dict[str, Any]) -> str:
        """
        Creates a compact structured context string for the LLM.
        """
        context = {
            "question": question,
            "sql": sql,
            "total_rows_returned": stats.get("total_rows", 0),
            "columns": stats.get("columns", []),
            "numeric_statistics": stats.get("numeric_stats", {}),
            "categorical_statistics": stats.get("categorical_stats", {}),
            "sample_data": {
                "top_rows": stats.get("sample_top", []),
                "bottom_rows": stats.get("sample_bottom", [])
            }
        }
        return json.dumps(context, indent=2)

    def calculate_confidence(self, stats: Dict[str, Any]) -> str:
        """
        Calculates a deterministic confidence score (High, Medium, Low)
        based on total rows and null percentages.
        """
        total_rows = stats.get("total_rows", 0)
        if total_rows == 0:
            return "Low"
            
        max_null_pct = 0.0
        
        num_stats = stats.get("numeric_stats", {})
        cat_stats = stats.get("categorical_stats", {})
        
        for col_stat in {**num_stats, **cat_stats}.values():
            nulls = col_stat.get("null_count", 0)
            pct = nulls / total_rows
            if pct > max_null_pct:
                max_null_pct = pct
        
        if total_rows <= 10 or max_null_pct > 0.5:
            return "Low"
        elif total_rows > 100 and max_null_pct < 0.1:
            return "High"
        else:
            return "Medium"

context_builder = ContextBuilder()
