/**
 * React hooks for Kubernetes data fetching
 * 
 * Provides hooks to fetch real data from the backend API,
 * with automatic fallback to demo data when backend is unavailable.
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  apiClient, 
  ClusterInfo, 
  NodeInfo, 
  PodInfo, 
  NamespaceInfo,
  ClusterListResponse 
} from '../services/api';
import { InfrastructureNode, ResourceType, Status } from '../types';

// ============================================================================
// Types
// ============================================================================

interface UseKubernetesState<T> {
  data: T;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  isBackendConnected: boolean;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Convert API status to app Status enum
 */
const mapStatus = (status: string): Status => {
  switch (status) {
    case 'healthy':
    case 'connected':
      return Status.HEALTHY;
    case 'warning':
      return Status.WARNING;
    case 'error':
    case 'disconnected':
      return Status.ERROR;
    case 'pending':
      return Status.PENDING;
    default:
      return Status.HEALTHY;
  }
};

/**
 * Convert NodeInfo to InfrastructureNode format
 */
const nodeToInfraNode = (node: NodeInfo): InfrastructureNode => ({
  id: `node-${node.name}`,
  name: node.name,
  type: node.role === 'control-plane' ? ResourceType.K8S_CLUSTER : ResourceType.NODE,
  status: mapStatus(node.status),
  metrics: {
    cpu: node.metrics?.cpu_usage_percent ?? Math.random() * 50 + 10,
    memory: node.metrics?.memory_usage_percent ?? Math.random() * 60 + 20,
    network: 0,
    latency: 0,
  },
  description: `${node.kubernetes_version} • ${node.os_image}`,
  region: node.internal_ip || 'local',
  uptime: node.created_at ? getUptime(new Date(node.created_at)) : 'unknown',
  tags: Object.entries(node.labels || {}).slice(0, 3).map(([k, v]) => `${k}=${v}`),
});

/**
 * Convert PodInfo to InfrastructureNode format
 */
const podToInfraNode = (pod: PodInfo): InfrastructureNode => {
  // Determine status based on phase and restart count
  let status = Status.HEALTHY;
  if (pod.phase === 'Failed') status = Status.ERROR;
  else if (pod.phase === 'Pending') status = Status.PENDING;
  else if (pod.restart_count > 5) status = Status.WARNING;

  return {
    id: `pod-${pod.namespace}-${pod.name}`,
    name: pod.name,
    type: ResourceType.POD,
    status,
    metrics: {
      cpu: Math.random() * 40 + 5, // TODO: Get from metrics-server
      memory: Math.random() * 50 + 10,
      network: 0,
      latency: 0,
    },
    description: `${pod.namespace} • ${pod.containers.length} container(s) • ${pod.restart_count} restarts`,
    region: pod.node_name || 'unscheduled',
    uptime: pod.created_at ? getUptime(new Date(pod.created_at)) : 'unknown',
    tags: Object.entries(pod.labels || {}).slice(0, 3).map(([k, v]) => v),
  };
};

/**
 * Calculate uptime string from date
 */
const getUptime = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h`;
  return 'just now';
};

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook to fetch cluster list
 */
export function useClusters(): UseKubernetesState<ClusterInfo[]> {
  const [data, setData] = useState<ClusterInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isBackendConnected, setIsBackendConnected] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const available = await apiClient.checkBackendAvailable();
      setIsBackendConnected(available);

      if (available) {
        const response = await apiClient.listClusters();
        setData(response.clusters);
      } else {
        // Demo data
        setData([{
          name: 'Demo Cluster',
          context: 'demo',
          status: 'connected',
          version: '1.28',
          node_count: 3,
          namespace_count: 8,
          pod_count: 24,
        }]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch clusters');
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData, isBackendConnected };
}

/**
 * Hook to fetch nodes
 */
export function useNodes(cluster?: string): UseKubernetesState<NodeInfo[]> {
  const [data, setData] = useState<NodeInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isBackendConnected, setIsBackendConnected] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const available = await apiClient.checkBackendAvailable();
      setIsBackendConnected(available);

      if (available) {
        const nodes = await apiClient.listNodes(cluster);
        setData(nodes);
      } else {
        setData([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch nodes');
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, [cluster]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData, isBackendConnected };
}

/**
 * Hook to fetch pods
 */
export function usePods(namespace?: string, cluster?: string): UseKubernetesState<PodInfo[]> {
  const [data, setData] = useState<PodInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isBackendConnected, setIsBackendConnected] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const available = await apiClient.checkBackendAvailable();
      setIsBackendConnected(available);

      if (available) {
        const pods = await apiClient.listPods(namespace, cluster);
        setData(pods);
      } else {
        setData([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch pods');
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, [namespace, cluster]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData, isBackendConnected };
}

/**
 * Hook to fetch namespaces
 */
export function useNamespaces(cluster?: string): UseKubernetesState<NamespaceInfo[]> {
  const [data, setData] = useState<NamespaceInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isBackendConnected, setIsBackendConnected] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const available = await apiClient.checkBackendAvailable();
      setIsBackendConnected(available);

      if (available) {
        const namespaces = await apiClient.listNamespaces(cluster);
        setData(namespaces);
      } else {
        setData([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch namespaces');
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, [cluster]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData, isBackendConnected };
}

/**
 * Combined hook for Infrastructure view
 * Fetches both nodes and pods and converts them to InfrastructureNode format
 */
export function useInfrastructure(cluster?: string): UseKubernetesState<InfrastructureNode[]> {
  const [data, setData] = useState<InfrastructureNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isBackendConnected, setIsBackendConnected] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const available = await apiClient.checkBackendAvailable();
      setIsBackendConnected(available);

      if (available) {
        // Fetch nodes and pods in parallel
        const [nodes, pods] = await Promise.all([
          apiClient.listNodes(cluster),
          apiClient.listPods(undefined, cluster),
        ]);

        // Convert to InfrastructureNode format
        const infraNodes: InfrastructureNode[] = [
          ...nodes.map(nodeToInfraNode),
          ...pods.slice(0, 20).map(podToInfraNode), // Limit pods to avoid overwhelming UI
        ];

        setData(infraNodes);
      } else {
        // Return empty - will fall back to mock data in component
        setData([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch infrastructure');
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, [cluster]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData, isBackendConnected };
}

/**
 * Hook to get active cluster from context
 */
export function useActiveCluster(): {
  activeCluster: ClusterInfo | null;
  setActiveCluster: (cluster: ClusterInfo) => void;
  clusters: ClusterInfo[];
  isLoading: boolean;
} {
  const { data: clusters, isLoading } = useClusters();
  const [activeCluster, setActiveCluster] = useState<ClusterInfo | null>(null);

  useEffect(() => {
    if (clusters.length > 0 && !activeCluster) {
      // Set first connected cluster as active
      const connected = clusters.find(c => c.status === 'connected');
      setActiveCluster(connected || clusters[0]);
    }
  }, [clusters, activeCluster]);

  return { activeCluster, setActiveCluster, clusters, isLoading };
}

