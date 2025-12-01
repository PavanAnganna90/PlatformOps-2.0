import React from 'react';
import { Card } from '../ui/Card';
import { storage } from '../../services/storage';
import { StatusBadge } from '../ui/StatusBadge';
import { GitBranch, GitCommit, Play, RefreshCw, Box } from 'lucide-react';
import { Status } from '../../types';

export const CicdView: React.FC = () => {
  const pipelines = storage.getPipelines();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">CI/CD Pipelines</h2>
          <p className="text-slate-400 text-sm">Deployments and Workflows</p>
        </div>
        <button className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 flex items-center gap-2">
          <Play size={16} /> Run Pipeline
        </button>
      </div>

      <div className="space-y-4">
        {pipelines.map((pipeline) => (
          <Card key={pipeline.id} className="group hover:border-slate-600 transition-all">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center
                  ${pipeline.status === Status.SUCCESS ? 'bg-success/20 text-success' : 
                    pipeline.status === Status.FAILED ? 'bg-error/20 text-error' : 
                    'bg-primary/20 text-primary animate-pulse'}`}>
                  <Box size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">{pipeline.name}</h3>
                  <div className="flex items-center gap-4 text-xs text-slate-400 mt-1">
                    <span className="flex items-center gap-1">
                      <GitBranch size={12} /> {pipeline.branch}
                    </span>
                    <span className="flex items-center gap-1 font-mono">
                      <GitCommit size={12} /> {pipeline.commitHash}
                    </span>
                    <span>{new Date(pipeline.startTime).toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right hidden md:block">
                   <div className="text-xs text-slate-500">Duration</div>
                   <div className="text-sm font-mono text-slate-300">{pipeline.duration}</div>
                </div>
                <StatusBadge status={pipeline.status} />
              </div>
            </div>

            {/* Visual Pipeline Stages */}
            <div className="relative pt-4">
              <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-800 -translate-y-1/2 z-0"></div>
              <div className="relative z-10 flex justify-between gap-2">
                {pipeline.stages.map((stage, idx) => (
                  <div key={idx} className="flex flex-col items-center flex-1">
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center border-4 border-slate-950 shadow-lg mb-2 transition-transform hover:scale-110
                      ${stage.status === Status.SUCCESS ? 'bg-success text-slate-950' : 
                        stage.status === Status.FAILED ? 'bg-error text-white' : 
                        stage.status === Status.RUNNING ? 'bg-primary text-white' : 'bg-slate-700 text-slate-400'}
                    `}>
                      {stage.status === Status.RUNNING ? <RefreshCw size={14} className="animate-spin" /> : <div className="w-2.5 h-2.5 rounded-full bg-current" />}
                    </div>
                    <span className="text-xs font-medium text-slate-300">{stage.name}</span>
                    <span className="text-[10px] text-slate-500 font-mono mt-0.5">{stage.duration}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
