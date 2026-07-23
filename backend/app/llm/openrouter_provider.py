"""
OpenRouter LLM provider.
Uses the OpenAI Python SDK to call OpenRouter API endpoints.
"""

from typing import List, Dict, Generator
import time
from openai import OpenAI
from app.llm.base import LLMProvider
from app.config import get_settings
from app.utils.exceptions import LLMConfigurationError, LLMProviderError
from app.utils.logger import get_logger

logger = get_logger(__name__)


class OpenRouterProvider(LLMProvider):
    """
    LLM provider backed by the OpenRouter API.
    Offers access to a wide variety of models.
    """

    def __init__(self, model_override: str = None):
        settings = get_settings()

        if not settings.openrouter_api_key:
            raise LLMConfigurationError(
                "OpenRouter API key not configured",
                detail="Set OPENROUTER_API_KEY in your .env file.",
            )

        self._model = model_override or settings.openrouter_model
        self._client = OpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=settings.openrouter_api_key
        )
        logger.info("OpenRouterProvider initialized — model: %s", self._model)

    def generate(self, system_prompt: str, user_prompt: str) -> str:
        """Call OpenRouter API and return the text response."""
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ]
        return self.generate_chat(messages)
        
    def generate_chat(self, messages: List[Dict[str, str]]) -> str:
        """Call OpenRouter API with conversation history and return the text response."""
        try:
            completion = self._client.chat.completions.create(
                model=self._model,
                messages=messages,
                temperature=0.1,
                max_tokens=4096,
            )
            response = completion.choices[0].message.content or ""
            logger.debug("OpenRouter chat response received (%d chars)", len(response))
            return response
        except Exception as exc:
            logger.error(
                "OpenRouter API error [%s]: %s",
                type(exc).__name__,
                str(exc),
            )
            raise LLMProviderError(
                "OpenRouter API request failed",
                detail=f"{type(exc).__name__}: {str(exc)}",
            ) from exc

    def generate_stream(self, messages: List[Dict[str, str]]) -> Generator[str, None, None]:
        """Call OpenRouter API and yield response tokens via streaming."""
        try:
            completion = self._client.chat.completions.create(
                model=self._model,
                messages=messages,
                temperature=0.2,
                max_tokens=4096,
                stream=True
            )
            for chunk in completion:
                if chunk.choices and len(chunk.choices) > 0:
                    token = chunk.choices[0].delta.content
                    if token:
                        time.sleep(0.02)
                        yield token
        except Exception as exc:
            logger.error(
                "OpenRouter API streaming error [%s]: %s",
                type(exc).__name__,
                str(exc),
            )
            raise LLMProviderError(
                "OpenRouter API request failed during stream",
                detail=f"{type(exc).__name__}: {str(exc)}",
            ) from exc

    def generate_json_stream(self, messages: List[Dict[str, str]]) -> Generator[str, None, None]:
        """Call OpenRouter API and yield response tokens via streaming, enforcing JSON output."""
        try:
            completion = self._client.chat.completions.create(
                model=self._model,
                messages=messages,
                temperature=0.1,
                max_tokens=4096,
                stream=True,
            )
            for chunk in completion:
                if chunk.choices and len(chunk.choices) > 0:
                    token = chunk.choices[0].delta.content
                    if token:
                        time.sleep(0.02)
                        yield token
        except Exception as exc:
            logger.error(
                "OpenRouter API JSON streaming error [%s]: %s",
                type(exc).__name__,
                str(exc),
            )
            raise LLMProviderError(
                "OpenRouter API JSON request failed during stream",
                detail=f"{type(exc).__name__}: {str(exc)}",
            ) from exc

    def get_model_name(self) -> str:
        return self._model
