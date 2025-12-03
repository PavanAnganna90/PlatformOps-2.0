"""
Configuration status endpoints.

Provides endpoints to check which integrations are configured
and their connection status. Useful for the frontend to show
setup wizards and connection status indicators.
"""

import os
from typing import List

from fastapi import APIRouter

from app.core.config import get_settings
from app.schemas.common import ConfigStatusResponse, IntegrationStatus
from app.services.kubernetes import get_kubernetes_service

router = APIRouter(prefix="/config")


@router.get(
    "/status",
    response_model=ConfigStatusResponse,
    summary="Get Configuration Status",
    description="Returns the configuration status of all integrations.",
)
async def get_config_status() -> ConfigStatusResponse:
    """
    Get the current configuration status.
    
    This endpoint helps the frontend understand:
    - Which integrations are configured
    - Which are actively connected
    - What setup steps are needed
    
    Returns:
        ConfigStatusResponse: Configuration and connection status
    """
    settings = get_settings()
    
    # Get basic integration status
    integration_status = settings.get_integration_status()
    
    # Build detailed status list with connection checks
    details: List[IntegrationStatus] = []
    
    # Kubernetes
    k8s_service = get_kubernetes_service()
    clusters = k8s_service.get_clusters()
    k8s_connected = any(c.status.value == "connected" for c in clusters)
    details.append(IntegrationStatus(
        name="kubernetes",
        configured=integration_status["kubernetes"],
        connected=k8s_connected,
        error=None if k8s_connected else "No cluster connected",
    ))
    
    # Supabase
    details.append(IntegrationStatus(
        name="supabase",
        configured=integration_status["supabase"],
        connected=integration_status["supabase"],  # Assume connected if configured
    ))
    
    # Prometheus
    details.append(IntegrationStatus(
        name="prometheus",
        configured=integration_status["prometheus"],
        connected=False,  # TODO: Implement connection check
        error="Not implemented" if integration_status["prometheus"] else None,
    ))
    
    # ArgoCD
    details.append(IntegrationStatus(
        name="argocd",
        configured=integration_status["argocd"],
        connected=False,  # TODO: Implement connection check
        error="Not implemented" if integration_status["argocd"] else None,
    ))
    
    # GitHub
    details.append(IntegrationStatus(
        name="github",
        configured=integration_status["github"],
        connected=False,  # TODO: Implement connection check
        error="Not implemented" if integration_status["github"] else None,
    ))
    
    # Terraform Cloud
    details.append(IntegrationStatus(
        name="terraform_cloud",
        configured=integration_status["terraform_cloud"],
        connected=False,  # TODO: Implement connection check
        error="Not implemented" if integration_status["terraform_cloud"] else None,
    ))
    
    # Determine mode
    mode = os.environ.get("OPSSIGHT_MODE", "local")
    
    return ConfigStatusResponse(
        mode=mode,
        integrations=integration_status,
        details=details,
    )


@router.get(
    "/integrations",
    response_model=List[IntegrationStatus],
    summary="Get Integration Details",
    description="Returns detailed status of each integration.",
)
async def get_integrations() -> List[IntegrationStatus]:
    """
    Get detailed integration status.
    
    Returns:
        List of IntegrationStatus objects
    """
    status = await get_config_status()
    return status.details

