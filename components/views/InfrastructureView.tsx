import React from 'react';
import { Card } from '../ui/Card';
import { StatusBadge } from '../ui/StatusBadge';
import { MOCK_NODES } from '../../constants';
import { Server, Database, Box, Cloud, Cpu, Activity, HardDrive } from 'lucide-react';
import { ResourceType } from '../../types';

export const InfrastructureView: React.FC = () => {
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Infrastructure Map</h2>
        <div className="flex gap-2">
          <button className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
            Add Resource
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {MOCK_NODES.map((node) => {
          const Icon = getIcon(node.type);
          return (
            <Card key={node.id} className="group relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Icon size={120} />
              </div>
              
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-slate-800 rounded-lg border border-slate-700">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <StatusBadge status={node.status} />
                </div>

                <h3 className="text-lg font-semibold text-white mb-1">{node.name}</h3>
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-4">{node.type.replace('_', ' ')}</p>

                {node.description && (
                  <p className="text-sm text-slate-400 mb-6 line-clamp-2">{node.description}</p>
                )}

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500 flex items-center gap-2">
                      <Cpu size={14} /> CPU
                    </span>
                    <div className="flex items-center gap-2 w-32">
                      <div className="h-1.5 flex-1 bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full" 
                          style={{ width: `${node.metrics.cpu}%` }} 
                        />
                      </div>
                      <span className="text-slate-300 w-8 text-right">{node.metrics.cpu}%</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500 flex items-center gap-2">
                      <Activity size={14} /> MEM
                    </span>
                    <div className="flex items-center gap-2 w-32">
                      <div className="h-1.5 flex-1 bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-accent rounded-full" 
                          style={{ width: `${node.metrics.memory}%` }} 
                        />
                      </div>
                      <span className="text-slate-300 w-8 text-right">{node.metrics.memory}%</span>
                    </div>
                  </div>
                </div>

                {node.region && (
                  <div className="mt-6 pt-4 border-t border-slate-800 flex justify-between items-center text-xs text-slate-500">
                    <span>Region: {node.region}</span>
                    <span>Uptime: {node.uptime}</span>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
