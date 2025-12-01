import { InfrastructureNode, LogEntry, PipelineRun, Vulnerability, DoraMetrics, TerraformWorkspace } from '../types';
import { MOCK_NODES, MOCK_LOGS, MOCK_PIPELINES, MOCK_VULNERABILITIES, MOCK_TF_WORKSPACES } from '../constants';

// This Service simulates a Backend (Supabase/Firebase abstraction layer).
// It implements the "Repository Pattern" to decouple UI from data source.

const STORAGE_KEYS = {
  NODES: 'opssight_nodes',
  LOGS: 'opssight_logs',
  PIPELINES: 'opssight_pipelines',
  VULNS: 'opssight_vulns',
  METRICS_DORA: 'opssight_dora',
  TF_WORKSPACES: 'opssight_tf_workspaces',
  INIT: 'opssight_initialized_v2'
};

class StorageService {
  constructor() {
    this.initialize();
  }

  private initialize() {
    // Reset or init mock data
    if (typeof window !== 'undefined' && !localStorage.getItem(STORAGE_KEYS.INIT)) {
      this.saveNodes(MOCK_NODES);
      this.saveLogs(MOCK_LOGS);
      localStorage.setItem(STORAGE_KEYS.PIPELINES, JSON.stringify(MOCK_PIPELINES));
      localStorage.setItem(STORAGE_KEYS.VULNS, JSON.stringify(MOCK_VULNERABILITIES));
      localStorage.setItem(STORAGE_KEYS.TF_WORKSPACES, JSON.stringify(MOCK_TF_WORKSPACES));
      
      const defaultDora: DoraMetrics = {
        deploymentFrequency: '12/day',
        leadTime: '2.4 hrs',
        meanTimeToRecovery: '45 min',
        changeFailureRate: '2.3%',
        trends: {
          deploymentFrequency: 20,
          leadTime: -15,
          meanTimeToRecovery: -30,
          changeFailureRate: -0.5
        }
      };
      localStorage.setItem(STORAGE_KEYS.METRICS_DORA, JSON.stringify(defaultDora));
      localStorage.setItem(STORAGE_KEYS.INIT, 'true');
    }
  }

  // --- Nodes ---
  getNodes(): InfrastructureNode[] {
    const data = localStorage.getItem(STORAGE_KEYS.NODES);
    return data ? JSON.parse(data) : MOCK_NODES;
  }

  saveNodes(nodes: InfrastructureNode[]) {
    localStorage.setItem(STORAGE_KEYS.NODES, JSON.stringify(nodes));
  }

  updateNode(nodeId: string, updates: Partial<InfrastructureNode>) {
    const nodes = this.getNodes();
    const index = nodes.findIndex(n => n.id === nodeId);
    if (index !== -1) {
      nodes[index] = { ...nodes[index], ...updates };
      this.saveNodes(nodes);
    }
  }

  // --- Logs ---
  getLogs(): LogEntry[] {
    const data = localStorage.getItem(STORAGE_KEYS.LOGS);
    return data ? JSON.parse(data) : MOCK_LOGS;
  }

  saveLogs(logs: LogEntry[]) {
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
  }

  addLog(log: LogEntry) {
    const logs = this.getLogs();
    logs.unshift(log);
    // Keep ring buffer of last 200 logs to prevent storage quota issues
    if (logs.length > 200) logs.pop(); 
    this.saveLogs(logs);
  }

  // --- Pipelines ---
  getPipelines(): PipelineRun[] {
    const data = localStorage.getItem(STORAGE_KEYS.PIPELINES);
    return data ? JSON.parse(data) : MOCK_PIPELINES;
  }

  // --- Vulns ---
  getVulnerabilities(): Vulnerability[] {
    const data = localStorage.getItem(STORAGE_KEYS.VULNS);
    return data ? JSON.parse(data) : MOCK_VULNERABILITIES;
  }

  // --- Terraform ---
  getTerraformWorkspaces(): TerraformWorkspace[] {
    const data = localStorage.getItem(STORAGE_KEYS.TF_WORKSPACES);
    return data ? JSON.parse(data) : MOCK_TF_WORKSPACES;
  }

  updateTerraformWorkspace(id: string, updates: Partial<TerraformWorkspace>) {
    const workspaces = this.getTerraformWorkspaces();
    const index = workspaces.findIndex(w => w.id === id);
    if (index !== -1) {
      workspaces[index] = { ...workspaces[index], ...updates };
      localStorage.setItem(STORAGE_KEYS.TF_WORKSPACES, JSON.stringify(workspaces));
    }
  }

  acquireTerraformLock(id: string, user: string): boolean {
    const workspaces = this.getTerraformWorkspaces();
    const index = workspaces.findIndex(w => w.id === id);
    if (index === -1) return false;

    const ws = workspaces[index];
    if (ws.isLocked) return false; // Already locked

    workspaces[index] = { 
      ...ws, 
      isLocked: true, 
      lockedBy: user, 
      lockTime: new Date().toISOString() 
    };
    localStorage.setItem(STORAGE_KEYS.TF_WORKSPACES, JSON.stringify(workspaces));
    return true;
  }

  releaseTerraformLock(id: string) {
    const workspaces = this.getTerraformWorkspaces();
    const index = workspaces.findIndex(w => w.id === id);
    if (index === -1) return;

    workspaces[index] = { 
      ...workspaces[index], 
      isLocked: false, 
      lockedBy: undefined, 
      lockTime: undefined 
    };
    localStorage.setItem(STORAGE_KEYS.TF_WORKSPACES, JSON.stringify(workspaces));
  }

  // --- DORA ---
  getDoraMetrics(): DoraMetrics {
    const data = localStorage.getItem(STORAGE_KEYS.METRICS_DORA);
    return data ? JSON.parse(data) : {
        deploymentFrequency: '0/day',
        leadTime: '0 hrs',
        meanTimeToRecovery: '0 min',
        changeFailureRate: '0%',
        trends: { deploymentFrequency: 0, leadTime: 0, meanTimeToRecovery: 0, changeFailureRate: 0 }
    };
  }
}

export const storage = new StorageService();