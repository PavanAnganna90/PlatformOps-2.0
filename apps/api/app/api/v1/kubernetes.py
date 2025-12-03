"""
Kubernetes API endpoints.

Provides REST endpoints for Kubernetes cluster management,
including listing clusters, nodes, pods, and namespaces.
"""

from typing import List, Optional

from fastapi import APIRouter, Query

from app.schemas.kubernetes import (
    ClusterInfo,
    ClusterListResponse,
    NamespaceInfo,
    NodeInfo,
    PodInfo,
)
from app.services.kubernetes import get_kubernetes_service

router = APIRouter(prefix="/kubernetes")


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
    active = next(
        (c.name for c in clusters if c.status.value == "connected"),
        None
    )
    
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

