"""
Schema Agent.
Retrieves the schema, masks sensitive data, and uses an LLM to select only the relevant tables/columns.
"""

from typing import Dict, Any, List
import json
from app.agents.base import BaseAgent
from app.core.cache import cache_service
from app.core.security import security_service
from app.llm.factory import get_llm_provider
from app.core.observability import get_logger

logger = get_logger(__name__)

SCHEMA_SELECTION_PROMPT = """
You are the Schema Selection Agent for an Enterprise SQL AI platform.
Your job is to look at the user's question and the full database schema, and select ONLY the tables that are absolutely necessary to answer the question.

Question: {question}

Full Schema:
{schema_json}

Return ONLY a JSON object containing a list of strings representing the necessary tables.
Format:
{{
  "relevant_tables": ["table1", "table2"]
}}
"""

class SchemaAgent(BaseAgent):
    async def _execute(self, context: Dict[str, Any], **kwargs) -> Dict[str, Any]:
        plan = context.get("plan", {})
        if not plan.get("needs_schema", False):
            context["schema"] = None
            return context

        session_id = context.get("session_id")
        question = context.get("question")
        
        # 1. Fetch from Cache
        raw_schema = cache_service.get_schema(session_id)
        if not raw_schema:
            raise ValueError(f"Schema not found in cache for session {session_id}. Cannot proceed.")
            
        # Extract tables list from SchemaInfo format if needed
        tables = raw_schema
        if isinstance(raw_schema, dict) and "tables" in raw_schema:
            tables = raw_schema["tables"]
            
        # 2. Security Masking (Deterministic Filtering)
        safe_schema = security_service.filter_schema(tables)
        
        # 3. LLM-based Table Selection
        # If the schema is small (e.g., <= 5 tables), just return it to save an LLM call.
        if len(safe_schema) <= 5:
            logger.info("Schema is small, skipping LLM selection.")
            context["schema"] = safe_schema
            return context
            
        llm = get_llm_provider()
        
        # To save tokens in the selection prompt, we only pass table names and column names
        minified_schema = [
            {
                "name": t.get("name"), 
                "columns": [c.get("name") for c in t.get("columns", [])]
            } for t in safe_schema
        ]
        
        prompt = SCHEMA_SELECTION_PROMPT.format(
            question=question,
            schema_json=json.dumps(minified_schema, indent=2)
        )
        
        try:
            messages = [{"role": "user", "content": prompt}]
            response_text = await llm.generate_response(messages)
            
            if "```json" in response_text:
                 response_text = response_text.split("```json")[1].split("```")[0]
                 
            selection = json.loads(response_text)
            relevant_tables = [t.lower() for t in selection.get("relevant_tables", [])]
            
            # Filter the safe_schema
            filtered_schema = [t for t in safe_schema if t.get("name", "").lower() in relevant_tables]
            
            if not filtered_schema:
                # Fallback if LLM messes up
                logger.warn("LLM table selection returned empty. Using full safe schema.")
                filtered_schema = safe_schema
                
            context["schema"] = filtered_schema
            
        except Exception as exc:
            logger.warn(f"Schema selection failed: {exc}. Using full safe schema.")
            context["schema"] = safe_schema
            
        return context
