export enum Status {
  HEALTHY = 'healthy',
  WARNING = 'warning',
  ERROR = 'error',
  PENDING = 'pending',
  STOPPED = 'stopped',
  RUNNING = 'running',
  SUCCESS = 'success',
  FAILED = 'failed',
  PLANNED = 'planned'
}

export enum ResourceType {
  K8S_CLUSTER = 'k8s_cluster',
  NODE = 'node',
  POD = 'pod',
  DATABASE = 'database',
  TERRAFORM = 'terraform_state',
  SERVICE = 'service',
  PIPELINE = 'pipeline',
  VULNERABILITY = 'vulnerability'
}

export interface MetricPoint {
  timestamp: string;
  value: number;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug' | 'fatal';
  source: string;
  message: string;
  traceId?: string;
  spanId?: string;
}

export interface InfrastructureNode {
  id: string;
  name: string;
  type: ResourceType;
  status: Status;
  metrics: {
    cpu: number; // percentage
    memory: number; // percentage
    network: number; // mbps
    latency?: number; // ms
  };
  region?: string;
  uptime?: string;
  children?: string[]; // IDs of children
  description?: string;
  tags?: string[];
}

export interface PipelineRun {
  id: string;
  name: string;
  status: Status;
  startTime: string;
  duration: string;
  stages: {
    name: string;
    status: Status;
    duration: string;
  }[];
  commitHash: string;
  branch: string;
}

export interface Vulnerability {
  id: string;
  package: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  cve: string;
  fixVersion?: string;
  detectedAt: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  role: 'admin' | 'viewer' | 'platform_engineer';
  preferences: {
    theme: 'dark' | 'light';
    refreshRate: number;
  };
}

export interface AiChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  isThinking?: boolean;
}

export interface DoraMetrics {
  deploymentFrequency: string; // e.g., "12/day"
  leadTime: string; // e.g., "2.4 hrs"
  meanTimeToRecovery: string; // e.g., "45 min"
  changeFailureRate: string; // e.g., "2.3%"
  trends: {
    deploymentFrequency: number;
    leadTime: number;
    meanTimeToRecovery: number;
    changeFailureRate: number;
  }
}

export interface TerraformWorkspace {
  id: string;
  name: string;
  lastRun: string;
  status: Status;
  resources: number;
  drift: boolean;
  provider: 'aws' | 'gcp' | 'azure';
  latestPlanOutput?: string;
  isLocked: boolean;
  lockedBy?: string;
  lockTime?: string;
}

export type ChaosType = 'cpu_spike' | 'memory_leak' | 'network_partition' | 'pod_crash';

export interface SimulationState {
  isActive: boolean;
  activeIncidents: number;
  lastUpdate: number;
}