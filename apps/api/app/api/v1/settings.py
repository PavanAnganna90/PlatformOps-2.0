"""
Settings and credential management API endpoints.

Allows users to configure integrations in one place.
"""

from typing import Dict, Optional

from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel

from app.core.config import get_settings

router = APIRouter(prefix="/settings", tags=["settings"])


class CloudCredentials(BaseModel):
    """Cloud provider credentials."""

    # AWS
    aws_access_key_id: Optional[str] = None
    aws_secret_access_key: Optional[str] = None
    aws_region: Optional[str] = None

    # GCP
    gcp_project_id: Optional[str] = None
    gcp_credentials_path: Optional[str] = None

    # Azure
    azure_subscription_id: Optional[str] = None
    azure_client_id: Optional[str] = None
    azure_client_secret: Optional[str] = None
    azure_tenant_id: Optional[str] = None


class IntegrationCredentials(BaseModel):
    """Integration service credentials."""

    # GitHub
    github_token: Optional[str] = None
    github_org: Optional[str] = None

    # ArgoCD
    argocd_url: Optional[str] = None
    argocd_token: Optional[str] = None

    # Prometheus
    prometheus_url: Optional[str] = None

    # Datadog
    datadog_api_key: Optional[str] = None
    datadog_app_key: Optional[str] = None
    datadog_site: Optional[str] = None

    # Terraform Cloud
    tfc_token: Optional[str] = None
    tfc_org: Optional[str] = None


class AllCredentials(BaseModel):
    """All credentials in one model."""

    cloud: Optional[CloudCredentials] = None
    integrations: Optional[IntegrationCredentials] = None


@router.get(
    "/status",
    summary="Get Integration Status",
    description="Get configuration status for all integrations.",
)
async def get_integration_status():
    """Get status of all integrations."""
    settings = get_settings()
    status = settings.get_integration_status()

    # Add detailed status
    details = []
    for name, configured in status.items():
        details.append(
            {
                "name": name,
                "configured": configured,
                "message": (
                    f"{name.upper()} is configured"
                    if configured
                    else f"Configure {name.upper()} credentials"
                ),
            }
        )

    return {
        "integrations": status,
        "details": details,
        "total_configured": sum(1 for v in status.values() if v),
        "total_integrations": len(status),
    }


@router.post(
    "/credentials",
    summary="Save Credentials",
    description="Save credentials for integrations. Credentials are stored in environment or Supabase.",
)
async def save_credentials(credentials: AllCredentials = Body(...)):
    """
    Save credentials for integrations.

    Note: In production, this would save to Supabase or secure storage.
    For local development, this validates but doesn't persist (use .env file).
    """
    settings = get_settings()

    # Validate credentials (don't actually save in this demo)
    # In production, you'd save to Supabase or encrypted storage
    saved = {}

    if credentials.cloud:
        cloud = credentials.cloud
        if cloud.aws_access_key_id and cloud.aws_secret_access_key:
            saved["aws"] = {
                "access_key_id": cloud.aws_access_key_id[:4] + "***",
                "region": cloud.aws_region or "us-east-1",
            }
        if cloud.gcp_project_id:
            saved["gcp"] = {"project_id": cloud.gcp_project_id}
        if cloud.azure_subscription_id:
            saved["azure"] = {
                "subscription_id": cloud.azure_subscription_id[:8] + "***",
            }

    if credentials.integrations:
        integrations = credentials.integrations
        if integrations.github_token:
            saved["github"] = {"token": "ghp_***"}
        if integrations.argocd_url and integrations.argocd_token:
            saved["argocd"] = {"url": integrations.argocd_url}
        if integrations.prometheus_url:
            saved["prometheus"] = {"url": integrations.prometheus_url}
        if integrations.datadog_api_key:
            saved["datadog"] = {"site": integrations.datadog_site or "datadoghq.com"}
        if integrations.tfc_token:
            saved["terraform_cloud"] = {"org": integrations.tfc_org}

    return {
        "success": True,
        "message": "Credentials validated. For local development, add them to .env file.",
        "saved": saved,
        "note": "In production, credentials are stored securely in Supabase.",
    }


@router.get(
    "/credentials",
    summary="Get Credential Status",
    description="Get which credentials are configured (without exposing values).",
)
async def get_credentials_status():
    """Get status of configured credentials without exposing values."""
    settings = get_settings()

    return {
        "cloud": {
            "aws": {
                "configured": bool(settings.aws_access_key_id and settings.aws_secret_access_key),
                "region": settings.aws_region,
            },
            "gcp": {
                "configured": bool(settings.gcp_project_id),
                "project_id": settings.gcp_project_id[:10] + "***" if settings.gcp_project_id else None,
            },
            "azure": {
                "configured": bool(
                    settings.azure_subscription_id
                    and settings.azure_client_id
                    and settings.azure_client_secret
                ),
            },
        },
        "integrations": {
            "github": {"configured": bool(settings.github_token)},
            "argocd": {
                "configured": bool(settings.argocd_url and settings.argocd_token),
                "url": settings.argocd_url,
            },
            "prometheus": {
                "configured": bool(settings.prometheus_url),
                "url": settings.prometheus_url,
            },
            "datadog": {"configured": False},  # Not implemented yet
            "terraform_cloud": {
                "configured": bool(settings.tfc_token and settings.tfc_org),
                "org": settings.tfc_org,
            },
        },
    }

