"""
Base Agent Interface.
All agents in the Phase 3 Architecture must inherit from this class.
"""

from abc import ABC, abstractmethod
from typing import Any, Dict
from app.core.observability import track_latency

class BaseAgent(ABC):
    """
    Abstract base class for all pipeline agents.
    Enforces a common interface and automatic latency tracking.
    """
    
    @property
    def name(self) -> str:
        return self.__class__.__name__

    async def execute(self, context: Dict[str, Any], **kwargs) -> Dict[str, Any]:
        """
        Public execution method. Wraps internal execution with latency tracking.
        """
        session_id = context.get("session_id", "unknown")
        
        with track_latency(self.name, session_id=session_id):
            return await self._execute(context, **kwargs)

    @abstractmethod
    async def _execute(self, context: Dict[str, Any], **kwargs) -> Dict[str, Any]:
        """
        Internal execution logic to be implemented by concrete agents.
        Receives the pipeline context and updates it or returns new state.
        """
        pass
