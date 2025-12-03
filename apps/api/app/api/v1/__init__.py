"""API v1 routes."""

from fastapi import APIRouter

from app.api.v1 import health, config, kubernetes

router = APIRouter(prefix="/v1")

# Include all route modules
router.include_router(health.router, tags=["Health"])
router.include_router(config.router, tags=["Configuration"])
router.include_router(kubernetes.router, tags=["Kubernetes"])

