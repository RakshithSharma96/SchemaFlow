"""
Validation Agent.
Ensures the SQL is safe, read-only, and valid.
"""

from typing import Dict, Any
import re
from app.agents.base import BaseAgent
from app.utils.exceptions import SQLValidationError
from app.core.observability import get_logger

logger = get_logger(__name__)

# List of forbidden SQL operations (destructive)
FORBIDDEN_KEYWORDS = [
    "INSERT", "UPDATE", "DELETE", "DROP", "ALTER", 
    "TRUNCATE", "REPLACE", "GRANT", "REVOKE", 
    "COMMIT", "ROLLBACK", "EXEC", "EXECUTE", 
    "MERGE", "CALL"
]

class ValidationAgent(BaseAgent):
    async def _execute(self, context: Dict[str, Any], **kwargs) -> Dict[str, Any]:
        plan = context.get("plan", {})
        if plan.get("task") != "sql_analysis":
            return context

        sql = context.get("generated_sql")
        if not sql:
            raise SQLValidationError("No SQL was generated to validate.")
            
        # 1. Multiple Statement Check
        # Basic check: if there is an unquoted semicolon followed by another statement
        if ";" in sql:
            parts = [p.strip() for p in sql.split(";") if p.strip()]
            if len(parts) > 1:
                raise SQLValidationError("Multiple SQL statements are not permitted.")

        # 2. Destructive Command Check
        upper_sql = sql.upper()
        # Find all words
        words = set(re.findall(r'\b\w+\b', upper_sql))
        
        for keyword in FORBIDDEN_KEYWORDS:
            if keyword in words:
                raise SQLValidationError(f"Destructive operation '{keyword}' is not permitted.")
                
        # 3. Very basic SQL Injection attempt detection
        if "--" in sql or "/*" in sql:
            # We allow comments, but log them as potentially suspicious
            logger.warn("SQL contains comments", sql=sql)
            
        # If we pass all checks, mark as validated
        context["is_validated"] = True
        logger.info("SQL Validation passed")
        
        return context
