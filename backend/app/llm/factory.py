"""
LLM Provider Factory.
Returns the configured provider via dependency injection.
"""

from functools import lru_cache
from app.llm.base import LLMProvider
from app.llm.openrouter_provider import OpenRouterProvider
from app.utils.logger import get_logger

logger = get_logger(__name__)


@lru_cache(maxsize=1)
def get_llm_provider() -> LLMProvider:
    """
    Return the active LLM provider singleton.
    Cached so the client is instantiated once per process.
    """
    logger.info("Initializing LLM provider: OpenRouter")
    return OpenRouterProvider()

@lru_cache(maxsize=1)
def get_fast_llm_provider() -> LLMProvider:
    """
    Return a fast LLM provider specifically for intelligence tasks
    (analysis, explanations, chart recommendations) that shouldn't use 
    slower reasoning models.
    """
    logger.info("Initializing Fast LLM provider: OpenRouter")
    return OpenRouterProvider()
