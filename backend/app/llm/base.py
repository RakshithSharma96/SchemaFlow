"""
Abstract base class for all LLM providers.
Concrete providers must implement generate, generate_chat, and generate_stream.
"""

from abc import ABC, abstractmethod
from typing import List, Dict, Generator


class LLMProvider(ABC):
    """
    Provider interface for LLM text generation.
    """

    @abstractmethod
    def generate(self, system_prompt: str, user_prompt: str) -> str:
        """
        Send a prompt to the LLM and return the text response.
        """
        ...
        
    @abstractmethod
    def generate_chat(self, messages: List[Dict[str, str]]) -> str:
        """
        Send a list of messages (history) to the LLM and return the text response.
        Each dict should have 'role' (system, user, assistant) and 'content'.
        """
        ...
        
    @abstractmethod
    def generate_stream(self, messages: List[Dict[str, str]]) -> Generator[str, None, None]:
        """
        Send a list of messages and yield token strings as they are generated.
        """
        ...
        
    @abstractmethod
    def generate_json_stream(self, messages: List[Dict[str, str]]) -> Generator[str, None, None]:
        """
        Send a list of messages and yield token strings as they are generated, enforcing JSON output.
        """
        ...

    @abstractmethod
    def get_model_name(self) -> str:
        """Return the identifier of the model being used."""
        ...
