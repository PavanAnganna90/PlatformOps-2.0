"""
Kubernetes API endpoints.

Provides REST endpoints for Kubernetes cluster management,
including listing clusters, nodes, pods, and namespaces.
"""

from typing import Dict, List, Optional

from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel

from app.schemas.kubernetes import (
    ClusterInfo,
    ClusterListResponse,
    NamespaceInfo,
    NodeInfo,
    NodeMetrics,
    PodInfo,
)
from app.services.kubernetes import get_kubernetes_service

router = APIRouter(prefix="/kubernetes")


class SwitchContextRequest(BaseModel):
    """Request to switch Kubernetes context."""

    context: str


class SwitchContextResponse(BaseModel):
    """Response from context switch."""

    success: bool
    context: str
    error: Optional[str] = None


@router.get(
    "/clusters",
    response_model=ClusterListResponse,
    summary="List Kubernetes Clusters",
    description="Returns all configured Kubernetes clusters and their status.",
)
async def list_clusters() -> ClusterListResponse:
    """
    List all configured Kubernetes clusters.

    Returns clusters from:
    - Default kubeconfig (~/.kube/config)
    - Environment-specified kubeconfigs (KUBECONFIG_*)
    - In-cluster config (when running in Kubernetes)

    Returns:
        ClusterListResponse: List of clusters with active cluster indicator
    """
    service = get_kubernetes_service()
    clusters = service.get_clusters()

    # Find active cluster
    active = next((c.name for c in clusters if c.status.value == "connected"), None)

    return ClusterListResponse(
        clusters=clusters,
        active_cluster=active,
    )


@router.get(
    "/clusters/{cluster_name}",
    response_model=ClusterInfo,
    summary="Get Cluster Details",
    description="Returns detailed information about a specific cluster.",
)
async def get_cluster(cluster_name: str) -> ClusterInfo:
    """
    Get details for a specific cluster.

    Args:
        cluster_name: Name of the cluster

    Returns:
        ClusterInfo: Cluster details
    """
    service = get_kubernetes_service()
    clusters = service.get_clusters()

    for cluster in clusters:
        if cluster.name == cluster_name or cluster.context == cluster_name:
            return cluster

    # Return a disconnected cluster if not found
    return ClusterInfo(
        name=cluster_name,
        context=cluster_name,
        status="disconnected",
        error=f"Cluster '{cluster_name}' not found in configuration",
    )


@router.get(
    "/nodes",
    response_model=List[NodeInfo],
    summary="List Nodes",
    description="Returns all nodes in the active or specified cluster.",
)
async def list_nodes(
    cluster: Optional[str] = Query(
        default=None,
        description="Cluster name (uses active cluster if not specified)",
    ),
) -> List[NodeInfo]:
    """
    List all nodes in a cluster.

    Args:
        cluster: Optional cluster name

    Returns:
        List of NodeInfo objects
    """
    service = get_kubernetes_service()
    return service.get_nodes(cluster=cluster)


@router.get(
    "/namespaces",
    response_model=List[NamespaceInfo],
    summary="List Namespaces",
    description="Returns all namespaces in the active or specified cluster.",
)
async def list_namespaces(
    cluster: Optional[str] = Query(
        default=None,
        description="Cluster name (uses active cluster if not specified)",
    ),
) -> List[NamespaceInfo]:
    """
    List all namespaces in a cluster.

    Args:
        cluster: Optional cluster name

    Returns:
        List of NamespaceInfo objects
    """
    service = get_kubernetes_service()
    return service.get_namespaces(cluster=cluster)


@router.get(
    "/pods",
    response_model=List[PodInfo],
    summary="List Pods",
    description="Returns pods, optionally filtered by namespace.",
)
async def list_pods(
    namespace: Optional[str] = Query(
        default=None,
        description="Filter by namespace (all namespaces if not specified)",
    ),
    cluster: Optional[str] = Query(
        default=None,
        description="Cluster name (uses active cluster if not specified)",
    ),
) -> List[PodInfo]:
    """
    List pods in a cluster.

    Args:
        namespace: Optional namespace filter
        cluster: Optional cluster name

    Returns:
        List of PodInfo objects
    """
    service = get_kubernetes_service()
    return service.get_pods(namespace=namespace, cluster=cluster)


@router.get(
    "/namespaces/{namespace}/pods",
    response_model=List[PodInfo],
    summary="List Pods in Namespace",
    description="Returns all pods in a specific namespace.",
)
async def list_namespace_pods(
    namespace: str,
    cluster: Optional[str] = Query(
        default=None,
        description="Cluster name (uses active cluster if not specified)",
    ),
) -> List[PodInfo]:
    """
    List pods in a specific namespace.

    Args:
        namespace: Namespace name
        cluster: Optional cluster name

    Returns:
        List of PodInfo objects
    """
    service = get_kubernetes_service()
    return service.get_pods(namespace=namespace, cluster=cluster)


# -------------------------------------------------------------------------
# Context Management
# -------------------------------------------------------------------------


@router.post(
    "/context",
    response_model=SwitchContextResponse,
    summary="Switch Kubernetes Context",
    description="Switch to a different Kubernetes cluster context.",
)
async def switch_context(request: SwitchContextRequest) -> SwitchContextResponse:
    """
    Switch to a different Kubernetes context.

    This changes which cluster subsequent API calls will target.

    Args:
        request: Contains the context name to switch to

    Returns:
        SwitchContextResponse indicating success or failure
    """
    service = get_kubernetes_service()
    success, error = service.switch_context(request.context)

    return SwitchContextResponse(
        success=success,
        context=request.context,
        error=error,
    )


@router.get(
    "/context",
    summary="Get Current Context",
    description="Returns the currently active Kubernetes context.",
)
async def get_current_context() -> dict:
    """
    Get the currently active context.

    Returns:
        Dict with current context name
    """
    service = get_kubernetes_service()
    context = service.get_current_context()

    return {"context": context}


# -------------------------------------------------------------------------
# Metrics
# -------------------------------------------------------------------------


@router.get(
    "/metrics/nodes",
    response_model=Dict[str, NodeMetrics],
    summary="Get Node Metrics",
    description="Returns real-time CPU/Memory metrics for nodes from metrics-server.",
)
async def get_node_metrics(
    cluster: Optional[str] = Query(
        default=None,
        description="Cluster name (uses active cluster if not specified)",
    ),
) -> Dict[str, NodeMetrics]:
    """
    Get real-time metrics for all nodes.

    Requires metrics-server to be installed in the cluster.

    Args:
        cluster: Optional cluster name

    Returns:
        Dict mapping node name to NodeMetrics
    """
    service = get_kubernetes_service()
    return service.get_node_metrics(cluster=cluster)


@router.get(
    "/metrics/pods",
    summary="Get Pod Metrics",
    description="Returns real-time CPU/Memory metrics for pods from metrics-server.",
)
async def get_pod_metrics(
    namespace: Optional[str] = Query(
        default=None,
        description="Filter by namespace",
    ),
    cluster: Optional[str] = Query(
        default=None,
        description="Cluster name (uses active cluster if not specified)",
    ),
) -> Dict[str, dict]:
    """
    Get real-time metrics for pods.

    Requires metrics-server to be installed in the cluster.

    Args:
        namespace: Optional namespace filter
        cluster: Optional cluster name

    Returns:
        Dict mapping "namespace/pod_name" to metrics
    """
    service = get_kubernetes_service()
    return service.get_pod_metrics(namespace=namespace, cluster=cluster)


# -------------------------------------------------------------------------
# Deployments
# -------------------------------------------------------------------------


class DeploymentInfo(BaseModel):
    """Information about a Kubernetes deployment."""

    name: str
    namespace: str
    replicas: int
    available_replicas: int
    ready_replicas: int
    updated_replicas: int
    image: str
    strategy: str


class ScaleRequest(BaseModel):
    """Request to scale a deployment."""

    replicas: int


class ScaleResponse(BaseModel):
    """Response from scale operation."""

    success: bool
    namespace: str
    deployment: str
    previous_replicas: int
    current_replicas: int
    message: Optional[str] = None


class RestartResponse(BaseModel):
    """Response from restart operation."""

    success: bool
    namespace: str
    deployment: str
    message: Optional[str] = None


@router.get(
    "/deployments",
    response_model=List[DeploymentInfo],
    summary="List Deployments",
    description="Returns all deployments in the cluster or namespace.",
)
async def list_deployments(
    namespace: Optional[str] = Query(
        default=None,
        description="Filter by namespace",
    ),
    cluster: Optional[str] = Query(
        default=None,
        description="Cluster name (uses active cluster if not specified)",
    ),
) -> List[DeploymentInfo]:
    """
    List all deployments.

    Args:
        namespace: Optional namespace filter
        cluster: Optional cluster name

    Returns:
        List of DeploymentInfo objects
    """
    service = get_kubernetes_service()
    return service.list_deployments(namespace=namespace, cluster=cluster)


@router.post(
    "/deployments/{namespace}/{name}/scale",
    response_model=ScaleResponse,
    summary="Scale Deployment",
    description="Scale a deployment to a specified number of replicas.",
)
async def scale_deployment(
    namespace: str,
    name: str,
    request: ScaleRequest,
    cluster: Optional[str] = Query(
        default=None,
        description="Cluster name (uses active cluster if not specified)",
    ),
) -> ScaleResponse:
    """
    Scale a deployment.

    Args:
        namespace: Deployment namespace
        name: Deployment name
        request: Scale request with desired replicas
        cluster: Optional cluster name

    Returns:
        ScaleResponse with operation result
    """
    service = get_kubernetes_service()
    return service.scale_deployment(
        namespace=namespace,
        name=name,
        replicas=request.replicas,
        cluster=cluster,
    )


@router.post(
    "/deployments/{namespace}/{name}/restart",
    response_model=RestartResponse,
    summary="Restart Deployment",
    description="Restart a deployment by triggering a rolling update.",
)
async def restart_deployment(
    namespace: str,
    name: str,
    cluster: Optional[str] = Query(
        default=None,
        description="Cluster name (uses active cluster if not specified)",
    ),
) -> RestartResponse:
    """
    Restart a deployment.

    Triggers a rolling restart by patching the deployment's
    pod template with a restart annotation.

    Args:
        namespace: Deployment namespace
        name: Deployment name
        cluster: Optional cluster name

    Returns:
        RestartResponse with operation result
    """
    service = get_kubernetes_service()
    return service.restart_deployment(
        namespace=namespace,
        name=name,
        cluster=cluster,
    )


@router.delete(
    "/pods/{namespace}/{name}",
    summary="Delete Pod",
    description="Delete a pod (useful for forcing a restart).",
)
async def delete_pod(
    namespace: str,
    name: str,
    cluster: Optional[str] = Query(
        default=None,
        description="Cluster name (uses active cluster if not specified)",
    ),
) -> dict:
    """
    Delete a pod.

    For pods managed by a deployment/replicaset, a new pod
    will be automatically created.

    Args:
        namespace: Pod namespace
        name: Pod name
        cluster: Optional cluster name

    Returns:
        Dict with success status
    """
    service = get_kubernetes_service()
    return service.delete_pod(
        namespace=namespace,
        name=name,
        cluster=cluster,
    )
