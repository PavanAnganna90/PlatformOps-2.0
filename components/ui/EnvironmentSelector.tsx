/**
 * Environment Selector Component
 * 
 * Displays the current environment/cluster and allows switching between
 * configured clusters. Shows connection status for each cluster.
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Cloud, 
  ChevronDown, 
  Check, 
  AlertCircle, 
  Loader2,
  Server,
  RefreshCw,
  Wifi,
  WifiOff
} from 'lucide-react';
import { apiClient, ClusterInfo, ClusterListResponse } from '../../services/api';

interface EnvironmentSelectorProps {
  /**
   * Callback when cluster is changed
   */
  onClusterChange?: (cluster: ClusterInfo) => void;
  
  /**
   * Additional CSS classes
   */
  className?: string;
}

export const EnvironmentSelector: React.FC<EnvironmentSelectorProps> = ({
  onClusterChange,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [clusters, setClusters] = useState<ClusterInfo[]>([]);
  const [activeCluster, setActiveCluster] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isBackendAvailable, setIsBackendAvailable] = useState<boolean | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch clusters on mount
  useEffect(() => {
    fetchClusters();
  }, []);

  const fetchClusters = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // First check if backend is available
      const available = await apiClient.checkBackendAvailable();
      setIsBackendAvailable(available);

      if (!available) {
        // Use demo data if backend is not available
        setClusters([
          {
            name: 'Demo Cluster',
            context: 'demo-local',
            status: 'connected',
            version: '1.28',
            node_count: 3,
            namespace_count: 8,
            pod_count: 24,
          },
        ]);
        setActiveCluster('demo-local');
        return;
      }

      const response: ClusterListResponse = await apiClient.listClusters();
      setClusters(response.clusters);
      setActiveCluster(response.active_cluster || response.clusters[0]?.context || null);
    } catch (err) {
      console.error('Failed to fetch clusters:', err);
      setError('Failed to load clusters');
      // Fallback to demo data
      setClusters([
        {
          name: 'Demo Cluster',
          context: 'demo-local',
          status: 'connected',
          version: '1.28',
          node_count: 3,
          namespace_count: 8,
          pod_count: 24,
        },
      ]);
      setActiveCluster('demo-local');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClusterSelect = (cluster: ClusterInfo) => {
    setActiveCluster(cluster.context);
    setIsOpen(false);
    onClusterChange?.(cluster);
  };

  const currentCluster = clusters.find(c => c.context === activeCluster) || clusters[0];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'text-emerald-500';
      case 'disconnected':
        return 'text-slate-500';
      case 'error':
        return 'text-red-500';
      default:
        return 'text-slate-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <Wifi size={12} className="text-emerald-500" />;
      case 'disconnected':
        return <WifiOff size={12} className="text-slate-500" />;
      case 'error':
        return <AlertCircle size={12} className="text-red-500" />;
      default:
        return <Loader2 size={12} className="animate-spin text-slate-400" />;
    }
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className={`
          flex items-center gap-2 px-3 py-2 rounded-xl
          bg-white dark:bg-[#0F1115] 
          border border-slate-200 dark:border-white/5
          hover:border-primary/30 dark:hover:border-white/10
          transition-all duration-200
          shadow-sm dark:shadow-lg
          ${isOpen ? 'ring-2 ring-primary/20' : ''}
        `}
      >
        {isLoading ? (
          <Loader2 size={16} className="animate-spin text-slate-400" />
        ) : (
          <>
            <Cloud size={16} className="text-primary" />
            <div className="flex flex-col items-start">
              <span className="text-xs font-semibold text-slate-900 dark:text-white leading-none">
                {currentCluster?.name || 'No Cluster'}
              </span>
              <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                {getStatusIcon(currentCluster?.status || 'unknown')}
                <span className={getStatusColor(currentCluster?.status || 'unknown')}>
                  {currentCluster?.status || 'unknown'}
                </span>
              </span>
            </div>
            <ChevronDown 
              size={14} 
              className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            />
          </>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="
          absolute top-full left-0 mt-2 w-72 z-50
          bg-white dark:bg-[#0F1115]
          border border-slate-200 dark:border-white/10
          rounded-xl shadow-xl dark:shadow-2xl
          overflow-hidden
          animate-in fade-in slide-in-from-top-2 duration-200
        ">
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Clusters
            </span>
            <div className="flex items-center gap-2">
              {isBackendAvailable === false && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
                  Demo Mode
                </span>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  apiClient.resetAvailabilityCheck();
                  fetchClusters();
                }}
                className="p-1 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors"
                title="Refresh clusters"
              >
                <RefreshCw size={12} className="text-slate-400" />
              </button>
            </div>
          </div>

          {/* Cluster List */}
          <div className="max-h-64 overflow-y-auto">
            {error && (
              <div className="px-4 py-3 text-xs text-red-500 bg-red-500/5 flex items-center gap-2">
                <AlertCircle size={14} />
                {error}
              </div>
            )}

            {clusters.length === 0 && !error && (
              <div className="px-4 py-6 text-center text-slate-500 text-sm">
                No clusters configured
              </div>
            )}

            {clusters.map((cluster) => (
              <button
                key={cluster.context}
                onClick={() => handleClusterSelect(cluster)}
                className={`
                  w-full px-4 py-3 flex items-center gap-3
                  hover:bg-slate-50 dark:hover:bg-white/5
                  transition-colors text-left
                  ${cluster.context === activeCluster ? 'bg-primary/5 dark:bg-primary/10' : ''}
                `}
              >
                <div className={`
                  w-8 h-8 rounded-lg flex items-center justify-center
                  ${cluster.status === 'connected' 
                    ? 'bg-emerald-500/10 text-emerald-500' 
                    : 'bg-slate-100 dark:bg-white/5 text-slate-400'}
                `}>
                  <Server size={16} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-900 dark:text-white truncate">
                      {cluster.name}
                    </span>
                    {cluster.version && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/5 text-slate-500 font-mono">
                        v{cluster.version}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-xs ${getStatusColor(cluster.status)}`}>
                      {cluster.status}
                    </span>
                    {cluster.status === 'connected' && (
                      <span className="text-[10px] text-slate-400">
                        {cluster.node_count} nodes • {cluster.pod_count} pods
                      </span>
                    )}
                    {cluster.error && (
                      <span className="text-[10px] text-red-400 truncate">
                        {cluster.error}
                      </span>
                    )}
                  </div>
                </div>

                {cluster.context === activeCluster && (
                  <Check size={16} className="text-primary shrink-0" />
                )}
              </button>
            ))}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-black/20">
            <p className="text-[10px] text-slate-400">
              {isBackendAvailable 
                ? 'Connected to OpsSight API'
                : 'Running in demo mode - Start backend for real data'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnvironmentSelector;

