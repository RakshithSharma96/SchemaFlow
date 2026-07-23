"""
SQL Agent.
Generates SQL based on the filtered schema and the user's question.
Does NOT perform any analysis, explanation, or chart recommendation.
"""

from typing import Dict, Any
from app.agents.base import BaseAgent
from app.llm.factory import get_llm_provider
from app.core.observability import get_logger

logger = get_logger(__name__)

SQL_GENERATION_PROMPT = """
You are the SQL Generation Agent for an Enterprise SQL AI platform.
Your ONLY job is to generate a valid SQL query for the given database dialect that answers the user's question based on the provided schema.

Database Dialect: {db_type}

Filtered Schema:
{schema_json}

Question: {question}

Rules:
1. ONLY return the SQL query.
2. Do not explain the query.
3. Do not include markdown blocks like ```sql ... ```. Just the raw text.
4. Do not include any apologies or conversation.
5. If the question cannot be answered with the given schema, output: SELECT 'Error: Cannot answer question with available data' AS error;
"""

class SQLAgent(BaseAgent):
    async def _execute(self, context: Dict[str, Any], **kwargs) -> Dict[str, Any]:
        plan = context.get("plan", {})
        if plan.get("task") != "sql_analysis":
            # If we just need explanation, we skip generation
            return context

        db_type = context.get("db_type", "sqlite")
        question = context.get("question")
        schema = context.get("schema")
        
        if not schema:
            raise ValueError("Schema missing from context before SQL generation.")
            
        import json
        llm = get_llm_provider()
        
        prompt = SQL_GENERATION_PROMPT.format(
            db_type=db_type,
            schema_json=json.dumps(schema, indent=2),
            question=question
        )
        
        try:
            messages = [{"role": "user", "content": prompt}]
            raw_sql = await llm.generate_response(messages)
            
            # Clean up potential markdown formatting
            sql = raw_sql.strip()
            if sql.lower().startswith("```sql"):
                sql = sql[6:]
            if sql.startswith("```"):
                sql = sql[3:]
            if sql.endswith("```"):
                sql = sql[:-3]
                
            context["generated_sql"] = sql.strip()
            
        except Exception as exc:
            logger.error("SQL generation failed", error=str(exc))
            raise
            
        return context
