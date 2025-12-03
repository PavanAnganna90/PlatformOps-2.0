import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { StatusBadge } from '../ui/StatusBadge';
import { MOCK_NODES } from '../../constants';
import { Server, Database, Box, Cloud, Cpu, Activity, HardDrive, RefreshCw, Wifi, WifiOff, AlertCircle } from 'lucide-react';
import { ResourceType, InfrastructureNode } from '../../types';
import { Skeleton } from '../ui/Skeleton';
import { useInfrastructure } from '../../hooks/useKubernetes';

export const InfrastructureView: React.FC = () => {
  const { 
    data: realNodes, 
    isLoading: apiLoading, 
    error, 
    refetch, 
    isBackendConnected 
  } = useInfrastructure();
  
  const [nodes, setNodes] = useState<InfrastructureNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Use real data if available, otherwise fall back to mock
    if (!apiLoading) {
      if (realNodes.length > 0) {
        setNodes(realNodes);
      } else {
        // Fall back to mock data
        setNodes(MOCK_NODES);
      }
      setIsLoading(false);
    }
  }, [realNodes, apiLoading]);

  const getIcon = (type: ResourceType) => {
    switch (type) {
      case ResourceType.K8S_CLUSTER: return Cloud;
      case ResourceType.NODE: return Server;
      case ResourceType.DATABASE: return Database;
      case ResourceType.POD: return Box;
      case ResourceType.TERRAFORM: return HardDrive;
      default: return Server;
    }
  };

  const InfrastructureSkeleton = () => (
    <Card className="h-[320px] flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-start mb-4">
          <Skeleton className="w-12 h-12 rounded-lg" />
          <Skeleton className="w-20 h-6 rounded-full" />
        </div>
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-4 w-1/3 mb-4" />
        <div className="space-y-2 mb-6">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
        </div>
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="w-8 h-4" />
          <Skeleton className="w-24 h-2 rounded-full" />
        </div>
        <div className="flex items-center justify-between">
          <Skeleton className="w-8 h-4" />
          <Skeleton className="w-24 h-2 rounded-full" />
        </div>
        <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between">
          <Skeleton className="w-20 h-3" />
          <Skeleton className="w-16 h-3" />
        </div>
      </div>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Infrastructure Map</h2>
          <div className="flex items-center gap-2 mt-1">
            {isBackendConnected ? (
              <span className="flex items-center gap-1 text-xs text-emerald-500">
                <Wifi size={12} /> Live Data
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs text-amber-500">
                <WifiOff size={12} /> Demo Mode
              </span>
            )}
            {error && (
              <span className="flex items-center gap-1 text-xs text-red-500">
                <AlertCircle size={12} /> {error}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => refetch()}
            disabled={isLoading}
            className="px-3 py-2 text-sm bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
            Add Resource
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      {isBackendConnected && !isLoading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-[#0F1115] border border-slate-200 dark:border-white/5 rounded-xl p-4">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {nodes.filter(n => n.type === ResourceType.NODE || n.type === ResourceType.K8S_CLUSTER).length}
            </div>
            <div className="text-xs text-slate-500">Nodes</div>
          </div>
          <div className="bg-white dark:bg-[#0F1115] border border-slate-200 dark:border-white/5 rounded-xl p-4">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {nodes.filter(n => n.type === ResourceType.POD).length}
            </div>
            <div className="text-xs text-slate-500">Pods</div>
          </div>
          <div className="bg-white dark:bg-[#0F1115] border border-slate-200 dark:border-white/5 rounded-xl p-4">
            <div className="text-2xl font-bold text-emerald-500">
              {nodes.filter(n => n.status === 'healthy').length}
            </div>
            <div className="text-xs text-slate-500">Healthy</div>
          </div>
          <div className="bg-white dark:bg-[#0F1115] border border-slate-200 dark:border-white/5 rounded-xl p-4">
            <div className="text-2xl font-bold text-amber-500">
              {nodes.filter(n => n.status === 'warning' || n.status === 'error').length}
            </div>
            <div className="text-xs text-slate-500">Issues</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading 
          ? Array.from({ length: 6 }).map((_, i) => <InfrastructureSkeleton key={i} />)
          : nodes.map((node) => {
              const Icon = getIcon(node.type);
              return (
                <Card key={node.id} className="group relative overflow-hidden" hoverEffect>
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Icon size={120} />
                  </div>
                  
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <StatusBadge status={node.status} />
                    </div>

                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1 truncate" title={node.name}>
                      {node.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
                      {node.type.replace('_', ' ')}
                    </p>

                    {node.description && (
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 line-clamp-2">{node.description}</p>
                    )}

                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500 flex items-center gap-2">
                          <Cpu size={14} /> CPU
                        </span>
                        <div className="flex items-center gap-2 w-32">
                          <div className="h-1.5 flex-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all ${
                                node.metrics.cpu > 80 ? 'bg-red-500' : 
                                node.metrics.cpu > 60 ? 'bg-amber-500' : 'bg-primary'
                              }`}
                              style={{ width: `${Math.min(node.metrics.cpu, 100)}%` }} 
                            />
                          </div>
                          <span className="text-slate-700 dark:text-slate-300 w-10 text-right text-xs font-mono">
                            {node.metrics.cpu.toFixed(0)}%
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500 flex items-center gap-2">
                          <Activity size={14} /> MEM
                        </span>
                        <div className="flex items-center gap-2 w-32">
                          <div className="h-1.5 flex-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all ${
                                node.metrics.memory > 80 ? 'bg-red-500' : 
                                node.metrics.memory > 60 ? 'bg-amber-500' : 'bg-accent'
                              }`}
                              style={{ width: `${Math.min(node.metrics.memory, 100)}%` }} 
                            />
                          </div>
                          <span className="text-slate-700 dark:text-slate-300 w-10 text-right text-xs font-mono">
                            {node.metrics.memory.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {(node.region || node.uptime) && (
                      <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs text-slate-500">
                        {node.region && <span className="truncate max-w-[120px]" title={node.region}>📍 {node.region}</span>}
                        {node.uptime && <span>⏱️ {node.uptime}</span>}
                      </div>
                    )}

                    {node.tags && node.tags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {node.tags.slice(0, 3).map((tag, i) => (
                          <span 
                            key={i} 
                            className="px-2 py-0.5 text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full truncate max-w-[80px]"
                            title={tag}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              );
            })
        }
      </div>
    </div>
  );
};

