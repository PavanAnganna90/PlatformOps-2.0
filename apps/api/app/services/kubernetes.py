"""
Kubernetes service for cluster management and resource queries.

Provides a clean interface to interact with Kubernetes clusters,
with support for multiple cluster contexts and graceful fallbacks.
"""

import logging
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional, Tuple

from app.core.config import get_settings
from app.schemas.kubernetes import (
    ClusterInfo,
    ClusterStatus,
    ContainerStatus,
    NamespaceInfo,
    NodeInfo,
    NodeMetrics,
    PodInfo,
    PodPhase,
    ResourceStatus,
)

logger = logging.getLogger(__name__)


class KubernetesService:
    """
    Service for Kubernetes cluster operations.
    
    Handles:
    - Multi-cluster management
    - Resource listing (nodes, pods, namespaces)
    - Metrics collection (from metrics-server)
    - Context switching
    - Graceful error handling
    """
    
    def __init__(self):
        """Initialize the Kubernetes service."""
        self._clients: Dict[str, object] = {}
        self._active_context: Optional[str] = None
        self._k8s_available = False
        self._current_context: Optional[str] = None
        
        # Try to import kubernetes
        try:
            from kubernetes import client, config
            self._k8s_client = client
            self._k8s_config = config
            self._k8s_available = True
        except ImportError:
            logger.warning("kubernetes package not installed. K8s features disabled.")
    
    def _load_kubeconfig(self) -> Tuple[bool, Optional[str]]:
        """
        Load kubeconfig from configured path or default location.
        
        Returns:
            Tuple of (success, error_message)
        """
        if not self._k8s_available:
            return False, "kubernetes package not installed"
        
        settings = get_settings()
        kubeconfig_path = settings.kubeconfig_path
        
        if not kubeconfig_path:
            # Try in-cluster config (for running inside Kubernetes)
            try:
                self._k8s_config.load_incluster_config()
                self._active_context = "in-cluster"
                logger.info("Loaded in-cluster Kubernetes config")
                return True, None
            except Exception:
                return False, "No kubeconfig found and not running in-cluster"
        
        if not kubeconfig_path.exists():
            return False, f"Kubeconfig not found at {kubeconfig_path}"
        
        try:
            self._k8s_config.load_kube_config(config_file=str(kubeconfig_path))
            
            # Get current context
            contexts, active_context = self._k8s_config.list_kube_config_contexts(
                config_file=str(kubeconfig_path)
            )
            self._active_context = active_context.get("name") if active_context else None
            
            logger.info(f"Loaded kubeconfig from {kubeconfig_path}, context: {self._active_context}")
            return True, None
            
        except Exception as e:
            logger.error(f"Failed to load kubeconfig: {e}")
            return False, str(e)
    
    def get_clusters(self) -> List[ClusterInfo]:
        """
        Get list of all configured Kubernetes clusters.
        
        Returns:
            List of ClusterInfo objects
        """
        if not self._k8s_available:
            return self._get_demo_clusters()
        
        settings = get_settings()
        kubeconfig_path = settings.kubeconfig_path
        
        if not kubeconfig_path or not kubeconfig_path.exists():
            return self._get_demo_clusters()
        
        clusters = []
        
        try:
            contexts, active_context = self._k8s_config.list_kube_config_contexts(
                config_file=str(kubeconfig_path)
            )
            active_name = active_context.get("name") if active_context else None
            
            for ctx in contexts:
                ctx_name = ctx.get("name", "unknown")
                cluster_name = ctx.get("context", {}).get("cluster", ctx_name)
                
                # Try to get cluster info
                cluster_info = self._get_cluster_info(ctx_name, kubeconfig_path)
                cluster_info.name = cluster_name
                cluster_info.context = ctx_name
                
                clusters.append(cluster_info)
                
        except Exception as e:
            logger.error(f"Failed to list clusters: {e}")
            return self._get_demo_clusters()
        
        return clusters if clusters else self._get_demo_clusters()
    
    def _get_cluster_info(self, context: str, kubeconfig_path: Path) -> ClusterInfo:
        """
        Get detailed info for a specific cluster context.
        
        Args:
            context: Kubeconfig context name
            kubeconfig_path: Path to kubeconfig file
            
        Returns:
            ClusterInfo object
        """
        try:
            # Load config for this specific context
            self._k8s_config.load_kube_config(
                config_file=str(kubeconfig_path),
                context=context
            )
            
            # Get version
            version_api = self._k8s_client.VersionApi()
            version_info = version_api.get_code()
            
            # Get node count
            core_v1 = self._k8s_client.CoreV1Api()
            nodes = core_v1.list_node()
            node_count = len(nodes.items)
            
            # Get namespace count
            namespaces = core_v1.list_namespace()
            namespace_count = len(namespaces.items)
            
            # Get pod count
            pods = core_v1.list_pod_for_all_namespaces()
            pod_count = len(pods.items)
            
            return ClusterInfo(
                name=context,
                context=context,
                status=ClusterStatus.CONNECTED,
                version=f"{version_info.major}.{version_info.minor}",
                node_count=node_count,
                namespace_count=namespace_count,
                pod_count=pod_count,
            )
            
        except Exception as e:
            logger.warning(f"Failed to get info for context {context}: {e}")
            return ClusterInfo(
                name=context,
                context=context,
                status=ClusterStatus.ERROR,
                error=str(e),
            )
    
    def get_nodes(self, cluster: Optional[str] = None) -> List[NodeInfo]:
        """
        Get list of nodes in a cluster.
        
        Args:
            cluster: Cluster context name (uses active if not specified)
            
        Returns:
            List of NodeInfo objects
        """
        success, error = self._load_kubeconfig()
        if not success:
            return self._get_demo_nodes()
        
        try:
            core_v1 = self._k8s_client.CoreV1Api()
            nodes = core_v1.list_node()
            
            result = []
            for node in nodes.items:
                # Determine status
                status = ResourceStatus.UNKNOWN
                conditions = {}
                
                for condition in node.status.conditions or []:
                    conditions[condition.type] = condition.status == "True"
                    if condition.type == "Ready":
                        status = (
                            ResourceStatus.HEALTHY if condition.status == "True"
                            else ResourceStatus.ERROR
                        )
                
                # Determine role
                role = "worker"
                for label in (node.metadata.labels or {}):
                    if "control-plane" in label or "master" in label:
                        role = "control-plane"
                        break
                
                # Get IPs
                internal_ip = None
                external_ip = None
                for addr in node.status.addresses or []:
                    if addr.type == "InternalIP":
                        internal_ip = addr.address
                    elif addr.type == "ExternalIP":
                        external_ip = addr.address
                
                result.append(NodeInfo(
                    name=node.metadata.name,
                    status=status,
                    role=role,
                    kubernetes_version=node.status.node_info.kubelet_version,
                    os_image=node.status.node_info.os_image,
                    container_runtime=node.status.node_info.container_runtime_version,
                    internal_ip=internal_ip,
                    external_ip=external_ip,
                    conditions=conditions,
                    labels=node.metadata.labels or {},
                    taints=[f"{t.key}={t.value}:{t.effect}" for t in (node.spec.taints or [])],
                    created_at=node.metadata.creation_timestamp,
                ))
            
            return result
            
        except Exception as e:
            logger.error(f"Failed to get nodes: {e}")
            return self._get_demo_nodes()
    
    def get_pods(
        self,
        namespace: Optional[str] = None,
        cluster: Optional[str] = None,
    ) -> List[PodInfo]:
        """
        Get list of pods.
        
        Args:
            namespace: Filter by namespace (all if not specified)
            cluster: Cluster context name
            
        Returns:
            List of PodInfo objects
        """
        success, error = self._load_kubeconfig()
        if not success:
            return self._get_demo_pods()
        
        try:
            core_v1 = self._k8s_client.CoreV1Api()
            
            if namespace:
                pods = core_v1.list_namespaced_pod(namespace)
            else:
                pods = core_v1.list_pod_for_all_namespaces()
            
            result = []
            for pod in pods.items:
                # Get container statuses
                containers = []
                total_restarts = 0
                
                for cs in pod.status.container_statuses or []:
                    state = "unknown"
                    if cs.state.running:
                        state = "running"
                    elif cs.state.waiting:
                        state = f"waiting: {cs.state.waiting.reason}"
                    elif cs.state.terminated:
                        state = f"terminated: {cs.state.terminated.reason}"
                    
                    containers.append(ContainerStatus(
                        name=cs.name,
                        ready=cs.ready,
                        restart_count=cs.restart_count,
                        state=state,
                        image=cs.image,
                    ))
                    total_restarts += cs.restart_count
                
                # Derive status
                phase = PodPhase(pod.status.phase or "Unknown")
                status = ResourceStatus.UNKNOWN
                
                if phase == PodPhase.RUNNING:
                    status = ResourceStatus.HEALTHY
                elif phase == PodPhase.PENDING:
                    status = ResourceStatus.PENDING
                elif phase == PodPhase.FAILED:
                    status = ResourceStatus.ERROR
                elif phase == PodPhase.SUCCEEDED:
                    status = ResourceStatus.HEALTHY
                
                # Check for high restart count
                if total_restarts > 5:
                    status = ResourceStatus.WARNING
                
                result.append(PodInfo(
                    name=pod.metadata.name,
                    namespace=pod.metadata.namespace,
                    phase=phase,
                    status=status,
                    node_name=pod.spec.node_name,
                    pod_ip=pod.status.pod_ip,
                    containers=containers,
                    restart_count=total_restarts,
                    labels=pod.metadata.labels or {},
                    created_at=pod.metadata.creation_timestamp,
                ))
            
            return result
            
        except Exception as e:
            logger.error(f"Failed to get pods: {e}")
            return self._get_demo_pods()
    
    def get_namespaces(self, cluster: Optional[str] = None) -> List[NamespaceInfo]:
        """
        Get list of namespaces.
        
        Args:
            cluster: Cluster context name
            
        Returns:
            List of NamespaceInfo objects
        """
        success, error = self._load_kubeconfig()
        if not success:
            return self._get_demo_namespaces()
        
        try:
            core_v1 = self._k8s_client.CoreV1Api()
            apps_v1 = self._k8s_client.AppsV1Api()
            
            namespaces = core_v1.list_namespace()
            
            result = []
            for ns in namespaces.items:
                ns_name = ns.metadata.name
                
                # Get counts
                pods = core_v1.list_namespaced_pod(ns_name)
                deployments = apps_v1.list_namespaced_deployment(ns_name)
                services = core_v1.list_namespaced_service(ns_name)
                
                status = ResourceStatus.HEALTHY
                if ns.status.phase != "Active":
                    status = ResourceStatus.WARNING
                
                result.append(NamespaceInfo(
                    name=ns_name,
                    status=status,
                    pod_count=len(pods.items),
                    deployment_count=len(deployments.items),
                    service_count=len(services.items),
                    created_at=ns.metadata.creation_timestamp,
                    labels=ns.metadata.labels or {},
                ))
            
            return result
            
        except Exception as e:
            logger.error(f"Failed to get namespaces: {e}")
            return self._get_demo_namespaces()
    
    def switch_context(self, context: str) -> Tuple[bool, Optional[str]]:
        """
        Switch to a different Kubernetes context.
        
        Args:
            context: Name of the context to switch to
            
        Returns:
            Tuple of (success, error_message)
        """
        if not self._k8s_available:
            return False, "kubernetes package not installed"
        
        settings = get_settings()
        kubeconfig_path = settings.kubeconfig_path
        
        if not kubeconfig_path or not kubeconfig_path.exists():
            return False, "No kubeconfig found"
        
        try:
            # Load the specific context
            self._k8s_config.load_kube_config(
                config_file=str(kubeconfig_path),
                context=context
            )
            self._current_context = context
            logger.info(f"Switched to context: {context}")
            return True, None
            
        except Exception as e:
            logger.error(f"Failed to switch context to {context}: {e}")
            return False, str(e)
    
    def get_current_context(self) -> Optional[str]:
        """Get the currently active context name."""
        if self._current_context:
            return self._current_context
        
        settings = get_settings()
        kubeconfig_path = settings.kubeconfig_path
        
        if not kubeconfig_path or not kubeconfig_path.exists():
            return None
        
        try:
            contexts, active_context = self._k8s_config.list_kube_config_contexts(
                config_file=str(kubeconfig_path)
            )
            return active_context.get("name") if active_context else None
        except Exception:
            return None
    
    def get_node_metrics(self, cluster: Optional[str] = None) -> Dict[str, NodeMetrics]:
        """
        Get real metrics for nodes from metrics-server.
        
        Args:
            cluster: Cluster context name
            
        Returns:
            Dict mapping node name to NodeMetrics
        """
        if cluster:
            self.switch_context(cluster)
        
        success, error = self._load_kubeconfig()
        if not success:
            return {}
        
        try:
            # Use CustomObjectsApi to access metrics.k8s.io
            custom_api = self._k8s_client.CustomObjectsApi()
            
            # Get node metrics from metrics-server
            metrics = custom_api.list_cluster_custom_object(
                group="metrics.k8s.io",
                version="v1beta1",
                plural="nodes"
            )
            
            result = {}
            for item in metrics.get("items", []):
                node_name = item["metadata"]["name"]
                usage = item.get("usage", {})
                
                # Parse CPU (format: "123m" or "1")
                cpu_str = usage.get("cpu", "0")
                if cpu_str.endswith("n"):
                    cpu_cores = float(cpu_str[:-1]) / 1_000_000_000
                elif cpu_str.endswith("m"):
                    cpu_cores = float(cpu_str[:-1]) / 1000
                else:
                    cpu_cores = float(cpu_str)
                
                # Parse Memory (format: "123Ki" or "123Mi")
                mem_str = usage.get("memory", "0")
                if mem_str.endswith("Ki"):
                    mem_bytes = int(mem_str[:-2]) * 1024
                elif mem_str.endswith("Mi"):
                    mem_bytes = int(mem_str[:-2]) * 1024 * 1024
                elif mem_str.endswith("Gi"):
                    mem_bytes = int(mem_str[:-2]) * 1024 * 1024 * 1024
                else:
                    mem_bytes = int(mem_str) if mem_str.isdigit() else 0
                
                # Get node capacity for percentage calculation
                core_v1 = self._k8s_client.CoreV1Api()
                node = core_v1.read_node(node_name)
                
                capacity = node.status.capacity or {}
                allocatable = node.status.allocatable or {}
                
                # Parse capacity
                cpu_capacity_str = capacity.get("cpu", "1")
                cpu_capacity = float(cpu_capacity_str)
                
                mem_capacity_str = capacity.get("memory", "0")
                if mem_capacity_str.endswith("Ki"):
                    mem_capacity = int(mem_capacity_str[:-2]) * 1024
                elif mem_capacity_str.endswith("Mi"):
                    mem_capacity = int(mem_capacity_str[:-2]) * 1024 * 1024
                elif mem_capacity_str.endswith("Gi"):
                    mem_capacity = int(mem_capacity_str[:-2]) * 1024 * 1024 * 1024
                else:
                    mem_capacity = int(mem_capacity_str) if mem_capacity_str.isdigit() else 1
                
                # Calculate percentages
                cpu_percent = (cpu_cores / cpu_capacity * 100) if cpu_capacity > 0 else 0
                mem_percent = (mem_bytes / mem_capacity * 100) if mem_capacity > 0 else 0
                
                # Get pod count
                pods = core_v1.list_pod_for_all_namespaces(field_selector=f"spec.nodeName={node_name}")
                pod_count = len(pods.items)
                pod_capacity = int(allocatable.get("pods", "110"))
                
                result[node_name] = NodeMetrics(
                    cpu_usage_percent=min(cpu_percent, 100),
                    cpu_capacity_cores=cpu_capacity,
                    cpu_allocatable_cores=float(allocatable.get("cpu", str(cpu_capacity))),
                    memory_usage_percent=min(mem_percent, 100),
                    memory_capacity_bytes=mem_capacity,
                    memory_allocatable_bytes=mem_capacity,
                    pod_count=pod_count,
                    pod_capacity=pod_capacity,
                )
            
            return result
            
        except Exception as e:
            logger.warning(f"Failed to get node metrics (metrics-server may not be installed): {e}")
            return {}
    
    def get_pod_metrics(self, namespace: Optional[str] = None, cluster: Optional[str] = None) -> Dict[str, dict]:
        """
        Get real metrics for pods from metrics-server.
        
        Args:
            namespace: Filter by namespace
            cluster: Cluster context name
            
        Returns:
            Dict mapping "namespace/pod_name" to metrics dict
        """
        if cluster:
            self.switch_context(cluster)
        
        success, error = self._load_kubeconfig()
        if not success:
            return {}
        
        try:
            custom_api = self._k8s_client.CustomObjectsApi()
            
            if namespace:
                metrics = custom_api.list_namespaced_custom_object(
                    group="metrics.k8s.io",
                    version="v1beta1",
                    namespace=namespace,
                    plural="pods"
                )
            else:
                metrics = custom_api.list_cluster_custom_object(
                    group="metrics.k8s.io",
                    version="v1beta1",
                    plural="pods"
                )
            
            result = {}
            for item in metrics.get("items", []):
                pod_name = item["metadata"]["name"]
                pod_ns = item["metadata"]["namespace"]
                containers = item.get("containers", [])
                
                total_cpu = 0
                total_mem = 0
                
                for container in containers:
                    usage = container.get("usage", {})
                    
                    # Parse CPU
                    cpu_str = usage.get("cpu", "0")
                    if cpu_str.endswith("n"):
                        total_cpu += float(cpu_str[:-1]) / 1_000_000_000
                    elif cpu_str.endswith("m"):
                        total_cpu += float(cpu_str[:-1]) / 1000
                    else:
                        total_cpu += float(cpu_str) if cpu_str else 0
                    
                    # Parse Memory
                    mem_str = usage.get("memory", "0")
                    if mem_str.endswith("Ki"):
                        total_mem += int(mem_str[:-2]) * 1024
                    elif mem_str.endswith("Mi"):
                        total_mem += int(mem_str[:-2]) * 1024 * 1024
                    elif mem_str.endswith("Gi"):
                        total_mem += int(mem_str[:-2]) * 1024 * 1024 * 1024
                    else:
                        total_mem += int(mem_str) if mem_str.isdigit() else 0
                
                result[f"{pod_ns}/{pod_name}"] = {
                    "cpu_cores": total_cpu,
                    "memory_bytes": total_mem,
                    "containers": len(containers),
                }
            
            return result
            
        except Exception as e:
            logger.warning(f"Failed to get pod metrics: {e}")
            return {}
    
    # -------------------------------------------------------------------------
    # Demo Data (used when no real cluster is connected)
    # -------------------------------------------------------------------------
    
    def _get_demo_clusters(self) -> List[ClusterInfo]:
        """Return demo cluster data for UI development."""
        return [
            ClusterInfo(
                name="demo-local",
                context="demo-local",
                status=ClusterStatus.CONNECTED,
                version="1.28",
                node_count=3,
                namespace_count=8,
                pod_count=24,
            ),
            ClusterInfo(
                name="demo-staging",
                context="demo-staging",
                status=ClusterStatus.DISCONNECTED,
                error="Demo cluster - not connected",
            ),
        ]
    
    def _get_demo_nodes(self) -> List[NodeInfo]:
        """Return demo node data."""
        return [
            NodeInfo(
                name="demo-control-plane",
                status=ResourceStatus.HEALTHY,
                role="control-plane",
                kubernetes_version="v1.28.0",
                os_image="Ubuntu 22.04 LTS",
                container_runtime="containerd://1.7.0",
                internal_ip="10.0.0.1",
                conditions={"Ready": True, "MemoryPressure": False, "DiskPressure": False},
                labels={"node-role.kubernetes.io/control-plane": ""},
                metrics=NodeMetrics(
                    cpu_usage_percent=35.2,
                    cpu_capacity_cores=4,
                    cpu_allocatable_cores=3.8,
                    memory_usage_percent=62.5,
                    memory_capacity_bytes=8589934592,
                    memory_allocatable_bytes=7516192768,
                    pod_count=12,
                    pod_capacity=110,
                ),
            ),
            NodeInfo(
                name="demo-worker-1",
                status=ResourceStatus.HEALTHY,
                role="worker",
                kubernetes_version="v1.28.0",
                os_image="Ubuntu 22.04 LTS",
                container_runtime="containerd://1.7.0",
                internal_ip="10.0.0.2",
                conditions={"Ready": True, "MemoryPressure": False, "DiskPressure": False},
                labels={"node.kubernetes.io/instance-type": "m5.large"},
                metrics=NodeMetrics(
                    cpu_usage_percent=45.8,
                    cpu_capacity_cores=2,
                    cpu_allocatable_cores=1.9,
                    memory_usage_percent=71.3,
                    memory_capacity_bytes=4294967296,
                    memory_allocatable_bytes=3758096384,
                    pod_count=8,
                    pod_capacity=110,
                ),
            ),
            NodeInfo(
                name="demo-worker-2",
                status=ResourceStatus.WARNING,
                role="worker",
                kubernetes_version="v1.28.0",
                os_image="Ubuntu 22.04 LTS",
                container_runtime="containerd://1.7.0",
                internal_ip="10.0.0.3",
                conditions={"Ready": True, "MemoryPressure": True, "DiskPressure": False},
                labels={"node.kubernetes.io/instance-type": "m5.large"},
                metrics=NodeMetrics(
                    cpu_usage_percent=78.2,
                    cpu_capacity_cores=2,
                    cpu_allocatable_cores=1.9,
                    memory_usage_percent=89.1,
                    memory_capacity_bytes=4294967296,
                    memory_allocatable_bytes=3758096384,
                    pod_count=15,
                    pod_capacity=110,
                ),
            ),
        ]
    
    def _get_demo_pods(self) -> List[PodInfo]:
        """Return demo pod data."""
        now = datetime.now(timezone.utc)
        return [
            PodInfo(
                name="nginx-deployment-abc123",
                namespace="default",
                phase=PodPhase.RUNNING,
                status=ResourceStatus.HEALTHY,
                node_name="demo-worker-1",
                pod_ip="10.244.0.5",
                containers=[
                    ContainerStatus(
                        name="nginx",
                        ready=True,
                        restart_count=0,
                        state="running",
                        image="nginx:1.25",
                    )
                ],
                restart_count=0,
                labels={"app": "nginx", "tier": "frontend"},
                created_at=now,
            ),
            PodInfo(
                name="api-server-xyz789",
                namespace="backend",
                phase=PodPhase.RUNNING,
                status=ResourceStatus.HEALTHY,
                node_name="demo-worker-1",
                pod_ip="10.244.0.8",
                containers=[
                    ContainerStatus(
                        name="api",
                        ready=True,
                        restart_count=2,
                        state="running",
                        image="myapp/api:v1.2.3",
                    )
                ],
                restart_count=2,
                labels={"app": "api-server", "tier": "backend"},
                created_at=now,
            ),
            PodInfo(
                name="redis-master-0",
                namespace="cache",
                phase=PodPhase.RUNNING,
                status=ResourceStatus.HEALTHY,
                node_name="demo-worker-2",
                pod_ip="10.244.1.3",
                containers=[
                    ContainerStatus(
                        name="redis",
                        ready=True,
                        restart_count=0,
                        state="running",
                        image="redis:7.2",
                    )
                ],
                restart_count=0,
                labels={"app": "redis", "role": "master"},
                created_at=now,
            ),
            PodInfo(
                name="crashloop-pod-def456",
                namespace="default",
                phase=PodPhase.RUNNING,
                status=ResourceStatus.WARNING,
                node_name="demo-worker-2",
                pod_ip="10.244.1.7",
                containers=[
                    ContainerStatus(
                        name="buggy-app",
                        ready=False,
                        restart_count=15,
                        state="waiting: CrashLoopBackOff",
                        image="myapp/buggy:latest",
                    )
                ],
                restart_count=15,
                labels={"app": "buggy-app"},
                created_at=now,
            ),
        ]
    
    def _get_demo_namespaces(self) -> List[NamespaceInfo]:
        """Return demo namespace data."""
        now = datetime.now(timezone.utc)
        return [
            NamespaceInfo(
                name="default",
                status=ResourceStatus.HEALTHY,
                pod_count=5,
                deployment_count=2,
                service_count=3,
                created_at=now,
                labels={},
            ),
            NamespaceInfo(
                name="kube-system",
                status=ResourceStatus.HEALTHY,
                pod_count=12,
                deployment_count=4,
                service_count=2,
                created_at=now,
                labels={"kubernetes.io/metadata.name": "kube-system"},
            ),
            NamespaceInfo(
                name="backend",
                status=ResourceStatus.HEALTHY,
                pod_count=8,
                deployment_count=3,
                service_count=4,
                created_at=now,
                labels={"env": "production", "team": "platform"},
            ),
            NamespaceInfo(
                name="monitoring",
                status=ResourceStatus.HEALTHY,
                pod_count=6,
                deployment_count=3,
                service_count=5,
                created_at=now,
                labels={"env": "production", "team": "sre"},
            ),
        ]

    # -------------------------------------------------------------------------
    # Deployment Management
    # -------------------------------------------------------------------------

    def list_deployments(
        self,
        namespace: Optional[str] = None,
        cluster: Optional[str] = None,
    ) -> List[dict]:
        """
        List all deployments.

        Args:
            namespace: Filter by namespace
            cluster: Cluster context name

        Returns:
            List of deployment info dicts
        """
        success, error = self._load_kubeconfig()
        if not success:
            return self._get_demo_deployments(namespace)

        try:
            apps_v1 = self._k8s_client.AppsV1Api()

            if namespace:
                deployments = apps_v1.list_namespaced_deployment(namespace=namespace)
            else:
                deployments = apps_v1.list_deployment_for_all_namespaces()

            result = []
            for dep in deployments.items:
                spec = dep.spec
                status = dep.status

                # Get container image
                image = "unknown"
                if spec.template.spec.containers:
                    image = spec.template.spec.containers[0].image

                result.append({
                    "name": dep.metadata.name,
                    "namespace": dep.metadata.namespace,
                    "replicas": spec.replicas or 0,
                    "available_replicas": status.available_replicas or 0,
                    "ready_replicas": status.ready_replicas or 0,
                    "updated_replicas": status.updated_replicas or 0,
                    "image": image,
                    "strategy": spec.strategy.type if spec.strategy else "RollingUpdate",
                })

            return result

        except Exception as e:
            logger.error(f"Failed to list deployments: {e}")
            return self._get_demo_deployments(namespace)

    def scale_deployment(
        self,
        namespace: str,
        name: str,
        replicas: int,
        cluster: Optional[str] = None,
    ) -> dict:
        """
        Scale a deployment.

        Args:
            namespace: Deployment namespace
            name: Deployment name
            replicas: Desired replica count
            cluster: Cluster context name

        Returns:
            Dict with operation result
        """
        success, error = self._load_kubeconfig()
        if not success:
            return {
                "success": True,
                "namespace": namespace,
                "deployment": name,
                "previous_replicas": 3,
                "current_replicas": replicas,
                "message": "Demo mode - scale simulated",
            }

        try:
            apps_v1 = self._k8s_client.AppsV1Api()

            # Get current deployment
            deployment = apps_v1.read_namespaced_deployment(name=name, namespace=namespace)
            previous_replicas = deployment.spec.replicas or 0

            # Patch the deployment
            body = {"spec": {"replicas": replicas}}
            apps_v1.patch_namespaced_deployment(
                name=name,
                namespace=namespace,
                body=body,
            )

            return {
                "success": True,
                "namespace": namespace,
                "deployment": name,
                "previous_replicas": previous_replicas,
                "current_replicas": replicas,
                "message": f"Scaled from {previous_replicas} to {replicas} replicas",
            }

        except self._k8s_client.ApiException as e:
            logger.error(f"Failed to scale deployment {namespace}/{name}: {e}")
            return {
                "success": False,
                "namespace": namespace,
                "deployment": name,
                "previous_replicas": 0,
                "current_replicas": 0,
                "message": f"API error: {e.reason}",
            }
        except Exception as e:
            logger.error(f"Failed to scale deployment: {e}")
            return {
                "success": False,
                "namespace": namespace,
                "deployment": name,
                "previous_replicas": 0,
                "current_replicas": 0,
                "message": str(e),
            }

    def restart_deployment(
        self,
        namespace: str,
        name: str,
        cluster: Optional[str] = None,
    ) -> dict:
        """
        Restart a deployment by patching the pod template.

        Args:
            namespace: Deployment namespace
            name: Deployment name
            cluster: Cluster context name

        Returns:
            Dict with operation result
        """
        success, error = self._load_kubeconfig()
        if not success:
            return {
                "success": True,
                "namespace": namespace,
                "deployment": name,
                "message": "Demo mode - restart simulated",
            }

        try:
            apps_v1 = self._k8s_client.AppsV1Api()

            # Patch with restart annotation
            now = datetime.now(timezone.utc).isoformat()
            body = {
                "spec": {
                    "template": {
                        "metadata": {
                            "annotations": {
                                "kubectl.kubernetes.io/restartedAt": now
                            }
                        }
                    }
                }
            }

            apps_v1.patch_namespaced_deployment(
                name=name,
                namespace=namespace,
                body=body,
            )

            return {
                "success": True,
                "namespace": namespace,
                "deployment": name,
                "message": f"Deployment restart initiated at {now}",
            }

        except self._k8s_client.ApiException as e:
            logger.error(f"Failed to restart deployment {namespace}/{name}: {e}")
            return {
                "success": False,
                "namespace": namespace,
                "deployment": name,
                "message": f"API error: {e.reason}",
            }
        except Exception as e:
            logger.error(f"Failed to restart deployment: {e}")
            return {
                "success": False,
                "namespace": namespace,
                "deployment": name,
                "message": str(e),
            }

    def delete_pod(
        self,
        namespace: str,
        name: str,
        cluster: Optional[str] = None,
    ) -> dict:
        """
        Delete a pod.

        Args:
            namespace: Pod namespace
            name: Pod name
            cluster: Cluster context name

        Returns:
            Dict with operation result
        """
        success, error = self._load_kubeconfig()
        if not success:
            return {
                "success": True,
                "namespace": namespace,
                "pod": name,
                "message": "Demo mode - delete simulated",
            }

        try:
            core_v1 = self._k8s_client.CoreV1Api()

            core_v1.delete_namespaced_pod(
                name=name,
                namespace=namespace,
            )

            return {
                "success": True,
                "namespace": namespace,
                "pod": name,
                "message": f"Pod {name} deleted successfully",
            }

        except self._k8s_client.ApiException as e:
            logger.error(f"Failed to delete pod {namespace}/{name}: {e}")
            return {
                "success": False,
                "namespace": namespace,
                "pod": name,
                "message": f"API error: {e.reason}",
            }
        except Exception as e:
            logger.error(f"Failed to delete pod: {e}")
            return {
                "success": False,
                "namespace": namespace,
                "pod": name,
                "message": str(e),
            }

    def _get_demo_deployments(self, namespace: Optional[str] = None) -> List[dict]:
        """Return demo deployment data."""
        deployments = [
            {
                "name": "frontend",
                "namespace": "default",
                "replicas": 3,
                "available_replicas": 3,
                "ready_replicas": 3,
                "updated_replicas": 3,
                "image": "myapp/frontend:v2.1.0",
                "strategy": "RollingUpdate",
            },
            {
                "name": "backend-api",
                "namespace": "backend",
                "replicas": 5,
                "available_replicas": 5,
                "ready_replicas": 5,
                "updated_replicas": 5,
                "image": "myapp/api:v1.8.3",
                "strategy": "RollingUpdate",
            },
            {
                "name": "worker",
                "namespace": "backend",
                "replicas": 2,
                "available_replicas": 2,
                "ready_replicas": 2,
                "updated_replicas": 2,
                "image": "myapp/worker:v1.4.0",
                "strategy": "RollingUpdate",
            },
            {
                "name": "prometheus",
                "namespace": "monitoring",
                "replicas": 1,
                "available_replicas": 1,
                "ready_replicas": 1,
                "updated_replicas": 1,
                "image": "prom/prometheus:v2.45.0",
                "strategy": "Recreate",
            },
        ]

        if namespace:
            return [d for d in deployments if d["namespace"] == namespace]
        return deployments


# Singleton instance
_kubernetes_service: Optional[KubernetesService] = None


def get_kubernetes_service() -> KubernetesService:
    """Get the Kubernetes service singleton."""
    global _kubernetes_service
    if _kubernetes_service is None:
        _kubernetes_service = KubernetesService()
    return _kubernetes_service

