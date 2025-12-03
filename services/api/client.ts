/**
 * OpsSight API Client
 * 
 * Provides a type-safe interface to the OpsSight backend API.
 * Automatically handles:
 * - Base URL configuration
 * - Error handling
 * - Response parsing
 * - Demo mode fallback
 */

// Types
export interface HealthResponse {
  status: 'healthy' | 'unhealthy';
  version: string;
  timestamp: string;
}

export interface IntegrationStatus {
  name: string;
  configured: boolean;
  connected: boolean;
  error?: string;
}

export interface ConfigStatusResponse {
  mode: 'local' | 'docker' | 'kubernetes';
  integrations: Record<string, boolean>;
  details: IntegrationStatus[];
}

export type ClusterStatus = 'connected' | 'disconnected' | 'error' | 'unknown';
export type ResourceStatus = 'healthy' | 'warning' | 'error' | 'pending' | 'unknown';

export interface ClusterInfo {
  name: string;
  context: string;
  status: ClusterStatus;
  server_url?: string;
  version?: string;
  node_count: number;
  namespace_count: number;
  pod_count: number;
  error?: string;
}

export interface ClusterListResponse {
  clusters: ClusterInfo[];
  active_cluster?: string;
}

export interface NodeMetrics {
  cpu_usage_percent: number;
  cpu_capacity_cores: number;
  cpu_allocatable_cores: number;
  memory_usage_percent: number;
  memory_capacity_bytes: number;
  memory_allocatable_bytes: number;
  pod_count: number;
  pod_capacity: number;
}

export interface NodeInfo {
  name: string;
  status: ResourceStatus;
  role: string;
  kubernetes_version: string;
  os_image: string;
  container_runtime: string;
  internal_ip?: string;
  external_ip?: string;
  metrics?: NodeMetrics;
  conditions: Record<string, boolean>;
  labels: Record<string, string>;
  taints: string[];
  created_at?: string;
}

export interface ContainerStatus {
  name: string;
  ready: boolean;
  restart_count: number;
  state: string;
  image: string;
}

export interface PodInfo {
  name: string;
  namespace: string;
  phase: 'Pending' | 'Running' | 'Succeeded' | 'Failed' | 'Unknown';
  status: ResourceStatus;
  node_name?: string;
  pod_ip?: string;
  containers: ContainerStatus[];
  restart_count: number;
  labels: Record<string, string>;
  created_at?: string;
}

export interface NamespaceInfo {
  name: string;
  status: ResourceStatus;
  pod_count: number;
  deployment_count: number;
  service_count: number;
  created_at?: string;
  labels: Record<string, string>;
}

export interface SwitchContextResponse {
  success: boolean;
  context: string;
  error?: string;
}

export interface PodMetrics {
  cpu_cores: number;
  memory_bytes: number;
  containers: number;
}

export interface ApiError {
  error: string;
  message: string;
  detail?: string;
}

// Configuration
const getApiUrl = (): string => {
  // Check for environment variable first
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) {
    return envUrl;
  }
  
  // Default to localhost in development
  if (import.meta.env.DEV) {
    return 'http://localhost:8000';
  }
  
  // In production, assume API is on same host
  return window.location.origin;
};

const API_BASE_URL = getApiUrl();

/**
 * API Client class for OpsSight backend
 */
class ApiClient {
  private baseUrl: string;
  private isBackendAvailable: boolean | null = null;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Check if the backend API is available
   */
  async checkBackendAvailable(): Promise<boolean> {
    if (this.isBackendAvailable !== null) {
      return this.isBackendAvailable;
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/v1/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(3000), // 3 second timeout
      });
      this.isBackendAvailable = response.ok;
    } catch {
      this.isBackendAvailable = false;
    }

    return this.isBackendAvailable;
  }

  /**
   * Reset the backend availability check
   */
  resetAvailabilityCheck(): void {
    this.isBackendAvailable = null;
  }

  /**
   * Make an API request
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({
        error: 'UnknownError',
        message: `HTTP ${response.status}: ${response.statusText}`,
      }));
      throw new Error(error.message);
    }

    return response.json();
  }

  // -------------------------------------------------------------------------
  // Health & Config Endpoints
  // -------------------------------------------------------------------------

  /**
   * Get API health status
   */
  async getHealth(): Promise<HealthResponse> {
    return this.request<HealthResponse>('/api/v1/health');
  }

  /**
   * Get configuration status
   */
  async getConfigStatus(): Promise<ConfigStatusResponse> {
    return this.request<ConfigStatusResponse>('/api/v1/config/status');
  }

  /**
   * Get integration details
   */
  async getIntegrations(): Promise<IntegrationStatus[]> {
    return this.request<IntegrationStatus[]>('/api/v1/config/integrations');
  }

  // -------------------------------------------------------------------------
  // Kubernetes Endpoints
  // -------------------------------------------------------------------------

  /**
   * List all Kubernetes clusters
   */
  async listClusters(): Promise<ClusterListResponse> {
    return this.request<ClusterListResponse>('/api/v1/kubernetes/clusters');
  }

  /**
   * Get details for a specific cluster
   */
  async getCluster(clusterName: string): Promise<ClusterInfo> {
    return this.request<ClusterInfo>(
      `/api/v1/kubernetes/clusters/${encodeURIComponent(clusterName)}`
    );
  }

  /**
   * List nodes in a cluster
   */
  async listNodes(cluster?: string): Promise<NodeInfo[]> {
    const params = cluster ? `?cluster=${encodeURIComponent(cluster)}` : '';
    return this.request<NodeInfo[]>(`/api/v1/kubernetes/nodes${params}`);
  }

  /**
   * List namespaces in a cluster
   */
  async listNamespaces(cluster?: string): Promise<NamespaceInfo[]> {
    const params = cluster ? `?cluster=${encodeURIComponent(cluster)}` : '';
    return this.request<NamespaceInfo[]>(`/api/v1/kubernetes/namespaces${params}`);
  }

  /**
   * List pods, optionally filtered by namespace
   */
  async listPods(namespace?: string, cluster?: string): Promise<PodInfo[]> {
    const params = new URLSearchParams();
    if (namespace) params.set('namespace', namespace);
    if (cluster) params.set('cluster', cluster);
    const queryString = params.toString();
    return this.request<PodInfo[]>(
      `/api/v1/kubernetes/pods${queryString ? `?${queryString}` : ''}`
    );
  }

  // -------------------------------------------------------------------------
  // Context Management
  // -------------------------------------------------------------------------

  /**
   * Switch Kubernetes context
   */
  async switchContext(context: string): Promise<SwitchContextResponse> {
    return this.request<SwitchContextResponse>('/api/v1/kubernetes/context', {
      method: 'POST',
      body: JSON.stringify({ context }),
    });
  }

  /**
   * Get current context
   */
  async getCurrentContext(): Promise<{ context: string | null }> {
    return this.request<{ context: string | null }>('/api/v1/kubernetes/context');
  }

  // -------------------------------------------------------------------------
  // Metrics
  // -------------------------------------------------------------------------

  /**
   * Get node metrics from metrics-server
   */
  async getNodeMetrics(cluster?: string): Promise<Record<string, NodeMetrics>> {
    const params = cluster ? `?cluster=${encodeURIComponent(cluster)}` : '';
    return this.request<Record<string, NodeMetrics>>(`/api/v1/kubernetes/metrics/nodes${params}`);
  }

  /**
   * Get pod metrics from metrics-server
   */
  async getPodMetrics(namespace?: string, cluster?: string): Promise<Record<string, PodMetrics>> {
    const params = new URLSearchParams();
    if (namespace) params.set('namespace', namespace);
    if (cluster) params.set('cluster', cluster);
    const queryString = params.toString();
    return this.request<Record<string, PodMetrics>>(
      `/api/v1/kubernetes/metrics/pods${queryString ? `?${queryString}` : ''}`
    );
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export class for testing or custom instances
export { ApiClient };

