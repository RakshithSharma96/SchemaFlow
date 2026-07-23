"""
Conversation Memory Service.
Stores conversation history per session to provide contextual awareness
to the LLM for follow-up questions.
"""

from typing import List, Dict
import threading
from app.utils.logger import get_logger

logger = get_logger(__name__)


class ConversationMemory:
    """
    In-memory storage for conversational history.
    Limits history to a reasonable number of recent exchanges to manage context window.
    """
    def __init__(self, max_history: int = 10):
        # Maps session_id -> list of message dicts (role, content)
        self._store: Dict[str, List[Dict[str, str]]] = {}
        self._lock = threading.Lock()
        # Max number of messages to retain per session
        self._max_history = max_history

    def get_history(self, session_id: str) -> List[Dict[str, str]]:
        """Retrieve a copy of the current history for the session."""
        with self._lock:
            return list(self._store.get(session_id, []))

    def add_exchange(self, session_id: str, question: str, sql: str) -> None:
        """Add a complete user->assistant exchange to the history."""
        with self._lock:
            if session_id not in self._store:
                self._store[session_id] = []
            
            # The LLM generates SQL, so we store the user's question and the SQL response
            self._store[session_id].append({"role": "user", "content": question})
            self._store[session_id].append({"role": "assistant", "content": sql})
            
            # Truncate to max_history to prevent blowing up the LLM context window
            if len(self._store[session_id]) > self._max_history:
                self._store[session_id] = self._store[session_id][-self._max_history:]
                
            logger.debug(
                "Added exchange to session %s (history length: %d)",
                session_id, len(self._store[session_id])
            )

    def clear(self, session_id: str) -> None:
        """Clear the history for a session."""
        with self._lock:
            if self._store.pop(session_id, None) is None:
                logger.debug("Attempted to clear non-existent session %s", session_id)
            else:
                logger.debug("Cleared memory for session %s", session_id)


# Module-level singleton
conversation_memory = ConversationMemory()
