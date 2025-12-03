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
  status: "healthy" | "unhealthy";
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
  mode: "local" | "docker" | "kubernetes";
  integrations: Record<string, boolean>;
  details: IntegrationStatus[];
}

export type ClusterStatus = "connected" | "disconnected" | "error" | "unknown";
export type ResourceStatus =
  | "healthy"
  | "warning"
  | "error"
  | "pending"
  | "unknown";

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
  phase: "Pending" | "Running" | "Succeeded" | "Failed" | "Unknown";
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
    return "http://localhost:8000";
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
        method: "GET",
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
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({
        error: "UnknownError",
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
    return this.request<HealthResponse>("/api/v1/health");
  }

  /**
   * Get configuration status
   */
  async getConfigStatus(): Promise<ConfigStatusResponse> {
    return this.request<ConfigStatusResponse>("/api/v1/config/status");
  }

  /**
   * Get integration details
   */
  async getIntegrations(): Promise<IntegrationStatus[]> {
    return this.request<IntegrationStatus[]>("/api/v1/config/integrations");
  }

  // -------------------------------------------------------------------------
  // Kubernetes Endpoints
  // -------------------------------------------------------------------------

  /**
   * List all Kubernetes clusters
   */
  async listClusters(): Promise<ClusterListResponse> {
    return this.request<ClusterListResponse>("/api/v1/kubernetes/clusters");
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
    const params = cluster ? `?cluster=${encodeURIComponent(cluster)}` : "";
    return this.request<NodeInfo[]>(`/api/v1/kubernetes/nodes${params}`);
  }

  /**
   * List namespaces in a cluster
   */
  async listNamespaces(cluster?: string): Promise<NamespaceInfo[]> {
    const params = cluster ? `?cluster=${encodeURIComponent(cluster)}` : "";
    return this.request<NamespaceInfo[]>(
      `/api/v1/kubernetes/namespaces${params}`
    );
  }

  /**
   * List pods, optionally filtered by namespace
   */
  async listPods(namespace?: string, cluster?: string): Promise<PodInfo[]> {
    const params = new URLSearchParams();
    if (namespace) params.set("namespace", namespace);
    if (cluster) params.set("cluster", cluster);
    const queryString = params.toString();
    return this.request<PodInfo[]>(
      `/api/v1/kubernetes/pods${queryString ? `?${queryString}` : ""}`
    );
  }

  // -------------------------------------------------------------------------
  // Context Management
  // -------------------------------------------------------------------------

  /**
   * Switch Kubernetes context
   */
  async switchContext(context: string): Promise<SwitchContextResponse> {
    return this.request<SwitchContextResponse>("/api/v1/kubernetes/context", {
      method: "POST",
      body: JSON.stringify({ context }),
    });
  }

  /**
   * Get current context
   */
  async getCurrentContext(): Promise<{ context: string | null }> {
    return this.request<{ context: string | null }>(
      "/api/v1/kubernetes/context"
    );
  }

  // -------------------------------------------------------------------------
  // Metrics
  // -------------------------------------------------------------------------

  /**
   * Get node metrics from metrics-server
   */
  async getNodeMetrics(cluster?: string): Promise<Record<string, NodeMetrics>> {
    const params = cluster ? `?cluster=${encodeURIComponent(cluster)}` : "";
    return this.request<Record<string, NodeMetrics>>(
      `/api/v1/kubernetes/metrics/nodes${params}`
    );
  }

  /**
   * Get pod metrics from metrics-server
   */
  async getPodMetrics(
    namespace?: string,
    cluster?: string
  ): Promise<Record<string, PodMetrics>> {
    const params = new URLSearchParams();
    if (namespace) params.set("namespace", namespace);
    if (cluster) params.set("cluster", cluster);
    const queryString = params.toString();
    return this.request<Record<string, PodMetrics>>(
      `/api/v1/kubernetes/metrics/pods${queryString ? `?${queryString}` : ""}`
    );
  }

  // -------------------------------------------------------------------------
  // Deployments
  // -------------------------------------------------------------------------

  /**
   * List deployments
   */
  async listDeployments(
    namespace?: string,
    cluster?: string
  ): Promise<DeploymentInfo[]> {
    const params = new URLSearchParams();
    if (namespace) params.set("namespace", namespace);
    if (cluster) params.set("cluster", cluster);
    const queryString = params.toString();
    return this.request<DeploymentInfo[]>(
      `/api/v1/kubernetes/deployments${queryString ? `?${queryString}` : ""}`
    );
  }

  /**
   * Scale a deployment
   */
  async scaleDeployment(
    namespace: string,
    name: string,
    replicas: number
  ): Promise<ScaleResponse> {
    return this.request<ScaleResponse>(
      `/api/v1/kubernetes/deployments/${namespace}/${name}/scale`,
      {
        method: "POST",
        body: JSON.stringify({ replicas }),
      }
    );
  }

  /**
   * Restart a deployment
   */
  async restartDeployment(
    namespace: string,
    name: string
  ): Promise<RestartResponse> {
    return this.request<RestartResponse>(
      `/api/v1/kubernetes/deployments/${namespace}/${name}/restart`,
      { method: "POST" }
    );
  }

  /**
   * Delete a pod
   */
  async deletePod(
    namespace: string,
    name: string
  ): Promise<{ success: boolean; message?: string }> {
    return this.request<{ success: boolean; message?: string }>(
      `/api/v1/kubernetes/pods/${namespace}/${name}`,
      { method: "DELETE" }
    );
  }

  // -------------------------------------------------------------------------
  // GitHub Actions
  // -------------------------------------------------------------------------

  /**
   * List GitHub workflow runs
   */
  async listWorkflowRuns(
    owner: string,
    repo: string,
    options?: { branch?: string; status?: string; perPage?: number }
  ): Promise<WorkflowRunsResponse> {
    const params = new URLSearchParams();
    params.set("owner", owner);
    params.set("repo", repo);
    if (options?.branch) params.set("branch", options.branch);
    if (options?.status) params.set("status", options.status);
    if (options?.perPage) params.set("per_page", options.perPage.toString());
    return this.request<WorkflowRunsResponse>(
      `/api/v1/integrations/github/workflows?${params.toString()}`
    );
  }

  // -------------------------------------------------------------------------
  // ArgoCD
  // -------------------------------------------------------------------------

  /**
   * List ArgoCD applications
   */
  async listArgoApplications(
    project?: string
  ): Promise<ArgoApplicationsResponse> {
    const params = project ? `?project=${encodeURIComponent(project)}` : "";
    return this.request<ArgoApplicationsResponse>(
      `/api/v1/integrations/argocd/applications${params}`
    );
  }

  // -------------------------------------------------------------------------
  // Prometheus
  // -------------------------------------------------------------------------

  /**
   * Get cluster metrics from Prometheus
   */
  async getClusterMetrics(cluster?: string): Promise<ClusterMetricsResponse> {
    const params = cluster ? `?cluster=${encodeURIComponent(cluster)}` : "";
    return this.request<ClusterMetricsResponse>(
      `/api/v1/integrations/prometheus/cluster${params}`
    );
  }

  /**
   * Query Prometheus
   */
  async queryPrometheus(
    query: string,
    hours?: number
  ): Promise<PrometheusQueryResponse> {
    const params = new URLSearchParams();
    params.set("query", query);
    if (hours) params.set("hours", hours.toString());
    return this.request<PrometheusQueryResponse>(
      `/api/v1/integrations/prometheus/query_range?${params.toString()}`
    );
  }

  // -------------------------------------------------------------------------
  // Cloud Providers
  // -------------------------------------------------------------------------

  /**
   * Get cloud resources summary across all providers
   */
  async getCloudSummary(): Promise<CloudSummaryResponse> {
    return this.request<CloudSummaryResponse>("/api/v1/cloud/summary");
  }

  /**
   * List resources for a cloud provider
   */
  async listCloudResources(
    provider: "aws" | "gcp" | "azure",
    options?: { resourceType?: string; region?: string }
  ): Promise<CloudResourcesResponse> {
    const params = new URLSearchParams();
    if (options?.resourceType)
      params.set("resource_type", options.resourceType);
    if (options?.region) params.set("region", options.region);
    const queryString = params.toString();
    return this.request<CloudResourcesResponse>(
      `/api/v1/cloud/${provider}/resources${
        queryString ? `?${queryString}` : ""
      }`
    );
  }

  /**
   * Get cloud provider status
   */
  async getCloudProviderStatus(provider: "aws" | "gcp" | "azure"): Promise<{
    provider: string;
    configured: boolean;
    message: string;
  }> {
    return this.request(`/api/v1/cloud/${provider}/status`);
  }

  // -------------------------------------------------------------------------
  // Settings & Credentials
  // -------------------------------------------------------------------------

  /**
   * Get integration status
   */
  async getIntegrationStatus(): Promise<{
    integrations: Record<string, boolean>;
    details: Array<{
      name: string;
      configured: boolean;
      message: string;
    }>;
    total_configured: number;
    total_integrations: number;
  }> {
    return this.request("/api/v1/settings/status");
  }

  /**
   * Get credentials status (without exposing values)
   */
  async getCredentialsStatus(): Promise<{
    cloud: {
      aws?: { configured: boolean; region?: string };
      gcp?: { configured: boolean; project_id?: string };
      azure?: { configured: boolean };
    };
    integrations: {
      github?: { configured: boolean };
      argocd?: { configured: boolean; url?: string };
      prometheus?: { configured: boolean; url?: string };
      datadog?: { configured: boolean };
      terraform_cloud?: { configured: boolean; org?: string };
    };
  }> {
    return this.request("/api/v1/settings/credentials");
  }

  /**
   * Save credentials
   */
  async saveCredentials(credentials: {
    cloud?: {
      aws_access_key_id?: string;
      aws_secret_access_key?: string;
      aws_region?: string;
      gcp_project_id?: string;
      gcp_credentials_path?: string;
      azure_subscription_id?: string;
      azure_client_id?: string;
      azure_client_secret?: string;
      azure_tenant_id?: string;
    };
    integrations?: {
      github_token?: string;
      github_org?: string;
      argocd_url?: string;
      argocd_token?: string;
      prometheus_url?: string;
      datadog_api_key?: string;
      datadog_app_key?: string;
      datadog_site?: string;
      tfc_token?: string;
      tfc_org?: string;
    };
  }): Promise<{
    success: boolean;
    message: string;
    saved: Record<string, any>;
    note?: string;
  }> {
    return this.request("/api/v1/settings/credentials", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  }

  // -------------------------------------------------------------------------
  // WebSocket
  // -------------------------------------------------------------------------

  /**
   * Get WebSocket URL for pod logs
   */
  getLogStreamUrl(namespace: string, pod: string, container?: string): string {
    const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const baseUrl = this.baseUrl.replace(/^https?:/, wsProtocol);
    let url = `${baseUrl}/api/v1/ws/logs/${namespace}/${pod}`;
    if (container) url += `?container=${encodeURIComponent(container)}`;
    return url;
  }

  /**
   * Get WebSocket URL for metrics stream
   */
  getMetricsStreamUrl(): string {
    const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const baseUrl = this.baseUrl.replace(/^https?:/, wsProtocol);
    return `${baseUrl}/api/v1/ws/metrics`;
  }

  /**
   * Get WebSocket URL for events stream
   */
  getEventsStreamUrl(namespace?: string): string {
    const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const baseUrl = this.baseUrl.replace(/^https?:/, wsProtocol);
    let url = `${baseUrl}/api/v1/ws/events`;
    if (namespace) url += `?namespace=${encodeURIComponent(namespace)}`;
    return url;
  }
}

// -------------------------------------------------------------------------
// Additional Types
// -------------------------------------------------------------------------

export interface DeploymentInfo {
  name: string;
  namespace: string;
  replicas: number;
  available_replicas: number;
  ready_replicas: number;
  updated_replicas: number;
  image: string;
  strategy: string;
}

export interface ScaleResponse {
  success: boolean;
  namespace: string;
  deployment: string;
  previous_replicas: number;
  current_replicas: number;
  message?: string;
}

export interface RestartResponse {
  success: boolean;
  namespace: string;
  deployment: string;
  message?: string;
}

export interface WorkflowRun {
  id: number;
  name: string;
  head_branch: string;
  head_sha: string;
  status: "queued" | "in_progress" | "completed";
  conclusion?: "success" | "failure" | "cancelled" | "skipped";
  html_url: string;
  created_at: string;
  updated_at: string;
  actor: string;
  event: string;
  run_number: number;
}

export interface WorkflowRunsResponse {
  runs: WorkflowRun[];
  total_count: number;
  repository: string;
}

export interface ArgoApplication {
  name: string;
  namespace: string;
  project: string;
  repo_url: string;
  path: string;
  target_revision: string;
  sync_status: "Synced" | "OutOfSync" | "Unknown";
  health_status:
    | "Healthy"
    | "Progressing"
    | "Degraded"
    | "Suspended"
    | "Missing"
    | "Unknown";
  sync_started_at?: string;
  sync_finished_at?: string;
  message?: string;
  resources_synced: number;
  resources_total: number;
}

export interface ArgoApplicationsResponse {
  applications: ArgoApplication[];
  server: string;
}

export interface ClusterMetricsResponse {
  cluster_name: string;
  timestamp: string;
  cpu_usage_percent: number;
  cpu_requests_percent: number;
  cpu_limits_percent: number;
  memory_usage_percent: number;
  memory_requests_percent: number;
  memory_limits_percent: number;
  pods_running: number;
  pods_pending: number;
  pods_failed: number;
  network_receive_bytes?: number;
  network_transmit_bytes?: number;
}

export interface PrometheusQueryResponse {
  query: string;
  result_type: string;
  series: Array<{
    metric_name: string;
    labels: Record<string, string>;
    data_points: Array<{
      timestamp: string;
      value: number;
    }>;
  }>;
}

// -------------------------------------------------------------------------
// Cloud Provider Types
// -------------------------------------------------------------------------

export type CloudProvider = "aws" | "gcp" | "azure";
export type ResourceStatus =
  | "running"
  | "stopped"
  | "terminated"
  | "pending"
  | "unknown"
  | "healthy"
  | "unhealthy";

export type ResourceType =
  | "ec2_instance"
  | "gcp_vm"
  | "azure_vm"
  | "lambda"
  | "cloud_function"
  | "azure_function"
  | "s3_bucket"
  | "gcs_bucket"
  | "azure_blob"
  | "rds_instance"
  | "cloud_sql"
  | "azure_sql"
  | "vpc"
  | "gcp_vpc"
  | "azure_vnet"
  | "load_balancer"
  | "ecs_cluster"
  | "eks_cluster"
  | "gke_cluster"
  | "aks_cluster";

export interface CloudResource {
  resource_id: string;
  name: string;
  provider: CloudProvider;
  resource_type: ResourceType;
  status: ResourceStatus;
  region: string;
  created_at?: string;
  tags: Record<string, string>;
  metadata: Record<string, any>;
  cost_estimate?: number;
}

export interface CloudResourcesResponse {
  provider: CloudProvider;
  resources: CloudResource[];
  total_count: number;
  regions: string[];
}

export interface CloudSummaryResponse {
  providers: Record<string, Record<string, number>>;
  total_resources: number;
  total_estimated_cost?: number;
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export class for testing or custom instances
export { ApiClient };
