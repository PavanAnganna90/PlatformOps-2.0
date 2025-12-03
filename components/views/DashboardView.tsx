import React, { useEffect, useState } from 'react';
import { Card } from '../ui/Card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { storage } from '../../services/storage';
import { simulation } from '../../services/simulation';
import { Status, ChaosType } from '../../types';
import { ArrowUpRight, Activity, Terminal, Skull, MoreHorizontal, TrendingUp, Server, Box, Wifi, WifiOff } from 'lucide-react';
import { useClusters, useNodes, usePods } from '../../hooks/useKubernetes';

export const DashboardView: React.FC = () => {
  const [_, setTick] = useState(0);
  const [isSimRunning, setIsSimRunning] = useState(false);
  
  // Real data from backend
  const { data: clusters, isBackendConnected } = useClusters();
  const { data: realNodes } = useNodes();
  const { data: realPods } = usePods();
  
  // Simulated data for demo mode
  const nodes = storage.getNodes();
  const logs = storage.getLogs().slice(0, 50);
  const dora = storage.getDoraMetrics();
  
  // Calculate real cluster stats
  const activeCluster = clusters.find(c => c.status === 'connected');
  const totalNodes = isBackendConnected ? realNodes.length : nodes.length;
  const totalPods = isBackendConnected ? realPods.length : 24;
  const healthyPods = isBackendConnected 
    ? realPods.filter(p => p.phase === 'Running' && p.restart_count < 5).length 
    : 22;
  const warningPods = isBackendConnected 
    ? realPods.filter(p => p.restart_count >= 5 || p.phase === 'Pending').length 
    : 2;

  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleChaos = (type: ChaosType) => {
    simulation.injectChaos(type);
    setTick(t => t + 1);
  };

  const toggleSimulation = () => {
    const running = simulation.toggle();
    setIsSimRunning(running);
  };

  // Generate smooth sparkline data
  const generateSparkData = (base: number, variance: number) => 
    Array.from({ length: 20 }).map((_, i) => ({
      value: base + Math.sin(i / 2) * variance + Math.random() * (variance / 2)
    }));

  const mainChartData = Array.from({ length: 15 }).map((_, i) => ({
    name: `${10 + i}:00`,
    cpu: 40 + Math.random() * 20 + (Math.sin(i / 3) * 15),
    mem: 30 + Math.random() * 15 + (Math.cos(i / 3) * 10),
    net: 20 + Math.random() * 40
  }));

  return (
    <div className="space-y-8">
      
      {/* Simulation & Chaos Header */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Overview</h2>
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mt-1">
             <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
             <span>System Status: <span className="text-emerald-500 dark:text-emerald-400">Operational</span></span>
             <span className="text-slate-400 dark:text-slate-600">•</span>
             <span>Last updated: just now</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3 bg-white dark:bg-[#0F1115] p-1.5 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-lg">
           <button 
             onClick={toggleSimulation}
             className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
               isSimRunning ? 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-300' : 'bg-primary text-white shadow-[0_0_15px_-3px_rgba(99,102,241,0.5)]'
             }`}
           >
             {isSimRunning ? 'Pause Sim' : 'Start Sim'}
           </button>
           <div className="flex gap-1 pr-2">
              <button onClick={() => handleChaos('cpu_spike')} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg text-slate-400 hover:text-primary dark:hover:text-white transition-colors" title="Inject CPU Spike"><Activity size={18} /></button>
              <button onClick={() => handleChaos('pod_crash')} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg text-slate-400 hover:text-primary dark:hover:text-white transition-colors" title="Crash Pod"><Skull size={18} /></button>
           </div>
        </div>
      </div>

      {/* Cluster Summary - Real Data */}
      {isBackendConnected && activeCluster && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-[#0F1115] border border-slate-200 dark:border-white/5 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Server size={18} className="text-primary" />
              </div>
              <span className="text-xs text-slate-500 uppercase tracking-wider">Nodes</span>
            </div>
            <div className="text-3xl font-bold text-slate-900 dark:text-white">{totalNodes}</div>
            <div className="text-xs text-emerald-500 mt-1">All healthy</div>
          </div>
          
          <div className="bg-white dark:bg-[#0F1115] border border-slate-200 dark:border-white/5 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-accent/10 rounded-lg">
                <Box size={18} className="text-accent" />
              </div>
              <span className="text-xs text-slate-500 uppercase tracking-wider">Pods</span>
            </div>
            <div className="text-3xl font-bold text-slate-900 dark:text-white">{totalPods}</div>
            <div className="text-xs text-slate-500 mt-1">{healthyPods} running</div>
          </div>
          
          <div className="bg-white dark:bg-[#0F1115] border border-slate-200 dark:border-white/5 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <Wifi size={18} className="text-emerald-500" />
              </div>
              <span className="text-xs text-slate-500 uppercase tracking-wider">Cluster</span>
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-white truncate">{activeCluster.name}</div>
            <div className="text-xs text-emerald-500 mt-1">v{activeCluster.version}</div>
          </div>
          
          <div className="bg-white dark:bg-[#0F1115] border border-slate-200 dark:border-white/5 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-2 rounded-lg ${warningPods > 0 ? 'bg-amber-500/10' : 'bg-emerald-500/10'}`}>
                <Activity size={18} className={warningPods > 0 ? 'text-amber-500' : 'text-emerald-500'} />
              </div>
              <span className="text-xs text-slate-500 uppercase tracking-wider">Issues</span>
            </div>
            <div className={`text-3xl font-bold ${warningPods > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
              {warningPods}
            </div>
            <div className="text-xs text-slate-500 mt-1">pods need attention</div>
          </div>
        </div>
      )}

      {/* Top Assets (DORA Metrics as Crypto Cards) */}
      <div>
        <div className="flex justify-between items-center mb-4 px-1">
          <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">Key Performance Indicators</h3>
          <div className="flex gap-2">
             <span className="text-xs px-3 py-1 rounded-full bg-slate-200/50 dark:bg-white/5 border border-slate-200 dark:border-white/5 text-slate-500 dark:text-slate-400">24H</span>
             <span className="text-xs px-3 py-1 rounded-full bg-primary/20 border border-primary/20 text-primary">Live</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <DoraCryptoCard 
            title="Deploy Frequency" 
            symbol="DPY"
            value={dora.deploymentFrequency} 
            trend={dora.trends.deploymentFrequency} 
            color="#3b82f6"
            sparkData={generateSparkData(50, 20)}
          />
          <DoraCryptoCard 
            title="Lead Time" 
            symbol="LTM"
            value={dora.leadTime} 
            trend={dora.trends.leadTime} 
            inverse 
            color="#8b5cf6"
            sparkData={generateSparkData(30, 10)}
          />
          <DoraCryptoCard 
            title="Recovery Time" 
            symbol="MTTR"
            value={dora.meanTimeToRecovery} 
            trend={dora.trends.meanTimeToRecovery} 
            inverse 
            color="#10b981"
            sparkData={generateSparkData(40, 15)}
          />
          <DoraCryptoCard 
            title="Fail Rate" 
            symbol="CFR"
            value={dora.changeFailureRate} 
            trend={dora.trends.changeFailureRate} 
            inverse 
            color="#f59e0b"
            sparkData={generateSparkData(10, 5)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart Section */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="h-[450px] flex flex-col" hoverEffect>
            <div className="flex justify-between items-start mb-8">
              <div>
                 <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Cluster Performance</h3>
                 <p className="text-sm text-slate-500 dark:text-slate-400">Real-time resource utilization across nodes</p>
              </div>
              <div className="flex gap-4">
                 <div className="flex flex-col items-end">
                    <span className="text-xs text-slate-500 uppercase tracking-wider">Avg CPU</span>
                    <span className="text-lg font-mono text-slate-900 dark:text-white">42.5%</span>
                 </div>
                 <div className="flex flex-col items-end">
                    <span className="text-xs text-slate-500 uppercase tracking-wider">Avg Mem</span>
                    <span className="text-lg font-mono text-slate-900 dark:text-white">68.2%</span>
                 </div>
              </div>
            </div>
            
            <div className="flex-1 w-full min-h-0 -ml-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mainChartData}>
                  <defs>
                    <linearGradient id="gradientCpu" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4}/>
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="gradientMem" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                      <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" vertical={false} />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '12px', fontSize: '12px', color: '#fff' }}
                    itemStyle={{ color: '#e2e8f0' }}
                  />
                  <Area type="monotone" dataKey="cpu" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#gradientCpu)" />
                  <Area type="monotone" dataKey="mem" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#gradientMem)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Side Panel: Active Nodes - Real or Simulated */}
        <Card className="flex flex-col h-[450px]">
          <div className="flex justify-between items-center mb-6">
             <div className="flex items-center gap-2">
               <h3 className="font-bold text-slate-900 dark:text-white">Active Nodes</h3>
               {isBackendConnected ? (
                 <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">Live</span>
               ) : (
                 <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">Demo</span>
               )}
             </div>
             <button className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg text-slate-400"><MoreHorizontal size={18} /></button>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
            {/* Show real nodes if backend connected, otherwise simulated */}
            {isBackendConnected && realNodes.length > 0 ? (
              realNodes.map(node => (
                <div key={node.name} className="group p-3 rounded-2xl bg-slate-50 dark:bg-[#0F1115] border border-slate-200 dark:border-white/5 hover:border-primary/50 dark:hover:border-white/10 transition-all flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      node.status === 'healthy' ? 'bg-emerald-500/10 text-emerald-500' :
                      node.status === 'error' ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'
                    }`}>
                      <Server size={18} />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-white truncate max-w-[120px]">{node.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono uppercase">{node.role}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-mono text-slate-700 dark:text-white">
                      {node.metrics?.cpu_usage_percent?.toFixed(0) ?? '--'}%
                    </div>
                    <div className="text-[10px] text-slate-500">CPU</div>
                  </div>
                </div>
              ))
            ) : (
              nodes.map(node => (
                <div key={node.id} className="group p-3 rounded-2xl bg-slate-50 dark:bg-[#0F1115] border border-slate-200 dark:border-white/5 hover:border-primary/50 dark:hover:border-white/10 transition-all flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      node.status === 'healthy' ? 'bg-emerald-500/10 text-emerald-500' :
                      node.status === 'error' ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'
                    }`}>
                      <TrendingUp size={18} />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">{node.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono uppercase">{node.type}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-mono text-slate-700 dark:text-white">{node.metrics.cpu}%</div>
                    <div className="text-[10px] text-slate-500">CPU Usage</div>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-white/5">
            <button className="w-full py-3 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-sm font-medium text-slate-700 dark:text-white transition-colors">
              View All Resources
            </button>
          </div>
        </Card>
      </div>

      {/* Logs Transaction History Style */}
      <Card>
         <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-900 dark:text-white">System Log Stream</h3>
            <span className="text-xs text-slate-500">Real-time Ingestion</span>
         </div>
         <div className="space-y-2">
            {logs.slice(0, 5).map(log => (
               <div key={log.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors border-b border-slate-100 dark:border-white/5 last:border-0">
                  <div className="flex items-center gap-4">
                     <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${
                        log.level === 'error' ? 'border-red-500/30 bg-red-500/10' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                     }`}>
                        <Terminal size={14} className={log.level === 'error' ? 'text-red-500' : 'text-slate-400'} />
                     </div>
                     <div>
                        <div className="text-sm text-slate-700 dark:text-slate-300 font-medium">{log.message}</div>
                        <div className="text-xs text-slate-500">{log.source} • {log.traceId}</div>
                     </div>
                  </div>
                  <div className="text-xs font-mono text-slate-500">
                     {new Date(log.timestamp).toLocaleTimeString()}
                  </div>
               </div>
            ))}
         </div>
      </Card>

    </div>
  );
};

// Crypto-style Card Component for DORA Metrics
const DoraCryptoCard: React.FC<{
  title: string, 
  symbol: string, 
  value: string, 
  trend: number, 
  inverse?: boolean, 
  color: string,
  sparkData: {value: number}[]
}> = ({ title, symbol, value, trend, inverse, color, sparkData }) => {
  const isGood = inverse ? trend < 0 : trend > 0;
  
  return (
    <div className="relative overflow-hidden rounded-3xl p-5 bg-white dark:bg-[#0F1115] border border-slate-200 dark:border-white/5 hover:border-primary/50 dark:hover:border-white/10 transition-all shadow-sm dark:shadow-lg group">
      {/* Background glow based on color */}
      <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-10" style={{ backgroundColor: color }}></div>
      
      <div className="flex justify-between items-start mb-2 relative z-10">
         <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-xs font-bold text-slate-700 dark:text-white">
               {symbol}
            </div>
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</span>
         </div>
         <div className="p-1 rounded-full bg-slate-100 dark:bg-white/5 group-hover:bg-slate-200 dark:group-hover:bg-white/10 transition-colors cursor-pointer">
            <ArrowUpRight size={14} className="text-slate-400" />
         </div>
      </div>

      <div className="mb-4 relative z-10">
         <div className="text-xs text-slate-500 mb-1">Reward Rate (Target)</div>
         <div className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{value}</div>
         <div className={`text-xs font-medium mt-1 flex items-center gap-1 ${isGood ? 'text-emerald-500 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
            {isGood ? '▲' : '▼'} {Math.abs(trend)}% 
            <span className="text-slate-400 dark:text-slate-600 font-normal">vs last epoch</span>
         </div>
      </div>

      {/* Mini Sparkline */}
      <div className="h-12 -mx-5 -mb-5 relative z-10 opacity-60 group-hover:opacity-100 transition-opacity">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={sparkData}>
            <defs>
              <linearGradient id={`grad-${symbol}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.3}/>
                <stop offset="100%" stopColor={color} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2} fill={`url(#grad-${symbol})`} isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};