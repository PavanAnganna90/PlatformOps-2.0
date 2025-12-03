"""Kubernetes-related schemas."""

from datetime import datetime
from enum import Enum
from typing import Dict, List, Optional

from pydantic import BaseModel, Field


class ClusterStatus(str, Enum):
    """Cluster connection status."""

    CONNECTED = "connected"
    DISCONNECTED = "disconnected"
    ERROR = "error"
    UNKNOWN = "unknown"


class ResourceStatus(str, Enum):
    """Generic resource status."""

    HEALTHY = "healthy"
    WARNING = "warning"
    ERROR = "error"
    PENDING = "pending"
    UNKNOWN = "unknown"


class ClusterInfo(BaseModel):
    """Information about a Kubernetes cluster."""

    name: str = Field(description="Cluster name/identifier")
    context: str = Field(description="Kubeconfig context name")
    status: ClusterStatus = Field(description="Connection status")
    server_url: Optional[str] = Field(default=None, description="API server URL")
    version: Optional[str] = Field(default=None, description="Kubernetes version")
    node_count: int = Field(default=0, description="Number of nodes")
    namespace_count: int = Field(default=0, description="Number of namespaces")
    pod_count: int = Field(default=0, description="Total pod count")
    error: Optional[str] = Field(default=None, description="Error message if disconnected")

    model_config = {
        "json_schema_extra": {
            "example": {
                "name": "prod-us-east",
                "context": "arn:aws:eks:us-east-1:123456789:cluster/prod",
                "status": "connected",
                "server_url": "https://ABC123.gr7.us-east-1.eks.amazonaws.com",
                "version": "1.28",
                "node_count": 5,
                "namespace_count": 12,
                "pod_count": 87,
            }
        }
    }


class ClusterListResponse(BaseModel):
    """Response containing list of clusters."""

    clusters: List[ClusterInfo] = Field(description="List of configured clusters")
    active_cluster: Optional[str] = Field(default=None, description="Currently active cluster name")


class NamespaceInfo(BaseModel):
    """Information about a Kubernetes namespace."""

    name: str = Field(description="Namespace name")
    status: ResourceStatus = Field(description="Namespace status")
    pod_count: int = Field(default=0, description="Number of pods")
    deployment_count: int = Field(default=0, description="Number of deployments")
    service_count: int = Field(default=0, description="Number of services")
    created_at: Optional[datetime] = Field(default=None, description="Creation timestamp")
    labels: Dict[str, str] = Field(default_factory=dict, description="Namespace labels")


class NodeMetrics(BaseModel):
    """Node resource metrics."""

    cpu_usage_percent: float = Field(description="CPU usage percentage")
    cpu_capacity_cores: float = Field(description="Total CPU cores")
    cpu_allocatable_cores: float = Field(description="Allocatable CPU cores")
    memory_usage_percent: float = Field(description="Memory usage percentage")
    memory_capacity_bytes: int = Field(description="Total memory in bytes")
    memory_allocatable_bytes: int = Field(description="Allocatable memory in bytes")
    pod_count: int = Field(description="Current pod count")
    pod_capacity: int = Field(description="Maximum pods")


class NodeInfo(BaseModel):
    """Information about a Kubernetes node."""

    name: str = Field(description="Node name")
    status: ResourceStatus = Field(description="Node status")
    role: str = Field(default="worker", description="Node role (control-plane/worker)")
    kubernetes_version: str = Field(description="Kubelet version")
    os_image: str = Field(description="OS image")
    container_runtime: str = Field(description="Container runtime")
    internal_ip: Optional[str] = Field(default=None, description="Internal IP address")
    external_ip: Optional[str] = Field(default=None, description="External IP address")
    metrics: Optional[NodeMetrics] = Field(default=None, description="Resource metrics")
    conditions: Dict[str, bool] = Field(
        default_factory=dict, description="Node conditions (Ready, MemoryPressure, etc.)"
    )
    labels: Dict[str, str] = Field(default_factory=dict, description="Node labels")
    taints: List[str] = Field(default_factory=list, description="Node taints")
    created_at: Optional[datetime] = Field(default=None, description="Creation timestamp")


class PodPhase(str, Enum):
    """Pod phase."""

    PENDING = "Pending"
    RUNNING = "Running"
    SUCCEEDED = "Succeeded"
    FAILED = "Failed"
    UNKNOWN = "Unknown"


class ContainerStatus(BaseModel):
    """Container status within a pod."""

    name: str = Field(description="Container name")
    ready: bool = Field(description="Whether container is ready")
    restart_count: int = Field(default=0, description="Number of restarts")
    state: str = Field(description="Current state (running/waiting/terminated)")
    image: str = Field(description="Container image")


class PodInfo(BaseModel):
    """Information about a Kubernetes pod."""

    name: str = Field(description="Pod name")
    namespace: str = Field(description="Namespace")
    phase: PodPhase = Field(description="Pod phase")
    status: ResourceStatus = Field(description="Derived health status")
    node_name: Optional[str] = Field(default=None, description="Node running the pod")
    pod_ip: Optional[str] = Field(default=None, description="Pod IP address")
    containers: List[ContainerStatus] = Field(
        default_factory=list, description="Container statuses"
    )
    restart_count: int = Field(default=0, description="Total restart count")
    labels: Dict[str, str] = Field(default_factory=dict, description="Pod labels")
    created_at: Optional[datetime] = Field(default=None, description="Creation timestamp")

    model_config = {
        "json_schema_extra": {
            "example": {
                "name": "nginx-deployment-abc123",
                "namespace": "default",
                "phase": "Running",
                "status": "healthy",
                "node_name": "worker-1",
                "pod_ip": "10.244.0.5",
                "containers": [
                    {
                        "name": "nginx",
                        "ready": True,
                        "restart_count": 0,
                        "state": "running",
                        "image": "nginx:1.25",
                    }
                ],
                "restart_count": 0,
                "labels": {"app": "nginx"},
                "created_at": "2024-01-15T10:30:00Z",
            }
        }
    }
