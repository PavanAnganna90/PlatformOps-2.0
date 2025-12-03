"""
ArgoCD integration service.

Provides functionality to:
- List applications
- Get application details
- Sync applications (future)
"""

import logging
from datetime import datetime, timedelta
from typing import List, Optional
import random

from app.core.config import get_settings
from app.schemas.integrations import (
    ArgoApplication,
    ArgoApplicationsResponse,
    ArgoSyncStatus,
    ArgoHealthStatus,
)

logger = logging.getLogger(__name__)


class ArgoCDService:
    """Service for ArgoCD integration."""

    def __init__(self):
        """Initialize ArgoCD service."""
        self._settings = get_settings()
        self._argocd_url = self._settings.argocd_url
        self._argocd_token = self._settings.argocd_token
        self._argocd_available = bool(self._argocd_url and self._argocd_token)

        if self._argocd_available:
            logger.info(f"ArgoCD integration configured: {self._argocd_url}")
        else:
            logger.info("ArgoCD integration not configured")

    def is_configured(self) -> bool:
        """Check if ArgoCD is configured."""
        return self._argocd_available

    async def list_applications(
        self,
        project: Optional[str] = None,
    ) -> ArgoApplicationsResponse:
        """
        List ArgoCD applications.

        Args:
            project: Filter by project name

        Returns:
            ArgoApplicationsResponse with list of applications
        """
        if self._argocd_available:
            return await self._fetch_real_applications(project)
        else:
            return self._get_demo_applications(project)

    async def _fetch_real_applications(
        self,
        project: Optional[str],
    ) -> ArgoApplicationsResponse:
        """Fetch real applications from ArgoCD API."""
        try:
            import httpx

            url = f"{self._argocd_url}/api/v1/applications"
            params = {}
            if project:
                params["project"] = project

            headers = {
                "Authorization": f"Bearer {self._argocd_token}",
            }

            async with httpx.AsyncClient(verify=False) as client:
                response = await client.get(url, headers=headers, params=params)
                response.raise_for_status()
                data = response.json()

            apps = []
            for item in data.get("items", []):
                spec = item.get("spec", {})
                status = item.get("status", {})
                sync = status.get("sync", {})
                health = status.get("health", {})
                operation = status.get("operationState", {})

                apps.append(
                    ArgoApplication(
                        name=item["metadata"]["name"],
                        namespace=spec.get("destination", {}).get("namespace", "default"),
                        project=spec.get("project", "default"),
                        repo_url=spec.get("source", {}).get("repoURL", ""),
                        path=spec.get("source", {}).get("path", ""),
                        target_revision=spec.get("source", {}).get("targetRevision", "HEAD"),
                        sync_status=ArgoSyncStatus(sync.get("status", "Unknown")),
                        health_status=ArgoHealthStatus(health.get("status", "Unknown")),
                        sync_started_at=(
                            datetime.fromisoformat(operation["startedAt"].replace("Z", "+00:00"))
                            if operation.get("startedAt")
                            else None
                        ),
                        sync_finished_at=(
                            datetime.fromisoformat(operation["finishedAt"].replace("Z", "+00:00"))
                            if operation.get("finishedAt")
                            else None
                        ),
                        message=health.get("message"),
                        resources_synced=len(status.get("resources", [])),
                        resources_total=len(status.get("resources", [])),
                    )
                )

            return ArgoApplicationsResponse(
                applications=apps,
                server=self._argocd_url,
            )

        except Exception as e:
            logger.error(f"Failed to fetch ArgoCD applications: {e}")
            return self._get_demo_applications(project)

    def _get_demo_applications(
        self,
        project: Optional[str],
    ) -> ArgoApplicationsResponse:
        """Generate demo ArgoCD applications."""
        demo_apps = [
            {
                "name": "frontend-app",
                "namespace": "production",
                "repo_url": "https://github.com/company/frontend",
                "path": "k8s/overlays/prod",
                "sync_status": ArgoSyncStatus.SYNCED,
                "health_status": ArgoHealthStatus.HEALTHY,
                "resources": 8,
            },
            {
                "name": "backend-api",
                "namespace": "production",
                "repo_url": "https://github.com/company/backend",
                "path": "k8s/overlays/prod",
                "sync_status": ArgoSyncStatus.SYNCED,
                "health_status": ArgoHealthStatus.HEALTHY,
                "resources": 12,
            },
            {
                "name": "database",
                "namespace": "production",
                "repo_url": "https://github.com/company/infra",
                "path": "k8s/database",
                "sync_status": ArgoSyncStatus.SYNCED,
                "health_status": ArgoHealthStatus.HEALTHY,
                "resources": 5,
            },
            {
                "name": "monitoring",
                "namespace": "monitoring",
                "repo_url": "https://github.com/company/monitoring",
                "path": "k8s/prometheus",
                "sync_status": ArgoSyncStatus.OUT_OF_SYNC,
                "health_status": ArgoHealthStatus.PROGRESSING,
                "resources": 15,
            },
            {
                "name": "staging-app",
                "namespace": "staging",
                "repo_url": "https://github.com/company/frontend",
                "path": "k8s/overlays/staging",
                "sync_status": ArgoSyncStatus.SYNCED,
                "health_status": ArgoHealthStatus.DEGRADED,
                "resources": 8,
            },
        ]

        now = datetime.utcnow()
        apps = []

        for i, app_data in enumerate(demo_apps):
            if project and project != "default":
                continue

            sync_finished = now - timedelta(hours=random.randint(1, 24))
            sync_started = sync_finished - timedelta(minutes=random.randint(1, 5))

            apps.append(
                ArgoApplication(
                    name=app_data["name"],
                    namespace=app_data["namespace"],
                    project="default",
                    repo_url=app_data["repo_url"],
                    path=app_data["path"],
                    target_revision="main",
                    sync_status=app_data["sync_status"],
                    health_status=app_data["health_status"],
                    sync_started_at=sync_started,
                    sync_finished_at=sync_finished,
                    resources_synced=app_data["resources"] if app_data["sync_status"] == ArgoSyncStatus.SYNCED else app_data["resources"] - 2,
                    resources_total=app_data["resources"],
                )
            )

        return ArgoApplicationsResponse(
            applications=apps,
            server="https://argocd.example.com",
        )


# Singleton instance
_argocd_service: Optional[ArgoCDService] = None


def get_argocd_service() -> ArgoCDService:
    """Get the ArgoCD service singleton."""
    global _argocd_service
    if _argocd_service is None:
        _argocd_service = ArgoCDService()
    return _argocd_service

