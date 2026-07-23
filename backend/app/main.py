"""
FastAPI application entry point.
Configures CORS, exception handlers, startup/shutdown lifecycle,
and mounts the v1 API router.
"""

import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.router import router as api_v1_router
from app.config import get_settings
from app.utils.exceptions import AgentBaseException
from app.utils.logger import get_logger

logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: startup and shutdown logic."""
    settings = get_settings()

    # Ensure temp upload directory exists
    upload_dir = Path(settings.upload_temp_dir)
    upload_dir.mkdir(parents=True, exist_ok=True)
    logger.info("Temp upload directory ready: %s", upload_dir)

    # Initialize SQLAlchemy tables
    from app.db.database import engine, Base
    import app.models.domain  # import to register models
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables verified/created via SQLAlchemy")

    logger.info(
        "SchemaFlow starting | Timeout: %ds",
        settings.query_timeout_seconds,
    )
    yield
    logger.info("SchemaFlow shutting down")


def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title="SchemaFlow",
        description=(
            "Enterprise-grade SchemaFlow — connects to SQL databases, "
            "generates safe read-only SQL from natural language, and executes queries."
        ),
        version="1.0.0",
        docs_url="/docs",
        redoc_url="/redoc",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.exception_handler(AgentBaseException)
    async def agent_exception_handler(request: Request, exc: AgentBaseException):
        return JSONResponse(
            status_code=400,
            content={
                "success": False,
                "error": exc.message,
                "detail": exc.detail,
                "data": None,
            },
        )

    @app.exception_handler(Exception)
    async def generic_exception_handler(request: Request, exc: Exception):
        logger.error("Unhandled exception: %s", exc, exc_info=True)
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": "Internal server error",
                "detail": str(exc),
                "data": None,
            },
        )

    app.include_router(api_v1_router)

    return app


app = create_app()
