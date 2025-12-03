"""
Integration API endpoints.

Provides endpoints for:
- GitHub Actions
- ArgoCD
- Prometheus
"""

from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from app.schemas.integrations import (
    ArgoApplicationsResponse,
    ClusterMetricsResponse,
    PrometheusQueryResponse,
    WorkflowRunsResponse,
)
from app.services.github import get_github_service
from app.services.argocd import get_argocd_service
from app.services.prometheus import get_prometheus_service

router = APIRouter(prefix="/integrations", tags=["integrations"])


# =============================================================================
# GitHub Actions
# =============================================================================


@router.get(
    "/github/workflows",
    response_model=WorkflowRunsResponse,
    summary="List GitHub Workflow Runs",
    description="Get recent workflow runs from a GitHub repository.",
)
async def list_workflow_runs(
    owner: str = Query(description="Repository owner"),
    repo: str = Query(description="Repository name"),
    workflow_id: Optional[int] = Query(default=None, description="Filter by workflow ID"),
    branch: Optional[str] = Query(default=None, description="Filter by branch"),
    status: Optional[str] = Query(default=None, description="Filter by status"),
    per_page: int = Query(default=10, ge=1, le=100, description="Results per page"),
) -> WorkflowRunsResponse:
    """
    List recent workflow runs from GitHub Actions.

    Returns demo data if GitHub token is not configured.
    """
    service = get_github_service()
    return await service.list_workflow_runs(
        owner=owner,
        repo=repo,
        workflow_id=workflow_id,
        branch=branch,
        status=status,
        per_page=per_page,
    )


@router.get(
    "/github/status",
    summary="GitHub Integration Status",
    description="Check if GitHub integration is configured.",
)
async def github_status():
    """Get GitHub integration status."""
    service = get_github_service()
    return {
        "configured": service.is_configured(),
        "message": "GitHub token configured" if service.is_configured() else "Set GITHUB_TOKEN to enable",
    }


# =============================================================================
# ArgoCD
# =============================================================================


@router.get(
    "/argocd/applications",
    response_model=ArgoApplicationsResponse,
    summary="List ArgoCD Applications",
    description="Get all ArgoCD applications and their sync status.",
)
async def list_argocd_applications(
    project: Optional[str] = Query(default=None, description="Filter by project"),
) -> ArgoApplicationsResponse:
    """
    List ArgoCD applications.

    Returns demo data if ArgoCD is not configured.
    """
    service = get_argocd_service()
    return await service.list_applications(project=project)


@router.get(
    "/argocd/status",
    summary="ArgoCD Integration Status",
    description="Check if ArgoCD integration is configured.",
)
async def argocd_status():
    """Get ArgoCD integration status."""
    service = get_argocd_service()
    return {
        "configured": service.is_configured(),
        "message": "ArgoCD configured" if service.is_configured() else "Set ARGOCD_URL and ARGOCD_TOKEN to enable",
    }


# =============================================================================
# Prometheus
# =============================================================================


@router.get(
    "/prometheus/query",
    response_model=PrometheusQueryResponse,
    summary="Execute Prometheus Query",
    description="Execute a PromQL instant query.",
)
async def prometheus_query(
    query: str = Query(description="PromQL query string"),
    time: Optional[str] = Query(default=None, description="Evaluation timestamp (RFC3339)"),
) -> PrometheusQueryResponse:
    """
    Execute a Prometheus instant query.

    Returns demo data if Prometheus is not configured.
    """
    service = get_prometheus_service()
    eval_time = datetime.fromisoformat(time) if time else None
    return await service.query(query=query, time=eval_time)


@router.get(
    "/prometheus/query_range",
    response_model=PrometheusQueryResponse,
    summary="Execute Prometheus Range Query",
    description="Execute a PromQL range query for time series data.",
)
async def prometheus_query_range(
    query: str = Query(description="PromQL query string"),
    start: Optional[str] = Query(default=None, description="Start timestamp (RFC3339)"),
    end: Optional[str] = Query(default=None, description="End timestamp (RFC3339)"),
    step: str = Query(default="1m", description="Query resolution step"),
    hours: int = Query(default=1, ge=1, le=168, description="Hours of data (if start/end not provided)"),
) -> PrometheusQueryResponse:
    """
    Execute a Prometheus range query.

    If start/end are not provided, returns last N hours of data.
    Returns demo data if Prometheus is not configured.
    """
    service = get_prometheus_service()

    if start and end:
        start_time = datetime.fromisoformat(start)
        end_time = datetime.fromisoformat(end)
    else:
        end_time = datetime.utcnow()
        start_time = end_time - timedelta(hours=hours)

    return await service.query_range(
        query=query,
        start=start_time,
        end=end_time,
        step=step,
    )


@router.get(
    "/prometheus/cluster",
    response_model=ClusterMetricsResponse,
    summary="Get Cluster Metrics",
    description="Get aggregated cluster metrics from Prometheus.",
)
async def get_cluster_metrics(
    cluster: Optional[str] = Query(default=None, description="Cluster name"),
) -> ClusterMetricsResponse:
    """
    Get aggregated cluster metrics.

    Returns demo data if Prometheus is not configured.
    """
    service = get_prometheus_service()
    return await service.get_cluster_metrics(cluster=cluster)


@router.get(
    "/prometheus/status",
    summary="Prometheus Integration Status",
    description="Check if Prometheus integration is configured.",
)
async def prometheus_status():
    """Get Prometheus integration status."""
    service = get_prometheus_service()
    return {
        "configured": service.is_configured(),
        "message": "Prometheus configured" if service.is_configured() else "Set PROMETHEUS_URL to enable",
    }

