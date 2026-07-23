"""
Unified Caching Core.
Provides TTL caching for schema, analysis results, and connections.
"""

from cachetools import TTLCache
from typing import Any, Optional
from app.core.observability import get_logger

logger = get_logger(__name__)

# Cache instances
# Schema cache: 1 hour TTL, max 100 schemas
schema_cache = TTLCache(maxsize=100, ttl=3600)

# Analysis cache: 10 minutes TTL, max 500 query results
analysis_cache = TTLCache(maxsize=500, ttl=600)

class CacheService:
    @staticmethod
    def get_schema(session_id: str) -> Optional[Any]:
        if session_id in schema_cache:
            logger.debug("Schema cache hit", session_id=session_id)
            return schema_cache[session_id]
        logger.debug("Schema cache miss", session_id=session_id)
        return None

    @staticmethod
    def set_schema(session_id: str, schema: Any) -> None:
        schema_cache[session_id] = schema
        logger.debug("Schema cached", session_id=session_id)

    @staticmethod
    def invalidate_schema(session_id: str) -> None:
        if session_id in schema_cache:
            del schema_cache[session_id]
            logger.info("Schema cache invalidated", session_id=session_id)

cache_service = CacheService()
