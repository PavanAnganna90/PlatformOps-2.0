import { InfrastructureNode, ResourceType, Status, LogEntry, PipelineRun, Vulnerability, TerraformWorkspace } from './types';

export const MOCK_NODES: InfrastructureNode[] = [
  {
    id: 'cluster-1',
    name: 'prod-k8s-cluster',
    type: ResourceType.K8S_CLUSTER,
    status: Status.HEALTHY,
    metrics: { cpu: 45, memory: 60, network: 120, latency: 12 },
    region: 'us-east-1',
    description: 'Main production cluster (EKS)',
    uptime: '14d 2h',
    tags: ['production', 'aws', 'k8s']
  },
  {
    id: 'node-1',
    name: 'worker-pool-a',
    type: ResourceType.NODE,
    status: Status.HEALTHY,
    metrics: { cpu: 30, memory: 40, network: 50, latency: 5 },
    uptime: '14d 2h',
    tags: ['worker', 'spot-instance']
  },
  {
    id: 'pod-1',
    name: 'api-gateway-v2',
    type: ResourceType.POD,
    status: Status.HEALTHY,
    metrics: { cpu: 12, memory: 25, network: 30, latency: 45 },
    description: 'Ingress controller for main API',
    tags: ['ingress', 'nginx']
  },
  {
    id: 'pod-2',
    name: 'payment-processor',
    type: ResourceType.POD,
    status: Status.WARNING,
    metrics: { cpu: 85, memory: 70, network: 10, latency: 350 },
    description: 'High latency detected in transactions',
    tags: ['backend', 'go', 'critical']
  },
  {
    id: 'db-1',
    name: 'postgres-primary',
    type: ResourceType.DATABASE,
    status: Status.HEALTHY,
    metrics: { cpu: 20, memory: 55, network: 45, latency: 2 },
    description: 'Supabase managed instance',
    tags: ['db', 'postgres', 'stateful']
  },
  {
    id: 'tf-1',
    name: 'aws-vpc-module',
    type: ResourceType.TERRAFORM,
    status: Status.ERROR,
    metrics: { cpu: 0, memory: 0, network: 0 },
    description: 'State lock detected. Plan failed.',
    tags: ['iac', 'terraform', 'networking']
  }
];

export const MOCK_LOGS: LogEntry[] = [
  { id: '1', timestamp: new Date().toISOString(), level: 'info', source: 'k8s-controller', message: 'Scaling up worker pool to 3 nodes', traceId: 'tr-123' },
  { id: '2', timestamp: new Date(Date.now() - 5000).toISOString(), level: 'warn', source: 'postgres-primary', message: 'Slow query detected: SELECT * FROM large_table (450ms)', traceId: 'tr-124' },
  { id: '3', timestamp: new Date(Date.now() - 10000).toISOString(), level: 'error', source: 'tf-runner', message: 'Error acquiring state lock: ConditionalCheckFailedException', traceId: 'tr-125' },
  { id: '4', timestamp: new Date(Date.now() - 15000).toISOString(), level: 'info', source: 'api-gateway', message: 'Health check passed: /healthz', traceId: 'tr-126' },
  { id: '5', timestamp: new Date(Date.now() - 20000).toISOString(), level: 'debug', source: 'payment-processor', message: 'Processing queue item #49221', traceId: 'tr-127' },
  { id: '6', timestamp: new Date(Date.now() - 25000).toISOString(), level: 'fatal', source: 'auth-service', message: 'OOM Killed', traceId: 'tr-128' },
];

export const MOCK_PIPELINES: PipelineRun[] = [
  {
    id: 'pipe-1',
    name: 'api-gateway-deploy',
    status: Status.SUCCESS,
    startTime: new Date(Date.now() - 3600000).toISOString(),
    duration: '4m 12s',
    commitHash: 'a1b2c3d',
    branch: 'main',
    stages: [
      { name: 'Build', status: Status.SUCCESS, duration: '2m' },
      { name: 'Test', status: Status.SUCCESS, duration: '1m' },
      { name: 'Security Scan', status: Status.SUCCESS, duration: '30s' },
      { name: 'Deploy (Staging)', status: Status.SUCCESS, duration: '42s' },
    ]
  },
  {
    id: 'pipe-2',
    name: 'frontend-rollback',
    status: Status.FAILED,
    startTime: new Date(Date.now() - 7200000).toISOString(),
    duration: '1m 05s',
    commitHash: 'e5f6g7h',
    branch: 'release/v1.2',
    stages: [
      { name: 'Build', status: Status.SUCCESS, duration: '45s' },
      { name: 'Test', status: Status.FAILED, duration: '20s' },
    ]
  },
  {
    id: 'pipe-3',
    name: 'infra-apply',
    status: Status.RUNNING,
    startTime: new Date().toISOString(),
    duration: 'Running...',
    commitHash: 'i9j0k1l',
    branch: 'feat/new-vpc',
    stages: [
      { name: 'Plan', status: Status.SUCCESS, duration: '30s' },
      { name: 'Cost Est.', status: Status.RUNNING, duration: '...' },
    ]
  }
];

export const MOCK_VULNERABILITIES: Vulnerability[] = [
  {
    id: 'vuln-1',
    package: 'log4j',
    severity: 'critical',
    cve: 'CVE-2021-44228',
    description: 'Remote code execution vulnerability in Log4j core.',
    detectedAt: new Date(Date.now() - 86400000).toISOString(),
    fixVersion: '2.17.0'
  },
  {
    id: 'vuln-2',
    package: 'openssl',
    severity: 'high',
    cve: 'CVE-2022-0778',
    description: 'Infinite loop in BN_mod_sqrt() reachable when parsing certificates.',
    detectedAt: new Date(Date.now() - 172800000).toISOString(),
    fixVersion: '1.1.1n'
  },
  {
    id: 'vuln-3',
    package: 'lodash',
    severity: 'medium',
    cve: 'CVE-2020-8203',
    description: 'Prototype pollution vulnerability.',
    detectedAt: new Date(Date.now() - 259200000).toISOString(),
    fixVersion: '4.17.20'
  }
];

export const MOCK_TF_WORKSPACES: TerraformWorkspace[] = [
  { id: 'ws-1', name: 'production-vpc', lastRun: '2 days ago', status: Status.HEALTHY, resources: 42, drift: false, provider: 'aws', isLocked: false },
  { id: 'ws-2', name: 'staging-k8s', lastRun: '1 hour ago', status: Status.WARNING, resources: 18, drift: true, provider: 'aws', isLocked: false },
  { id: 'ws-3', name: 'data-pipeline-gcp', lastRun: '5 mins ago', status: Status.FAILED, resources: 12, drift: false, provider: 'gcp', isLocked: true, lockedBy: 'pipeline-runner-01', lockTime: new Date().toISOString() }
];

export const MOCK_TF_PLAN_OUTPUT = `
Terraform used the selected providers to generate the following execution plan.
Resource actions are indicated with the following symbols:
  + create
  ~ update in-place
  - destroy

Terraform will perform the following actions:

  # aws_instance.web_server will be created
  + resource "aws_instance" "web_server" {
      + ami                          = "ami-0c55b159cbfafe1f0"
      + arn                          = (known after apply)
      + associate_public_ip_address  = true
      + availability_zone            = (known after apply)
      + id                           = (known after apply)
      + instance_type                = "t3.micro"
      + tags                         = {
          + "Environment" = "Staging"
          + "Name"        = "WebServer-01"
        }
    }

  # aws_security_group.allow_tls will be updated in-place
  ~ resource "aws_security_group" "allow_tls" {
      ~ description = "Allow TLS inbound traffic" -> "Allow TLS and HTTP traffic"
        id          = "sg-12345678"
        name        = "allow_tls"
        
      + ingress {
          + cidr_blocks      = [
              + "0.0.0.0/0",
            ]
          + description      = "HTTP from VPC"
          + from_port        = 80
          + protocol         = "tcp"
          + to_port          = 80
        }
    }

  # aws_s3_bucket.legacy_logs will be destroyed
  - resource "aws_s3_bucket" "legacy_logs" {
      - bucket = "my-legacy-logs-bucket"
      - id     = "my-legacy-logs-bucket"
      - region = "us-east-1"
    }

Plan: 1 to add, 1 to change, 1 to destroy.
`;

export const GEMINI_SYSTEM_PROMPT = `
You are OpsSight AI, a senior Site Reliability Engineer (SRE) and DevOps expert assistant.
Your goal is to help users manage their home labs and infrastructure.
You have expertise in Kubernetes, Terraform, Docker, Prometheus, AWS, and Database management.

When users ask questions:
1. Be concise but technical.
2. Explain "why" something is happening, not just "what".
3. If they paste logs, analyze the root cause.
4. Suggest actionable CLI commands (e.g., kubectl, terraform) when appropriate.
5. Format your response with clear Markdown.
6. Use the provided context about the current system status to answer questions accurately.
`;