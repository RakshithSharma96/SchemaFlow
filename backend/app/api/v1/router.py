"""
Aggregated v1 API router.
All sub-routers are registered here with their prefix and tags.
"""

from fastapi import APIRouter, Depends
from app.api.v1 import health, connections, schema, query
from app.api.v1.intelligence import router as intelligence_router
from app.api.v1.metadata import router as metadata_router
from app.api.v1.orchestrator import router as orchestrator_router
from app.api.v1.auth import router as auth_router
from app.api.deps import get_current_user

router = APIRouter(prefix="/api/v1")

# Public Routes
router.include_router(health.router, tags=["Health"])
router.include_router(auth_router, prefix="/auth", tags=["Auth"])

# Protected Routes
protected_deps = [Depends(get_current_user)]
router.include_router(connections.router, prefix="/connections", tags=["Connections"], dependencies=protected_deps)
router.include_router(schema.router, prefix="/connections", tags=["Schema"], dependencies=protected_deps)
router.include_router(query.router, prefix="/query", tags=["Query"], dependencies=protected_deps)
router.include_router(intelligence_router, prefix="/intelligence", tags=["Intelligence"], dependencies=protected_deps)
router.include_router(metadata_router, prefix="/metadata", tags=["Metadata"], dependencies=protected_deps)
router.include_router(orchestrator_router, prefix="/orchestrator", tags=["Orchestrator"], dependencies=protected_deps)
