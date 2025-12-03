"""
Cloud provider API endpoints.

Provides endpoints for AWS, GCP, and Azure resource discovery.
"""

from typing import Optional

from fastapi import APIRouter, Query

from app.schemas.cloud import (
    CloudProvider,
    CloudResourcesResponse,
    CloudSummaryResponse,
)
from app.services.cloud import get_cloud_manager

router = APIRouter(prefix="/cloud", tags=["cloud"])


@router.get(
    "/summary",
    response_model=CloudSummaryResponse,
    summary="Get Cloud Resources Summary",
    description="Get summary of resources across all configured cloud providers.",
)
async def get_cloud_summary() -> CloudSummaryResponse:
    """
    Get summary of cloud resources across all providers.

    Returns aggregated counts and estimated costs.
    """
    manager = get_cloud_manager()
    return await manager.get_summary()


@router.get(
    "/{provider}/resources",
    response_model=CloudResourcesResponse,
    summary="List Cloud Resources",
    description="List resources for a specific cloud provider.",
)
async def list_cloud_resources(
    provider: CloudProvider,
    resource_type: Optional[str] = Query(
        default=None, description="Filter by resource type"
    ),
    region: Optional[str] = Query(default=None, description="Filter by region"),
) -> CloudResourcesResponse:
    """
    List resources for a cloud provider.

    Args:
        provider: Cloud provider (aws, gcp, azure)
        resource_type: Optional resource type filter
        region: Optional region filter

    Returns:
        CloudResourcesResponse with list of resources
    """
    manager = get_cloud_manager()
    service = manager.get_service(provider)
    return await service.list_resources(resource_type=resource_type, region=region)


@router.get(
    "/{provider}/status",
    summary="Cloud Provider Status",
    description="Check if a cloud provider is configured.",
)
async def get_provider_status(provider: CloudProvider):
    """Get configuration status for a cloud provider."""
    manager = get_cloud_manager()
    service = manager.get_service(provider)
    return {
        "provider": provider.value,
        "configured": service.is_configured(),
        "message": (
            f"{provider.value.upper()} configured"
            if service.is_configured()
            else f"Set {provider.value.upper()} credentials to enable"
        ),
    }

