"""
Health check endpoints.

Provides liveness and readiness probes for Kubernetes deployments,
as well as detailed health status for debugging.
"""

from datetime import datetime, timezone

from fastapi import APIRouter

from app.core.config import get_settings
from app.schemas.common import HealthResponse

router = APIRouter()


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Health Check",
    description="Basic health check endpoint. Returns 200 if the API is running.",
)
async def health_check() -> HealthResponse:
    """
    Perform a basic health check.
    
    This endpoint is used by:
    - Kubernetes liveness probes
    - Load balancer health checks
    - Monitoring systems
    
    Returns:
        HealthResponse: Current health status
    """
    settings = get_settings()
    
    return HealthResponse(
        status="healthy",
        version=settings.app_version,
        timestamp=datetime.now(timezone.utc),
    )


@router.get(
    "/health/live",
    response_model=HealthResponse,
    summary="Liveness Probe",
    description="Kubernetes liveness probe. Returns 200 if the process is alive.",
)
async def liveness_probe() -> HealthResponse:
    """
    Kubernetes liveness probe.
    
    This should always return 200 if the process is running.
    Kubernetes will restart the pod if this fails.
    
    Returns:
        HealthResponse: Liveness status
    """
    settings = get_settings()
    
    return HealthResponse(
        status="healthy",
        version=settings.app_version,
        timestamp=datetime.now(timezone.utc),
    )


@router.get(
    "/health/ready",
    response_model=HealthResponse,
    summary="Readiness Probe",
    description="Kubernetes readiness probe. Returns 200 if ready to serve traffic.",
)
async def readiness_probe() -> HealthResponse:
    """
    Kubernetes readiness probe.
    
    Checks if the application is ready to serve traffic.
    This could include database connectivity, cache availability, etc.
    
    Returns:
        HealthResponse: Readiness status
    """
    settings = get_settings()
    
    # TODO: Add actual readiness checks (database, cache, etc.)
    # For now, we just return healthy
    
    return HealthResponse(
        status="healthy",
        version=settings.app_version,
        timestamp=datetime.now(timezone.utc),
    )

