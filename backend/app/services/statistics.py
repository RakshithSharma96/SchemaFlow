"""
Statistics Service using NumPy.
Computes row counts, column types, means, medians, null counts, 
and extracts sample data (top/bottom rows) before passing it to the LLM context builder.
"""

from typing import List, Dict, Any
import numpy as np
from app.utils.logger import get_logger

logger = get_logger(__name__)


class StatisticsService:
    def analyze(self, columns: List[str], rows: List[List[Any]]) -> Dict[str, Any]:
        """
        Takes raw columns and rows from a SQL query execution and computes
        summary statistics using NumPy.
        """
        total_rows = len(rows)
        if total_rows == 0:
            return {
                "total_rows": 0,
                "columns": [],
                "numeric_stats": {},
                "categorical_stats": {},
                "sample_top": [],
                "sample_bottom": []
            }
            
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
                
                col_types.append("numeric")
                numeric_stats[col_name] = {
                    "null_count": null_count,
                    "min": float(np.min(numeric_array)),
                    "max": float(np.max(numeric_array)),
                    "mean": float(np.mean(numeric_array)),
                    "median": float(np.median(numeric_array)),
                    "stddev": float(np.std(numeric_array))
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

        # Extract samples (max 10 rows top, 10 rows bottom, or all if <= 25)
        if total_rows <= 25:
            sample_top = rows
            sample_bottom = []
        else:
            sample_top = rows[:10]
            sample_bottom = rows[-10:]

        return {
            "total_rows": total_rows,
            "columns": [{"name": c, "type": t} for c, t in zip(columns, col_types)],
            "numeric_stats": numeric_stats,
            "categorical_stats": categorical_stats,
            "sample_top": sample_top,
            "sample_bottom": sample_bottom
        }

statistics_service = StatisticsService()
