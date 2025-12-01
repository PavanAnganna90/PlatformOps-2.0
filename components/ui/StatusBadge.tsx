import React from 'react';
import { Status } from '../../types';
import { CheckCircle2, AlertTriangle, XCircle, Clock, PauseCircle, PlayCircle, ShieldAlert, FileDiff } from 'lucide-react';

interface StatusBadgeProps {
  status: Status;
  size?: 'sm' | 'md';
  showLabel?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md', showLabel = true }) => {
  const config = {
    [Status.HEALTHY]: { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20 shadow-[0_0_10px_-3px_rgba(16,185,129,0.3)]' },
    [Status.SUCCESS]: { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20 shadow-[0_0_10px_-3px_rgba(16,185,129,0.3)]' },
    [Status.WARNING]: { icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
    [Status.ERROR]: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20 shadow-[0_0_10px_-3px_rgba(239,68,68,0.3)]' },
    [Status.FAILED]: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20 shadow-[0_0_10px_-3px_rgba(239,68,68,0.3)]' },
    [Status.PENDING]: { icon: Clock, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
    [Status.RUNNING]: { icon: PlayCircle, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20 animate-pulse' },
    [Status.STOPPED]: { icon: PauseCircle, color: 'text-slate-400', bg: 'bg-slate-500/10 border-slate-500/20' },
    [Status.PLANNED]: { icon: FileDiff, color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20' },
  };

  const currentConfig = config[status] || config[Status.PENDING];
  const { icon: Icon, color, bg } = currentConfig;
  
  const sizeClass = size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5';
  const containerClass = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  return (
    <div className={`flex items-center gap-1.5 rounded-full border ${bg} ${containerClass}`}>
      <Icon className={`${sizeClass} ${color}`} />
      {showLabel && <span className={`font-semibold ${color} capitalize tracking-wide`}>{status.replace('_', ' ')}</span>}
    </div>
  );
};