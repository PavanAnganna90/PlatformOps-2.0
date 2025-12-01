import React, { useEffect, useState } from 'react';
import { Card } from '../ui/Card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { storage } from '../../services/storage';
import { simulation } from '../../services/simulation';
import { Status, ChaosType } from '../../types';
import { ArrowUpRight, ArrowDownRight, Activity, Terminal, Zap, Bug, Skull, WifiOff, Play, Pause } from 'lucide-react';
import { clsx } from 'clsx';

export const DashboardView: React.FC = () => {
  // State for real-time updates
  const [_, setTick] = useState(0);
  const [isSimRunning, setIsSimRunning] = useState(false);
  
  const nodes = storage.getNodes();
  const logs = storage.getLogs().slice(0, 50); // Get last 50 logs
  const dora = storage.getDoraMetrics();

  const healthyNodes = nodes.filter(n => n.status === Status.HEALTHY).length;
  const warningNodes = nodes.filter(n => n.status === Status.WARNING).length;
  const errorNodes = nodes.filter(n => n.status === Status.ERROR || n.status === Status.FAILED).length;
  const activeIncidents = warningNodes + errorNodes;

  useEffect(() => {
    // UI update loop
    const interval = setInterval(() => {
      setTick(t => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleChaos = (type: ChaosType) => {
    simulation.injectChaos(type);
    // Force immediate re-render
    setTick(t => t + 1);
  };

  const toggleSimulation = () => {
    const running = simulation.toggle();
    setIsSimRunning(running);
  };

  // Generate chart data from live logs/metrics (simplified for MVP)
  const chartData = Array.from({ length: 10 }).map((_, i) => ({
    name: new Date(Date.now() - (10 - i) * 60000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
    cpu: Math.floor(Math.random() * 30) + 40 + (activeIncidents * 10), // Correlate chart with incidents
    mem: Math.floor(Math.random() * 20) + 50
  }));

  return (
    <div className="space-y-6">
      
      {/* Simulation Control Panel */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-900/50 p-4 rounded-xl border border-slate-800">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            <Zap size={20} />
          </div>
          <div>
            <h3 className="text-white font-medium">Home Lab Simulation</h3>
            <p className="text-xs text-slate-400">Inject faults to test your observability stack</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={toggleSimulation}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
              isSimRunning 
                ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700' 
                : 'bg-primary text-white border-primary hover:bg-primary/90'
            }`}
          >
            {isSimRunning ? <Pause size={14} /> : <Play size={14} />}
            {isSimRunning ? 'Pause Engine' : 'Start Simulation'}
          </button>
          
          <div className="h-8 w-px bg-slate-700 mx-2"></div>
          
          <p className="text-xs text-slate-500 mr-2 uppercase font-bold tracking-wider">Chaos:</p>
          
          <button onClick={() => handleChaos('cpu_spike')} className="p-2 hover:bg-warning/20 text-slate-400 hover:text-warning rounded transition-colors" title="Trigger CPU Spike">
            <Activity size={18} />
          </button>
          <button onClick={() => handleChaos('memory_leak')} className="p-2 hover:bg-accent/20 text-slate-400 hover:text-accent rounded transition-colors" title="Trigger Memory Leak">
            <Bug size={18} />
          </button>
          <button onClick={() => handleChaos('network_partition')} className="p-2 hover:bg-slate-100/20 text-slate-400 hover:text-white rounded transition-colors" title="Trigger Network Partition">
            <WifiOff size={18} />
          </button>
          <button onClick={() => handleChaos('pod_crash')} className="p-2 hover:bg-error/20 text-slate-400 hover:text-error rounded transition-colors" title="Kill Pod">
            <Skull size={18} />
          </button>
        </div>
      </div>

      {activeIncidents > 0 && (
        <div className="bg-error/10 border border-error/20 rounded-lg p-3 flex items-center gap-3 animate-pulse">
          <Activity className="text-error w-5 h-5" />
          <span className="text-error font-medium">{activeIncidents} active incidents require attention</span>
        </div>
      )}

      {/* DORA Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <DoraCard 
          title="Deployment Frequency" 
          value={dora.deploymentFrequency} 
          trend={dora.trends.deploymentFrequency} 
          target="10/day"
          inverse={false}
        />
        <DoraCard 
          title="Lead Time for Changes" 
          value={dora.leadTime} 
          trend={dora.trends.leadTime} 
          target="< 4 hrs" 
          inverse={true}
        />
        <DoraCard 
          title="Time to Recovery" 
          value={dora.meanTimeToRecovery} 
          trend={dora.trends.meanTimeToRecovery} 
          target="< 1 hr" 
          inverse={true}
        />
        <DoraCard 
          title="Change Failure Rate" 
          value={dora.changeFailureRate} 
          trend={dora.trends.changeFailureRate} 
          target="< 5%" 
          inverse={true}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <Card className="lg:col-span-2 h-[400px] flex flex-col">
          <div className="mb-4 flex justify-between items-center">
            <h3 className="font-semibold text-white">Cluster Performance (Live)</h3>
            <div className="flex gap-2">
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <div className="w-2 h-2 rounded-full bg-primary"></div> CPU
              </span>
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <div className="w-2 h-2 rounded-full bg-accent"></div> Mem
              </span>
            </div>
          </div>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorMem" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px' }}
                  itemStyle={{ color: '#e2e8f0' }}
                />
                <Area type="monotone" dataKey="cpu" stroke="#3b82f6" fillOpacity={1} fill="url(#colorCpu)" strokeWidth={2} isAnimationActive={false} />
                <Area type="monotone" dataKey="mem" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorMem)" strokeWidth={2} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Live Logs Mini */}
        <Card className="flex flex-col h-[400px]">
          <div className="mb-4 flex items-center gap-2">
            <Terminal className="w-4 h-4 text-slate-400" />
            <h3 className="font-semibold text-white">Live Logs</h3>
          </div>
          <div className="flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-thin font-mono">
            {logs.map((log) => (
              <div key={log.id} className="text-[10px] p-2 rounded bg-slate-900/50 border border-slate-800 hover:bg-slate-800 transition-colors">
                <div className="flex justify-between items-center mb-1">
                  <span className={`font-bold uppercase
                    ${log.level === 'error' || log.level === 'fatal' ? 'text-error' : 
                      log.level === 'warn' ? 'text-warning' : 
                      'text-primary'}`
                  }>
                    {log.level}
                  </span>
                  <span className="text-slate-600">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className="text-slate-400 mb-0.5">{log.source}</div>
                <div className="text-slate-300 break-words leading-tight">{log.message}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

const DoraCard: React.FC<{title: string, value: string, trend: number, target: string, inverse: boolean}> = ({
  title, value, trend, target, inverse
}) => {
  // Logic: For inverse metrics (failure rate), positive trend is bad (red)
  // For normal metrics (freq), positive trend is good (green)
  const isGood = inverse ? trend < 0 : trend > 0;
  
  return (
    <Card variant="default" className="relative overflow-hidden group hover:border-slate-500 transition-colors">
       <div className="flex flex-col h-full justify-between">
          <div>
            <p className="text-slate-400 text-sm font-medium">{title}</p>
            <h3 className="text-3xl font-bold text-white mt-2">{value}</h3>
          </div>
          <div className="flex items-center justify-between mt-4">
             <div className={clsx("text-xs flex items-center font-medium", isGood ? "text-emerald-400" : "text-error")}>
               {trend > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
               {Math.abs(trend)}% from last week
             </div>
             <div className="text-[10px] text-slate-500 border border-slate-700 rounded-full px-2 py-0.5 bg-slate-800">
               Target: {target}
             </div>
          </div>
       </div>
    </Card>
  )
}