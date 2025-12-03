"""
Integration schemas for external services.

Includes:
- GitHub Actions
- ArgoCD
- Prometheus
"""

from datetime import datetime
from enum import Enum
from typing import Dict, List, Optional

from pydantic import BaseModel, Field


# =============================================================================
# GitHub Actions
# =============================================================================


class WorkflowRunStatus(str, Enum):
    """GitHub Actions workflow run status."""

    QUEUED = "queued"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    WAITING = "waiting"
    REQUESTED = "requested"
    PENDING = "pending"


class WorkflowRunConclusion(str, Enum):
    """GitHub Actions workflow run conclusion."""

    SUCCESS = "success"
    FAILURE = "failure"
    CANCELLED = "cancelled"
    SKIPPED = "skipped"
    TIMED_OUT = "timed_out"
    ACTION_REQUIRED = "action_required"
    NEUTRAL = "neutral"
    STALE = "stale"


class WorkflowRun(BaseModel):
    """A GitHub Actions workflow run."""

    id: int = Field(description="Workflow run ID")
    name: str = Field(description="Workflow name")
    head_branch: str = Field(description="Branch that triggered the run")
    head_sha: str = Field(description="Commit SHA")
    status: WorkflowRunStatus = Field(description="Current status")
    conclusion: Optional[WorkflowRunConclusion] = Field(
        default=None, description="Final conclusion"
    )
    workflow_id: int = Field(description="Workflow definition ID")
    url: str = Field(description="URL to the workflow run")
    html_url: str = Field(description="HTML URL to view in browser")
    created_at: datetime = Field(description="When the run was created")
    updated_at: datetime = Field(description="When the run was last updated")
    run_started_at: Optional[datetime] = Field(
        default=None, description="When the run started executing"
    )
    actor: str = Field(description="User who triggered the run")
    event: str = Field(description="Event that triggered the run (push, pull_request, etc)")
    run_number: int = Field(description="Run number for this workflow")

    model_config = {
        "json_schema_extra": {
            "example": {
                "id": 12345678,
                "name": "CI/CD Pipeline",
                "head_branch": "main",
                "head_sha": "abc123def456",
                "status": "completed",
                "conclusion": "success",
                "workflow_id": 1234,
                "url": "https://api.github.com/repos/owner/repo/actions/runs/12345678",
                "html_url": "https://github.com/owner/repo/actions/runs/12345678",
                "created_at": "2024-01-15T10:30:00Z",
                "updated_at": "2024-01-15T10:35:00Z",
                "run_started_at": "2024-01-15T10:30:05Z",
                "actor": "developer",
                "event": "push",
                "run_number": 42,
            }
        }
    }


class WorkflowRunsResponse(BaseModel):
    """Response containing workflow runs."""

    runs: List[WorkflowRun] = Field(description="List of workflow runs")
    total_count: int = Field(description="Total number of runs")
    repository: str = Field(description="Repository name (owner/repo)")


# =============================================================================
# ArgoCD
# =============================================================================


class ArgoSyncStatus(str, Enum):
    """ArgoCD application sync status."""

    SYNCED = "Synced"
    OUT_OF_SYNC = "OutOfSync"
    UNKNOWN = "Unknown"


class ArgoHealthStatus(str, Enum):
    """ArgoCD application health status."""

    HEALTHY = "Healthy"
    PROGRESSING = "Progressing"
    DEGRADED = "Degraded"
    SUSPENDED = "Suspended"
    MISSING = "Missing"
    UNKNOWN = "Unknown"


class ArgoApplication(BaseModel):
    """An ArgoCD application."""

    name: str = Field(description="Application name")
    namespace: str = Field(description="Target namespace")
    project: str = Field(description="ArgoCD project")
    repo_url: str = Field(description="Git repository URL")
    path: str = Field(description="Path in repository")
    target_revision: str = Field(description="Target branch/tag/commit")
    sync_status: ArgoSyncStatus = Field(description="Sync status")
    health_status: ArgoHealthStatus = Field(description="Health status")
    sync_started_at: Optional[datetime] = Field(
        default=None, description="When the last sync started"
    )
    sync_finished_at: Optional[datetime] = Field(
        default=None, description="When the last sync finished"
    )
    message: Optional[str] = Field(default=None, description="Status message")
    resources_synced: int = Field(default=0, description="Number of synced resources")
    resources_total: int = Field(default=0, description="Total resources")

    model_config = {
        "json_schema_extra": {
            "example": {
                "name": "my-app",
                "namespace": "production",
                "project": "default",
                "repo_url": "https://github.com/owner/repo",
                "path": "k8s/overlays/prod",
                "target_revision": "main",
                "sync_status": "Synced",
                "health_status": "Healthy",
                "sync_started_at": "2024-01-15T10:30:00Z",
                "sync_finished_at": "2024-01-15T10:31:00Z",
                "resources_synced": 12,
                "resources_total": 12,
            }
        }
    }


class ArgoApplicationsResponse(BaseModel):
    """Response containing ArgoCD applications."""

    applications: List[ArgoApplication] = Field(description="List of applications")
    server: str = Field(description="ArgoCD server URL")


# =============================================================================
# Prometheus
# =============================================================================


class MetricDataPoint(BaseModel):
    """A single metric data point."""

    timestamp: datetime = Field(description="Timestamp of the data point")
    value: float = Field(description="Metric value")


class MetricSeries(BaseModel):
    """A time series of metric data."""

    metric_name: str = Field(description="Name of the metric")
    labels: Dict[str, str] = Field(default_factory=dict, description="Metric labels")
    data_points: List[MetricDataPoint] = Field(description="Time series data")


class PrometheusQueryResponse(BaseModel):
    """Response from a Prometheus query."""

    query: str = Field(description="The PromQL query")
    result_type: str = Field(description="Result type (vector, matrix, scalar, string)")
    series: List[MetricSeries] = Field(description="Metric series")


class ClusterMetricsResponse(BaseModel):
    """Aggregated cluster metrics from Prometheus."""

    cluster_name: str = Field(description="Cluster name")
    timestamp: datetime = Field(description="Metrics timestamp")

    # CPU metrics
    cpu_usage_percent: float = Field(description="Cluster CPU usage percentage")
    cpu_requests_percent: float = Field(description="CPU requests as % of capacity")
    cpu_limits_percent: float = Field(description="CPU limits as % of capacity")

    # Memory metrics
    memory_usage_percent: float = Field(description="Cluster memory usage percentage")
    memory_requests_percent: float = Field(description="Memory requests as % of capacity")
    memory_limits_percent: float = Field(description="Memory limits as % of capacity")

    # Pod metrics
    pods_running: int = Field(description="Number of running pods")
    pods_pending: int = Field(description="Number of pending pods")
    pods_failed: int = Field(description="Number of failed pods")

    # Network metrics (optional)
    network_receive_bytes: Optional[float] = Field(
        default=None, description="Network receive rate (bytes/sec)"
    )
    network_transmit_bytes: Optional[float] = Field(
        default=None, description="Network transmit rate (bytes/sec)"
    )


# =============================================================================
# Deployment Management
# =============================================================================


class ScaleRequest(BaseModel):
    """Request to scale a deployment."""

    namespace: str = Field(description="Namespace of the deployment")
    deployment_name: str = Field(description="Name of the deployment")
    replicas: int = Field(ge=0, le=100, description="Desired number of replicas")


class ScaleResponse(BaseModel):
    """Response from a scale operation."""

    success: bool = Field(description="Whether the operation succeeded")
    namespace: str = Field(description="Namespace")
    deployment_name: str = Field(description="Deployment name")
    previous_replicas: int = Field(description="Previous replica count")
    current_replicas: int = Field(description="New replica count")
    message: Optional[str] = Field(default=None, description="Status message")


class RestartRequest(BaseModel):
    """Request to restart a deployment."""

    namespace: str = Field(description="Namespace of the deployment")
    deployment_name: str = Field(description="Name of the deployment")


class RestartResponse(BaseModel):
    """Response from a restart operation."""

    success: bool = Field(description="Whether the operation succeeded")
    namespace: str = Field(description="Namespace")
    deployment_name: str = Field(description="Deployment name")
    message: Optional[str] = Field(default=None, description="Status message")
    restarted_at: datetime = Field(description="When the restart was initiated")


class DeploymentInfo(BaseModel):
    """Information about a Kubernetes deployment."""

    name: str = Field(description="Deployment name")
    namespace: str = Field(description="Namespace")
    replicas: int = Field(description="Desired replicas")
    available_replicas: int = Field(description="Available replicas")
    ready_replicas: int = Field(description="Ready replicas")
    updated_replicas: int = Field(description="Updated replicas")
    strategy: str = Field(description="Update strategy (RollingUpdate, Recreate)")
    image: str = Field(description="Container image")
    created_at: datetime = Field(description="Creation timestamp")
    conditions: Dict[str, bool] = Field(default_factory=dict, description="Deployment conditions")
