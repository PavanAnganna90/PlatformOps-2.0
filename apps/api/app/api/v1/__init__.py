"""API v1 routes."""

from fastapi import APIRouter

from app.api.v1 import health, config, kubernetes, integrations, websocket, cloud

router = APIRouter(prefix="/v1")

# Include all route modules
router.include_router(health.router, tags=["Health"])
router.include_router(config.router, tags=["Configuration"])
router.include_router(kubernetes.router, tags=["Kubernetes"])
router.include_router(integrations.router, tags=["Integrations"])
router.include_router(websocket.router, tags=["WebSocket"])
router.include_router(cloud.router, tags=["Cloud"])

