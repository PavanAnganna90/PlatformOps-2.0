/**
 * Cluster Context Provider
 *
 * Provides app-wide state for:
 * - Current active cluster
 * - Cluster list
 * - Context switching
 * - Backend connection status
 * - Refresh trigger for dependent components
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { apiClient, ClusterInfo } from "../services/api";

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

  /**
   * Refresh trigger - increments when cluster changes.
   * Components can use this in useEffect dependencies to refetch data.
   */
  refreshTrigger: number;

  // Actions
  setActiveCluster: (cluster: ClusterInfo) => Promise<void>;
  refreshClusters: () => Promise<void>;
  switchContext: (contextName: string) => Promise<boolean>;

  /**
   * Manually trigger a refresh for all dependent components
   */
  triggerRefresh: () => void;
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

export const ClusterProvider: React.FC<ClusterProviderProps> = ({
  children,
}) => {
  const [clusters, setClusters] = useState<ClusterInfo[]>([]);
  const [activeCluster, setActiveClusterState] = useState<ClusterInfo | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  /**
   * Manually trigger a refresh for all dependent components
   */
  const triggerRefresh = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

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
          name: "Demo Cluster",
          context: "demo",
          status: "connected",
          version: "1.28",
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

      // Set active cluster if not already set
      if (response.clusters.length > 0 && !activeCluster) {
        // Find first connected cluster, or use first in list
        const connected = response.clusters.find(
          (c) => c.status === "connected"
        );
        const active = connected || response.clusters[0];
        setActiveClusterState(active);
      }
    } catch (err) {
      console.error("Failed to fetch clusters:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch clusters");

      // Fallback to demo
      const demoCluster: ClusterInfo = {
        name: "Demo Cluster",
        context: "demo",
        status: "connected",
        version: "1.28",
        node_count: 3,
        namespace_count: 8,
        pod_count: 24,
      };
      setClusters([demoCluster]);
      setActiveClusterState(demoCluster);
    } finally {
      setIsLoading(false);
    }
  }, [activeCluster]);

  /**
   * Switch to a different cluster context
   */
  const switchContext = useCallback(
    async (contextName: string): Promise<boolean> => {
      if (!isBackendConnected) {
        console.log("Backend not connected, cannot switch context");
        return false;
      }

      setIsLoading(true);

      try {
        // Call backend to switch context
        const response = await apiClient.switchContext(contextName);

        if (response.success) {
          // Refresh clusters to get updated data
          await refreshClusters();
          // Trigger refresh for all dependent components
          triggerRefresh();
          return true;
        } else {
          setError(response.error || "Failed to switch context");
          return false;
        }
      } catch (err) {
        console.error("Failed to switch context:", err);
        setError(
          err instanceof Error ? err.message : "Failed to switch context"
        );
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [isBackendConnected, refreshClusters, triggerRefresh]
  );

  /**
   * Set the active cluster and switch backend context
   */
  const setActiveCluster = useCallback(
    async (cluster: ClusterInfo) => {
      // If backend is connected and cluster is different, switch context
      if (isBackendConnected && cluster.context !== activeCluster?.context) {
        const success = await switchContext(cluster.context);
        if (success) {
          setActiveClusterState(cluster);
        }
      } else {
        setActiveClusterState(cluster);
        // Still trigger refresh even if just UI change
        triggerRefresh();
      }
    },
    [isBackendConnected, activeCluster, switchContext, triggerRefresh]
  );

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
    refreshTrigger,
    setActiveCluster,
    refreshClusters,
    switchContext,
    triggerRefresh,
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
    throw new Error("useCluster must be used within a ClusterProvider");
  }

  return context;
};

export default ClusterContext;
