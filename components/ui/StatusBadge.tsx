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
    [Status.HEALTHY]: { icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10 border-success/20' },
    [Status.SUCCESS]: { icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10 border-success/20' },
    [Status.WARNING]: { icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning/10 border-warning/20' },
    [Status.ERROR]: { icon: XCircle, color: 'text-error', bg: 'bg-error/10 border-error/20' },
    [Status.FAILED]: { icon: XCircle, color: 'text-error', bg: 'bg-error/10 border-error/20' },
    [Status.PENDING]: { icon: Clock, color: 'text-primary', bg: 'bg-primary/10 border-primary/20' },
    [Status.RUNNING]: { icon: PlayCircle, color: 'text-primary', bg: 'bg-primary/10 border-primary/20' },
    [Status.STOPPED]: { icon: PauseCircle, color: 'text-secondary', bg: 'bg-secondary/10 border-secondary/20' },
    [Status.PLANNED]: { icon: FileDiff, color: 'text-accent', bg: 'bg-accent/10 border-accent/20' },
  };

  const currentConfig = config[status] || config[Status.PENDING];
  const { icon: Icon, color, bg } = currentConfig;
  
  const sizeClass = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';
  const containerClass = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-sm';

  return (
    <div className={`flex items-center gap-1.5 rounded-full border ${bg} ${containerClass}`}>
      <Icon className={`${sizeClass} ${color} ${status === Status.RUNNING ? 'animate-pulse' : ''}`} />
      {showLabel && <span className={`font-medium ${color} capitalize`}>{status.replace('_', ' ')}</span>}
    </div>
  );
};