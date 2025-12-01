import { storage } from './storage';
import { ResourceType, Status, ChaosType, InfrastructureNode } from '../types';

// The Simulation Engine acts as the "World State" generator.
// It mimics a real cloud environment by fluctuating metrics and generating telemetry.

class SimulationService {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log("OpsSight Simulation Engine: Started");
    
    this.intervalId = setInterval(() => {
      this.tick();
    }, 2000); // Tick every 2 seconds
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log("OpsSight Simulation Engine: Stopped");
  }

  toggle() {
    if (this.isRunning) this.stop();
    else this.start();
    return this.isRunning;
  }

  injectChaos(type: ChaosType) {
    const nodes = storage.getNodes();
    // Pick a random compatible node
    const target = nodes[Math.floor(Math.random() * nodes.length)];
    
    if (!target) return;

    let logMessage = '';
    
    switch (type) {
      case 'cpu_spike':
        storage.updateNode(target.id, { 
          status: Status.WARNING,
          metrics: { ...target.metrics, cpu: 99 }
        });
        logMessage = `Alert: CPU utilization critical on ${target.name} (99%)`;
        break;
      case 'memory_leak':
        storage.updateNode(target.id, { 
          status: Status.WARNING,
          metrics: { ...target.metrics, memory: 98 }
        });
        logMessage = `Alert: Memory exhausted on ${target.name}. Possible leak detected.`;
        break;
      case 'pod_crash':
        storage.updateNode(target.id, { 
          status: Status.ERROR 
        });
        logMessage = `Critical: Process terminated unexpectedly on ${target.name}. CrashLoopBackOff.`;
        break;
      case 'network_partition':
        storage.updateNode(target.id, { 
          status: Status.WARNING,
          metrics: { ...target.metrics, latency: 2500, network: 0 }
        });
        logMessage = `Network: Connection timeout communicating with ${target.name}.`;
        break;
    }

    storage.addLog({
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      level: type === 'pod_crash' ? 'fatal' : 'warn',
      source: target.name,
      message: logMessage,
      traceId: `trace-${Date.now().toString().slice(-6)}`
    });
  }

  private tick() {
    const nodes = storage.getNodes();
    
    nodes.forEach(node => {
      // 1. Random walk for metrics to simulate "live" data
      const newCpu = this.fluctuate(node.metrics.cpu, 0, 100);
      const newMem = this.fluctuate(node.metrics.memory, 0, 100);
      const newNet = this.fluctuate(node.metrics.network, 0, 1000);
      
      let newStatus = node.status;
      
      // Auto-recover from chaos after some time if not in ERROR
      if (node.status === Status.WARNING && Math.random() > 0.8) {
        newStatus = Status.HEALTHY;
      }

      // Threshold based status
      if (newCpu > 90 || newMem > 90) newStatus = Status.WARNING;
      if (newCpu > 98) newStatus = Status.ERROR;

      storage.updateNode(node.id, {
        status: newStatus,
        metrics: {
          cpu: newCpu,
          memory: newMem,
          network: newNet,
          latency: node.metrics.latency ? this.fluctuate(node.metrics.latency, 5, 500) : undefined
        }
      });

      // 2. Random background log generation
      if (Math.random() > 0.9) {
        this.generateRandomLog(node);
      }
    });
  }

  private fluctuate(current: number, min: number, max: number): number {
    const change = (Math.random() - 0.5) * 10; // Move +/- 5
    let val = current + change;
    if (val < min) val = min;
    if (val > max) val = max;
    return Number(val.toFixed(1));
  }

  private generateRandomLog(node: InfrastructureNode) {
    const messages = [
      "Health check passed",
      "Garbage collection ran (24ms)",
      "Received keep-alive",
      "Syncing state...",
      "Request processed 200 OK"
    ];
    
    storage.addLog({
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      level: 'info',
      source: node.name,
      message: messages[Math.floor(Math.random() * messages.length)],
      traceId: `trace-${Date.now().toString().slice(-6)}`
    });
  }
}

export const simulation = new SimulationService();