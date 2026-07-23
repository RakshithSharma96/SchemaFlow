"""
Observability Core.
Handles structured JSON logging and latency tracking for the Orchestrator and Agents.
"""

import time
import structlog
import logging
import sys
from contextlib import contextmanager

# Configure structlog
structlog.configure(
    processors=[
        structlog.stdlib.add_log_level,
        structlog.stdlib.add_logger_name,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    wrapper_class=structlog.stdlib.BoundLogger,
    cache_logger_on_first_use=True,
)

# Ensure standard logging goes to stdout (uvicorn overrides some things, but this sets a baseline)
logging.basicConfig(format="%(message)s", stream=sys.stdout, level=logging.INFO)

def get_logger(name: str):
    return structlog.get_logger(name)

@contextmanager
def track_latency(agent_name: str, session_id: str = None, **kwargs):
    """
    Context manager to track execution time of an agent or service.
    Outputs a structured log event with 'latency_ms'.
    """
    start_time = time.perf_counter()
    logger = get_logger(agent_name)
    
    if session_id:
        logger = logger.bind(session_id=session_id)
        
    if kwargs:
        logger = logger.bind(**kwargs)
        
    logger.info(f"{agent_name} started", status="running")
    
    try:
        yield
        elapsed = (time.perf_counter() - start_time) * 1000
        logger.info(f"{agent_name} completed", status="success", latency_ms=round(elapsed, 2))
    except Exception as exc:
        elapsed = (time.perf_counter() - start_time) * 1000
        logger.error(f"{agent_name} failed", status="error", latency_ms=round(elapsed, 2), error=str(exc))
        raise
