/**
 * Cluster Context Provider
 * 
 * Provides app-wide state for:
 * - Current active cluster
 * - Cluster list
 * - Context switching
 * - Backend connection status
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { apiClient, ClusterInfo } from '../services/api';

// ============================================================================
// Types
// ============================================================================

interface ClusterContextType {
  // State
  clusters: ClusterInfo[];
  activeCluster: ClusterInfo | null;
  isLoading: boolean;
  error: string | null;
  isBackendConnected: boolean;
  
  // Actions
  setActiveCluster: (cluster: ClusterInfo) => Promise<void>;
  refreshClusters: () => Promise<void>;
  switchContext: (contextName: string) => Promise<boolean>;
}

// ============================================================================
// Context
// ============================================================================

const ClusterContext = createContext<ClusterContextType | undefined>(undefined);

// ============================================================================
// Provider
// ============================================================================

interface ClusterProviderProps {
  children: ReactNode;
}

export const ClusterProvider: React.FC<ClusterProviderProps> = ({ children }) => {
  const [clusters, setClusters] = useState<ClusterInfo[]>([]);
  const [activeCluster, setActiveClusterState] = useState<ClusterInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isBackendConnected, setIsBackendConnected] = useState(false);

  /**
   * Fetch clusters from the backend
   */
  const refreshClusters = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Check backend availability
      const available = await apiClient.checkBackendAvailable();
      setIsBackendConnected(available);

      if (!available) {
        // Use demo cluster
        const demoCluster: ClusterInfo = {
          name: 'Demo Cluster',
          context: 'demo',
          status: 'connected',
          version: '1.28',
          node_count: 3,
          namespace_count: 8,
          pod_count: 24,
        };
        setClusters([demoCluster]);
        setActiveClusterState(demoCluster);
        return;
      }

      // Fetch real clusters
      const response = await apiClient.listClusters();
      setClusters(response.clusters);

      // Set active cluster
      if (response.clusters.length > 0) {
        // Find first connected cluster, or use first in list
        const connected = response.clusters.find(c => c.status === 'connected');
        const active = connected || response.clusters[0];
        setActiveClusterState(active);
      }
    } catch (err) {
      console.error('Failed to fetch clusters:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch clusters');
      
      // Fallback to demo
      const demoCluster: ClusterInfo = {
        name: 'Demo Cluster',
        context: 'demo',
        status: 'connected',
        version: '1.28',
        node_count: 3,
        namespace_count: 8,
        pod_count: 24,
      };
      setClusters([demoCluster]);
      setActiveClusterState(demoCluster);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Switch to a different cluster context
   */
  const switchContext = useCallback(async (contextName: string): Promise<boolean> => {
    if (!isBackendConnected) {
      console.log('Backend not connected, cannot switch context');
      return false;
    }

    try {
      // Call backend to switch context
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/kubernetes/context`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ context: contextName }),
      });

      const data = await response.json();

      if (data.success) {
        // Refresh clusters to get updated data
        await refreshClusters();
        return true;
      } else {
        setError(data.error || 'Failed to switch context');
        return false;
      }
    } catch (err) {
      console.error('Failed to switch context:', err);
      setError(err instanceof Error ? err.message : 'Failed to switch context');
      return false;
    }
  }, [isBackendConnected, refreshClusters]);

  /**
   * Set the active cluster (UI-only, doesn't switch backend context)
   */
  const setActiveCluster = useCallback(async (cluster: ClusterInfo) => {
    // If backend is connected and cluster is different, switch context
    if (isBackendConnected && cluster.context !== activeCluster?.context) {
      const success = await switchContext(cluster.context);
      if (success) {
        setActiveClusterState(cluster);
      }
    } else {
      setActiveClusterState(cluster);
    }
  }, [isBackendConnected, activeCluster, switchContext]);

  // Initial load
  useEffect(() => {
    refreshClusters();
  }, [refreshClusters]);

  // Periodically refresh cluster status (every 30 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      if (isBackendConnected) {
        refreshClusters();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [isBackendConnected, refreshClusters]);

  const value: ClusterContextType = {
    clusters,
    activeCluster,
    isLoading,
    error,
    isBackendConnected,
    setActiveCluster,
    refreshClusters,
    switchContext,
  };

  return (
    <ClusterContext.Provider value={value}>
      {children}
    </ClusterContext.Provider>
  );
};

// ============================================================================
// Hook
// ============================================================================

export const useCluster = (): ClusterContextType => {
  const context = useContext(ClusterContext);
  
  if (context === undefined) {
    throw new Error('useCluster must be used within a ClusterProvider');
  }
  
  return context;
};

export default ClusterContext;

