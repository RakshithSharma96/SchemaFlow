"""
NVIDIA LLM provider.
Uses the OpenAI Python SDK to call NVIDIA NIM free-tier API endpoints.
"""

from typing import List, Dict, Generator
import time
from openai import OpenAI
from app.llm.base import LLMProvider
from app.config import get_settings
from app.utils.exceptions import LLMConfigurationError, LLMProviderError
from app.utils.logger import get_logger

logger = get_logger(__name__)


class NvidiaProvider(LLMProvider):
    """
    LLM provider backed by the NVIDIA NIM API.
    Offers free-tier access to massive open-source models (120B+)
    with very fast inference.
    """

    def __init__(self, model_override: str = None):
        settings = get_settings()

        if not settings.nvidia_api_key:
            raise LLMConfigurationError(
                "NVIDIA API key not configured",
                detail="Set NVIDIA_API_KEY in your .env file. "
                       "Get a free key at https://build.nvidia.com",
            )

        self._model = model_override or settings.nvidia_model
        self._client = OpenAI(
            base_url="https://integrate.api.nvidia.com/v1",
            api_key=settings.nvidia_api_key
        )
        logger.info("NvidiaProvider initialized — model: %s", self._model)

    def generate(self, system_prompt: str, user_prompt: str) -> str:
        """Call NVIDIA API and return the text response."""
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ]
        return self.generate_chat(messages)
        
    def generate_chat(self, messages: List[Dict[str, str]]) -> str:
        """Call NVIDIA API with conversation history and return the text response."""
        try:
            completion = self._client.chat.completions.create(
                model=self._model,
                messages=messages,
                temperature=0.1,
                max_tokens=4096,
            )
            response = completion.choices[0].message.content or ""
            logger.debug("Nvidia chat response received (%d chars)", len(response))
            return response
        except Exception as exc:
            logger.error(
                "Nvidia API error [%s]: %s",
                type(exc).__name__,
                str(exc),
            )
            raise LLMProviderError(
                "Nvidia API request failed",
                detail=f"{type(exc).__name__}: {str(exc)}",
            ) from exc

    def generate_stream(self, messages: List[Dict[str, str]]) -> Generator[str, None, None]:
        """Call NVIDIA API and yield response tokens via streaming."""
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
                "Nvidia API streaming error [%s]: %s",
                type(exc).__name__,
                str(exc),
            )
            raise LLMProviderError(
                "Nvidia API request failed during stream",
                detail=f"{type(exc).__name__}: {str(exc)}",
            ) from exc

    def generate_json_stream(self, messages: List[Dict[str, str]]) -> Generator[str, None, None]:
        """Call NVIDIA API and yield response tokens via streaming, enforcing JSON output."""
        try:
            completion = self._client.chat.completions.create(
                model=self._model,
                messages=messages,
                temperature=0.1,
                max_tokens=4096,
                stream=True,
                # Not all NVIDIA models support response_format={"type": "json_object"}
                # So we stream standard JSON string and rely on prompts
            )
            for chunk in completion:
                if chunk.choices and len(chunk.choices) > 0:
                    token = chunk.choices[0].delta.content
                    if token:
                        time.sleep(0.02)
                        yield token
        except Exception as exc:
            logger.error(
                "Nvidia API JSON streaming error [%s]: %s",
                type(exc).__name__,
                str(exc),
            )
            raise LLMProviderError(
                "Nvidia API JSON request failed during stream",
                detail=f"{type(exc).__name__}: {str(exc)}",
            ) from exc

    def get_model_name(self) -> str:
        return self._model
