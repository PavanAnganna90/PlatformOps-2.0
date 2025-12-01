import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { storage } from '../../services/storage';
import { MOCK_TF_PLAN_OUTPUT } from '../../constants';
import { Cloud, Play, CheckCircle, Terminal, AlertTriangle, Layers, Loader2, RotateCcw, Lock, Unlock, X, PlusCircle, MinusCircle, FileDiff, Share2, Box, Server, Shield, Database, HardDrive, Network } from 'lucide-react';
import { Status, TerraformWorkspace } from '../../types';
import { StatusBadge } from '../ui/StatusBadge';

export const TerraformView: React.FC = () => {
  const [workspaces, setWorkspaces] = useState<TerraformWorkspace[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'console' | 'graph'>('console');

  // New Workspace Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newProvider, setNewProvider] = useState<'aws' | 'gcp' | 'azure'>('aws');

  // Load initial data
  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    const data = storage.getTerraformWorkspaces();
    setWorkspaces(data);
    if (!selectedId && data.length > 0) {
      setSelectedId(data[0].id);
    }
  };

  const selectedWorkspace = workspaces.find(w => w.id === selectedId) || workspaces[0];

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newWorkspace: TerraformWorkspace = {
      id: `ws-${Date.now()}`,
      name: newName,
      provider: newProvider,
      status: Status.PENDING,
      lastRun: 'Never',
      resources: 0,
      drift: false,
      isLocked: false
    };

    storage.addTerraformWorkspace(newWorkspace);
    refreshData();
    setSelectedId(newWorkspace.id);
    setShowCreateModal(false);
    setNewName('');
    setNewProvider('aws');
  };

  const handlePlan = () => {
    if (!selectedWorkspace) return;
    
    // 1. Try to Acquire Lock
    const locked = storage.acquireTerraformLock(selectedWorkspace.id, 'currentUser');
    if (!locked) {
      setErrorMsg(`Error: Workspace is locked by ${selectedWorkspace.lockedBy || 'unknown user'}.`);
      refreshData(); // Refresh to show current lock state
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);
    setViewMode('console'); // Switch to console to see progress
    
    // Optimistic UI update
    storage.updateTerraformWorkspace(selectedWorkspace.id, { status: Status.RUNNING });
    refreshData();

    // Simulate API delay for "terraform plan"
    setTimeout(() => {
      storage.updateTerraformWorkspace(selectedWorkspace.id, { 
        status: Status.PLANNED,
        latestPlanOutput: MOCK_TF_PLAN_OUTPUT
      });
      // Release lock after plan (in some workflows, plan doesn't hold lock, but here we assume it runs and finishes)
      storage.releaseTerraformLock(selectedWorkspace.id);
      refreshData();
      setIsProcessing(false);
    }, 2000);
  };

  const handleApply = () => {
    if (!selectedWorkspace) return;

    // 1. Try to Acquire Lock
    const locked = storage.acquireTerraformLock(selectedWorkspace.id, 'currentUser');
    if (!locked) {
      setErrorMsg(`Error: Workspace is locked by ${selectedWorkspace.lockedBy || 'unknown user'}.`);
      refreshData();
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);
    setViewMode('console');
    
    // Simulate apply delay
    setTimeout(() => {
      storage.updateTerraformWorkspace(selectedWorkspace.id, { 
        status: Status.SUCCESS,
        latestPlanOutput: undefined, // Clear plan after apply
        lastRun: 'Just now',
        drift: false
      });
      storage.releaseTerraformLock(selectedWorkspace.id);
      refreshData();
      setIsProcessing(false);
    }, 2500);
  };

  const handleReset = () => {
    if (!selectedWorkspace) return;
    storage.updateTerraformWorkspace(selectedWorkspace.id, { 
      status: Status.HEALTHY,
      latestPlanOutput: undefined 
    });
    refreshData();
  };

  const handleDiscard = () => {
    if (!selectedWorkspace) return;
    storage.updateTerraformWorkspace(selectedWorkspace.id, { 
      status: Status.HEALTHY,
      latestPlanOutput: undefined
    });
    refreshData();
  };

  const handleForceUnlock = () => {
    if (!selectedWorkspace) return;
    storage.releaseTerraformLock(selectedWorkspace.id);
    setErrorMsg(null);
    refreshData();
  };

  // Extract stats from plan output
  const planStats = selectedWorkspace?.latestPlanOutput 
    ? (() => {
        const match = selectedWorkspace.latestPlanOutput.match(/Plan: (\d+) to add, (\d+) to change, (\d+) to destroy/);
        return match ? { add: match[1], change: match[2], destroy: match[3] } : null;
      })()
    : null;

  // Helper to render colored diff output
  const renderPlanOutput = (output: string) => {
    return output.split('\n').map((line, i) => {
      const trimmed = line.trim();
      let className = "text-slate-300 pl-2 border-l-2 border-transparent";
      
      if (trimmed.startsWith('+')) {
        className = "text-emerald-400 bg-emerald-500/5 border-l-2 border-emerald-500 pl-2";
      }
      else if (trimmed.startsWith('-')) {
        className = "text-error bg-error/5 border-l-2 border-error pl-2";
      }
      else if (trimmed.startsWith('~')) {
        className = "text-amber-400 bg-amber-500/5 border-l-2 border-amber-500 pl-2";
      }
      else if (trimmed.startsWith('#')) {
        className = "text-white font-bold mt-4 mb-1 border-b border-slate-700/50 pb-1";
      }

      return <div key={i} className={`${className} py-0.5 rounded-r hover:bg-white/5 transition-colors`}>{line}</div>;
    });
  };

  // Helper to parse resources for Graph
  const parseResourcesFromPlan = (plan: string) => {
    const resources: { type: string; name: string; action: string; full: string }[] = [];
    const lines = plan.split('\n');
    const regex = /#\s+([a-z0-9_]+)\.([a-z0-9_-]+)\s+will be\s+(created|updated in-place|destroyed|read)/;
    
    lines.forEach(line => {
      const match = line.match(regex);
      if (match) {
        resources.push({
          type: match[1],
          name: match[2],
          action: match[3],
          full: `${match[1]}.${match[2]}`
        });
      }
    });
    return resources;
  };

  const parsedResources = selectedWorkspace?.latestPlanOutput 
    ? parseResourcesFromPlan(selectedWorkspace.latestPlanOutput) 
    : [];

  // Graph Rendering Logic
  const GraphView = ({ resources }: { resources: typeof parsedResources }) => {
    if (resources.length === 0) return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500">
        <Share2 size={48} className="mb-4 opacity-20" />
        <p>No resources found in plan to visualize.</p>
      </div>
    );

    // Layout logic: Group by layers
    const compute = resources.filter(r => r.type.includes('instance') || r.type.includes('cluster'));
    const network = resources.filter(r => r.type.includes('security') || r.type.includes('vpc') || r.type.includes('subnet'));
    const storage = resources.filter(r => r.type.includes('s3') || r.type.includes('db') || r.type.includes('bucket'));
    const other = resources.filter(r => !compute.includes(r) && !network.includes(r) && !storage.includes(r));
    
    const showCompute = compute.length > 0;
    const showNetwork = network.length > 0 || other.length > 0;
    const showStorage = storage.length > 0;

    const renderNode = (r: typeof resources[0]) => {
      let Icon = Box;
      if (r.type.includes('instance')) Icon = Server;
      if (r.type.includes('security')) Icon = Shield;
      if (r.type.includes('s3') || r.type.includes('bucket')) Icon = HardDrive;
      if (r.type.includes('db')) Icon = Database;
      if (r.type.includes('vpc')) Icon = Network;

      let actionColor = 'text-slate-400 border-slate-700';
      let actionIcon = null;
      if (r.action === 'created') {
        actionColor = 'text-emerald-400 border-emerald-500/50 bg-emerald-500/10';
        actionIcon = <PlusCircle size={12} className="text-emerald-500" />;
      } else if (r.action === 'updated in-place') {
        actionColor = 'text-amber-400 border-amber-500/50 bg-amber-500/10';
        actionIcon = <FileDiff size={12} className="text-amber-500" />;
      } else if (r.action === 'destroyed') {
        actionColor = 'text-error border-error/50 bg-error/10';
        actionIcon = <MinusCircle size={12} className="text-error" />;
      }

      return (
        <div key={r.full} className={`
          relative flex items-center gap-3 p-3 rounded-lg border backdrop-blur-sm shadow-xl w-64
          ${actionColor} hover:scale-105 transition-transform cursor-default
        `}>
          <div className="p-2 bg-slate-950/50 rounded-md">
            <Icon size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-mono text-slate-500 truncate">{r.type}</div>
            <div className="font-semibold text-sm truncate" title={r.name}>{r.name}</div>
          </div>
          {actionIcon}
          
          {/* Connector Dot */}
          <div className="absolute -bottom-3 left-1/2 w-2 h-2 bg-slate-600 rounded-full -translate-x-1/2 z-20"></div>
          {/* Top Connector Dot (except for top layer items could have logic but keeping simple) */}
          <div className="absolute -top-3 left-1/2 w-2 h-2 bg-slate-600 rounded-full -translate-x-1/2 z-20"></div>
        </div>
      );
    };

    return (
      <div className="h-full w-full overflow-hidden flex flex-col relative bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-slate-900/50">
        
        {/* Legend */}
        <div className="absolute top-4 right-4 z-20 bg-slate-900/80 backdrop-blur border border-slate-700 p-3 rounded-lg text-xs space-y-2 shadow-lg">
           <div className="font-semibold text-slate-400 mb-1">Plan Actions</div>
           <div className="flex items-center gap-2"><PlusCircle size={12} className="text-emerald-500"/> <span className="text-emerald-400">Create</span></div>
           <div className="flex items-center gap-2"><FileDiff size={12} className="text-amber-500"/> <span className="text-amber-400">Update</span></div>
           <div className="flex items-center gap-2"><MinusCircle size={12} className="text-error"/> <span className="text-error">Destroy</span></div>
        </div>

        <div className="flex-1 overflow-auto p-8 relative">
           {/* SVG Lines Layer */}
           <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none z-0">
              {showCompute && showNetwork && (
                  <line x1="50%" y1="120" x2="50%" y2="280" stroke="currentColor" strokeWidth="2" strokeDasharray="5,5" className="text-slate-400" />
              )}
              {showNetwork && showStorage && (
                  <line x1="50%" y1="280" x2="50%" y2="440" stroke="currentColor" strokeWidth="2" strokeDasharray="5,5" className="text-slate-400" />
              )}
              {/* Fallback if middle layer missing */}
              {showCompute && !showNetwork && showStorage && (
                  <line x1="50%" y1="120" x2="50%" y2="440" stroke="currentColor" strokeWidth="2" strokeDasharray="5,5" className="text-slate-400" />
              )}
           </svg>

           <div className="flex flex-col items-center gap-24 relative z-10 pt-8 pb-16 min-w-max min-h-max mx-auto">
              {/* Level 1: Compute */}
              {showCompute && (
                <div className="flex gap-8 justify-center">
                   {compute.map((r) => renderNode(r))}
                </div>
              )}
              
              {/* Level 2: Network */}
              {showNetwork && (
                <div className="flex gap-8 justify-center">
                   {[...network, ...other].map((r) => renderNode(r))}
                </div>
              )}

              {/* Level 3: Storage */}
              {showStorage && (
                <div className="flex gap-8 justify-center">
                   {storage.map((r) => renderNode(r))}
                </div>
              )}
              
              <div className="text-xs text-slate-500 mt-4 font-mono bg-slate-950/80 px-3 py-1 rounded-full border border-slate-800">
                Dependency Graph (Inferred from Plan)
              </div>
           </div>
        </div>
      </div>
    );
  };

  if (!selectedWorkspace) return null;

  return (
    <div className="space-y-6 h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            Terraform Infrastructure
            {selectedWorkspace.isLocked && (
              <span className="text-xs px-2 py-1 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center gap-1">
                <Lock size={12} /> Locked by {selectedWorkspace.lockedBy}
              </span>
            )}
          </h2>
          <p className="text-slate-400 text-sm">Manage Infrastructure as Code (IaC) workspaces</p>
        </div>
        <div className="flex gap-2">
          {/* New Workspace Button */}
           <button 
             onClick={() => setShowCreateModal(true)}
             className="px-3 py-2 text-slate-300 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 hover:text-white transition-all flex items-center gap-2 mr-2"
           >
             <PlusCircle size={16} /> New Workspace
           </button>

          {/* Force Unlock Button - Only visible if locked */}
          {selectedWorkspace.isLocked && (
             <button 
              onClick={handleForceUnlock}
              className="px-3 py-2 text-xs font-medium text-amber-500 border border-amber-500/50 rounded-lg hover:bg-amber-500/10 flex items-center gap-2 transition-colors mr-2"
              title="Release state lock forcibly"
             >
               <Unlock size={14} /> Force Unlock
             </button>
          )}

          {/* Action Buttons */}
          {(selectedWorkspace.status as Status) === Status.PLANNED ? (
            <div className="flex gap-2">
               <button
                onClick={handleDiscard}
                disabled={isProcessing}
                className="px-4 py-2 text-slate-400 hover:text-white font-medium rounded-lg border border-transparent hover:border-slate-700 hover:bg-slate-800 transition-all flex items-center gap-2"
              >
                <X size={16} /> Discard
              </button>
              <button
                onClick={handleApply}
                disabled={isProcessing || selectedWorkspace.isLocked}
                className={`px-4 py-2 font-medium rounded-lg flex items-center gap-2 transition-colors shadow-lg
                  ${selectedWorkspace.isLocked 
                    ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                    : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-emerald-900/20'}
                `}
              >
                {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                Apply Changes
              </button>
            </div>
          ) : selectedWorkspace.status === Status.SUCCESS && !selectedWorkspace.latestPlanOutput ? (
             <button onClick={handleReset} className="px-4 py-2 bg-slate-800 text-white rounded-lg border border-slate-700 hover:bg-slate-700 flex items-center gap-2 transition-colors">
               <RotateCcw size={16} /> New Plan
             </button>
          ) : (
            <button 
              onClick={handlePlan}
              disabled={isProcessing || selectedWorkspace.isLocked || selectedWorkspace.status === Status.PLANNED}
              className={`px-4 py-2 text-white font-medium rounded-lg flex items-center gap-2 transition-colors
                ${isProcessing || selectedWorkspace.isLocked
                  ? 'bg-slate-700 text-slate-400 cursor-not-allowed border border-slate-600' 
                  : 'bg-primary hover:bg-primary/90'
                }
              `}
            >
              {isProcessing && selectedWorkspace.status === Status.RUNNING ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
              {isProcessing && selectedWorkspace.status === Status.RUNNING ? 'Planning...' : 'Run Plan'}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
        
        {/* Workspace List (Left Panel) */}
        <div className="lg:col-span-4 flex flex-col gap-4 overflow-y-auto pr-1">
          {workspaces.map(ws => (
            <Card 
              key={ws.id} 
              onClick={() => { if(!isProcessing) setSelectedId(ws.id); }}
              className={`cursor-pointer transition-all border-l-4 ${
                selectedId === ws.id 
                  ? 'border-l-primary bg-slate-800/50 border-y-slate-700 border-r-slate-700' 
                  : 'border-l-transparent hover:border-l-slate-600'
              } ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <Cloud className="text-slate-400 w-4 h-4" />
                  <h3 className="font-semibold text-white">{ws.name}</h3>
                  {ws.isLocked && <Lock size={12} className="text-amber-500" />}
                </div>
                <StatusBadge status={ws.status} size="sm" showLabel={false} />
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400 mt-2">
                <span className="uppercase tracking-wider font-bold text-[10px] text-slate-500">{ws.provider}</span>
                <span>{ws.resources} resources</span>
              </div>
              <div className="flex justify-between items-center text-xs text-slate-500 mt-1">
                 <span>Run: {ws.lastRun}</span>
              </div>
              {ws.drift && (
                <div className="mt-3 flex items-center gap-1.5 text-xs text-warning bg-warning/10 p-1.5 rounded">
                  <AlertTriangle size={12} />
                  <span>Drift detected</span>
                </div>
              )}
            </Card>
          ))}
          
          {workspaces.length === 0 && (
             <div className="text-center p-8 text-slate-500 border border-dashed border-slate-700 rounded-xl">
               <Cloud size={32} className="mx-auto mb-2 opacity-50" />
               <p>No workspaces found.</p>
               <button onClick={() => setShowCreateModal(true)} className="text-primary hover:underline text-sm mt-2">Create one</button>
             </div>
          )}
        </div>

        {/* Console / Output Area (Right Panel) */}
        <Card className="lg:col-span-8 flex flex-col bg-[#0d1117] border-slate-800 font-mono text-sm shadow-inner relative overflow-hidden p-0">
          {/* Header with Tabs */}
          <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 shrink-0">
             <div className="flex items-center gap-4">
               <div className="flex items-center gap-2 text-slate-400">
                 <Terminal size={14} />
                 <span className="text-xs">Workspace: {selectedWorkspace.name}</span>
               </div>
               
               {/* Tab Switcher */}
               <div className="flex items-center bg-slate-950 rounded-lg p-0.5 border border-slate-800">
                 <button
                   onClick={() => setViewMode('console')}
                   className={`px-3 py-1 text-xs rounded-md transition-all flex items-center gap-2 ${
                     viewMode === 'console' 
                       ? 'bg-slate-800 text-white shadow-sm' 
                       : 'text-slate-500 hover:text-slate-300'
                   }`}
                 >
                   <Terminal size={12} /> Console
                 </button>
                 <button
                   onClick={() => setViewMode('graph')}
                   className={`px-3 py-1 text-xs rounded-md transition-all flex items-center gap-2 ${
                     viewMode === 'graph' 
                       ? 'bg-slate-800 text-white shadow-sm' 
                       : 'text-slate-500 hover:text-slate-300'
                   }`}
                   disabled={!selectedWorkspace.latestPlanOutput}
                   title={!selectedWorkspace.latestPlanOutput ? "Run plan to visualize" : ""}
                 >
                   <Share2 size={12} /> Visual
                 </button>
               </div>
             </div>

             <div className="flex items-center gap-3">
               {selectedWorkspace.isLocked && (
                 <span className="text-xs text-amber-500 flex items-center gap-1">
                   <Lock size={12} /> LOCKED
                 </span>
               )}
               {/* Secondary Apply button */}
               {selectedWorkspace.status === Status.PLANNED && !selectedWorkspace.isLocked && (
                  <button 
                    onClick={handleApply}
                    disabled={isProcessing}
                    className="px-3 py-1 bg-emerald-600/20 text-emerald-400 border border-emerald-600/50 text-xs rounded hover:bg-emerald-600/30 transition-colors flex items-center gap-1"
                  >
                    <CheckCircle size={12} /> Confirm
                  </button>
               )}
             </div>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="bg-red-500/10 border-b border-red-500/20 px-4 py-2 text-xs text-red-400 flex items-center gap-2 animate-in slide-in-from-top-2">
              <AlertTriangle size={14} />
              {errorMsg}
            </div>
          )}

          {/* Body */}
          <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-slate-700 relative">
             
             {viewMode === 'graph' ? (
               <GraphView resources={parsedResources} />
             ) : (
               <div className="p-4 h-full flex flex-col">
                 {(!selectedWorkspace.latestPlanOutput && selectedWorkspace.status !== Status.RUNNING && selectedWorkspace.status !== Status.SUCCESS) && (
                   <div className="flex flex-col items-center justify-center h-full text-slate-500">
                      <Layers size={48} className="mb-4 opacity-20" />
                      <p>Ready to plan.</p>
                      <p className="text-xs mt-2">Selected workspace: <span className="text-primary">{selectedWorkspace.name}</span></p>
                      {selectedWorkspace.isLocked && <p className="text-xs text-amber-500 mt-2 flex items-center gap-1"><Lock size={12} /> State is currently locked.</p>}
                   </div>
                 )}

                 {selectedWorkspace.status === Status.RUNNING && !selectedWorkspace.latestPlanOutput && (
                   <div className="flex items-center gap-2 text-slate-300">
                     <Loader2 className="animate-spin w-4 h-4" />
                     <span>Running Terraform...</span>
                     <span className="text-slate-500 text-xs ml-2">(Acquiring state lock...)</span>
                   </div>
                 )}

                 {selectedWorkspace.latestPlanOutput && (
                   <>
                     {/* Plan Summary Stats */}
                     {planStats && selectedWorkspace.status === Status.PLANNED && (
                       <div className="mb-4 grid grid-cols-3 gap-4 p-4 bg-slate-900 rounded-lg border border-slate-800 shrink-0">
                         <div className="flex flex-col items-center text-emerald-400 border-r border-slate-800">
                            <PlusCircle size={20} className="mb-1 opacity-80" />
                            <span className="text-2xl font-bold leading-none">{planStats.add}</span>
                            <span className="text-[10px] uppercase tracking-wider font-semibold opacity-70">To Add</span>
                         </div>
                         <div className="flex flex-col items-center text-amber-400 border-r border-slate-800">
                            <FileDiff size={20} className="mb-1 opacity-80" />
                            <span className="text-2xl font-bold leading-none">{planStats.change}</span>
                            <span className="text-[10px] uppercase tracking-wider font-semibold opacity-70">To Change</span>
                         </div>
                         <div className="flex flex-col items-center text-error">
                            <MinusCircle size={20} className="mb-1 opacity-80" />
                            <span className="text-2xl font-bold leading-none">{planStats.destroy}</span>
                            <span className="text-[10px] uppercase tracking-wider font-semibold opacity-70">To Destroy</span>
                         </div>
                       </div>
                     )}
                     
                     <div className="space-y-0.5 font-mono text-xs md:text-sm pb-10">
                       {renderPlanOutput(selectedWorkspace.latestPlanOutput)}
                     </div>
                   </>
                 )}

                 {isProcessing && selectedWorkspace.status === Status.SUCCESS && (
                    <div className="mt-4 pt-4 border-t border-slate-800 text-slate-300 animate-pulse">
                       Applying changes...
                    </div>
                 )}
                 
                 {selectedWorkspace.status === Status.SUCCESS && !selectedWorkspace.latestPlanOutput && (
                   <div className="flex flex-col items-center justify-center h-full">
                     <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
                        <CheckCircle className="w-8 h-8 text-emerald-500" />
                     </div>
                     <div className="text-emerald-400 font-bold mb-2">Apply Complete</div>
                     <div className="text-slate-500 text-xs">Resources updated successfully</div>
                   </div>
                 )}
               </div>
             )}
          </div>
        </Card>
      </div>

      {/* Create Workspace Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="w-96 bg-slate-900 border-slate-700 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">New Workspace</h3>
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Workspace Name</label>
                <input 
                  type="text" 
                  autoFocus
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g., prod-vpc-network" 
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Cloud Provider</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['aws', 'gcp', 'azure'] as const).map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setNewProvider(p)}
                      className={`py-2 rounded-lg text-sm font-medium border capitalize transition-all ${
                        newProvider === p 
                          ? 'bg-primary/20 border-primary text-white' 
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-750'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-slate-800">
                <button 
                  type="button" 
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={!newName.trim()}
                  className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create
                </button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};
