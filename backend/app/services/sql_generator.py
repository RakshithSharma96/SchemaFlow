"""
SQL Generator Service.
Orchestrates prompt building + LLM call + SQL validation.
"""

from app.llm.base import LLMProvider
from app.models.responses import GeneratedSQL, SchemaInfo
from app.services.prompt_builder import prompt_builder
from app.services.sql_validator import sql_validator
from app.services.memory import conversation_memory
from app.utils.exceptions import SQLGenerationError
from app.utils.logger import get_logger

logger = get_logger(__name__)


class SQLGenerator:
    """
    Converts a natural-language question into validated SQL.
    Depends on LLMProvider (injected) and module-level singletons
    for prompt_builder and sql_validator.
    """

    def __init__(self, llm_provider: LLMProvider):
        self._llm = llm_provider

    def generate(self, schema: SchemaInfo, question: str, session_id: str | None = None) -> GeneratedSQL:
        """
        Full pipeline: question → prompt → LLM → validate → GeneratedSQL.

        Args:
            schema: Extracted schema for the connected database.
            question: User's natural language question.
            session_id: Optional session ID to fetch and store conversation history.

        Returns:
            GeneratedSQL with the validated SQL and metadata.

        Raises:
            SQLGenerationError: If the LLM fails to produce SQL.
            SQLValidationError: If the SQL fails safety validation.
            LLMProviderError: On LLM API failure.
        """
        logger.info("Generating SQL for question: '%s'", question[:80])

        # 1. Build prompt
        system_prompt, user_prompt = prompt_builder.build(schema, question)
        
        # 2. Build conversation messages
        messages = [{"role": "system", "content": system_prompt}]
        if session_id:
            history = conversation_memory.get_history(session_id)
            messages.extend(history)
        messages.append({"role": "user", "content": user_prompt})

        # 3. Call LLM
        try:
            raw_response = self._llm.generate_chat(messages)
        except Exception as exc:
            raise SQLGenerationError(
                "LLM failed to generate SQL",
                detail=str(exc),
            ) from exc

        if not raw_response or not raw_response.strip():
            raise SQLGenerationError(
                "LLM returned an empty response",
                detail="The model did not produce any SQL.",
            )

        # 4. Validate SQL (raises SQLValidationError on failure)
        validated_sql = sql_validator.validate(raw_response)

        logger.info(
            "SQL generated successfully (%d chars) model=%s",
            len(validated_sql), self._llm.get_model_name(),
        )

        return GeneratedSQL(
            sql=validated_sql,
            question=question,
            model_used=self._llm.get_model_name(),
        )
