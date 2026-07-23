"""
Statistics Agent.
Computes comprehensive statistical analysis using NumPy, including quartiles, percentiles, and basic outlier detection.
"""

from typing import Dict, Any, List
import numpy as np
from app.agents.base import BaseAgent
from app.core.observability import get_logger

logger = get_logger(__name__)

class StatisticsAgent(BaseAgent):
    async def _execute(self, context: Dict[str, Any], **kwargs) -> Dict[str, Any]:
        plan = context.get("plan", {})
        if not plan.get("needs_statistics", False):
            context["statistics"] = None
            return context

        columns = context.get("columns", [])
        rows = context.get("rows", [])
        
        total_rows = len(rows)
        if total_rows == 0:
            context["statistics"] = {
                "total_rows": 0,
                "columns": [],
                "numeric_stats": {},
                "categorical_stats": {},
                "sample_top": [],
                "sample_bottom": []
            }
            return context
            
        numeric_stats = {}
        categorical_stats = {}
        col_types = []
        
        for col_idx, col_name in enumerate(columns):
            col_data = [row[col_idx] for row in rows]
            null_count = sum(1 for x in col_data if x is None)
            
            try:
                valid_data = [x for x in col_data if x is not None]
                if not valid_data:
                    col_types.append("empty")
                    continue
                    
                if all(isinstance(x, bool) for x in valid_data):
                    raise ValueError("Boolean is categorical")
                    
                # Float conversion test
                numeric_array = np.array(valid_data, dtype=float)
                
                # Percentiles and IQR
                q1 = float(np.percentile(numeric_array, 25))
                q3 = float(np.percentile(numeric_array, 75))
                iqr = q3 - q1
                
                # Basic Outlier Detection (1.5 * IQR rule)
                lower_bound = q1 - 1.5 * iqr
                upper_bound = q3 + 1.5 * iqr
                outliers = [float(x) for x in numeric_array if x < lower_bound or x > upper_bound]
                
                col_types.append("numeric")
                numeric_stats[col_name] = {
                    "null_count": null_count,
                    "min": float(np.min(numeric_array)),
                    "max": float(np.max(numeric_array)),
                    "mean": float(np.mean(numeric_array)),
                    "median": float(np.median(numeric_array)),
                    "stddev": float(np.std(numeric_array)),
                    "p25": q1,
                    "p75": q3,
                    "outlier_count": len(outliers)
                }
            except (ValueError, TypeError):
                col_types.append("categorical")
                
                valid_data_str = [str(x) for x in col_data if x is not None]
                unique_vals, counts = np.unique(valid_data_str, return_counts=True)
                
                sort_idx = np.argsort(-counts)
                top_values = unique_vals[sort_idx][:3].tolist()
                
                categorical_stats[col_name] = {
                    "null_count": null_count,
                    "distinct_count": len(unique_vals),
                    "top_values": top_values
                }

        if total_rows <= 25:
            sample_top = rows
            sample_bottom = []
        else:
            sample_top = rows[:10]
            sample_bottom = rows[-10:]

        context["statistics"] = {
            "total_rows": total_rows,
            "columns": [{"name": c, "type": t} for c, t in zip(columns, col_types)],
            "numeric_stats": numeric_stats,
            "categorical_stats": categorical_stats,
            "sample_top": sample_top,
            "sample_bottom": sample_bottom
        }
        
        return context
