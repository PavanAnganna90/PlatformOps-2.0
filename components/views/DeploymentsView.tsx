/**
 * Deployments View
 *
 * Displays Kubernetes deployments with management capabilities.
 * Allows scaling and restarting deployments.
 */

import React, { useState, useEffect, useCallback } from "react";
import { Card } from "../ui/Card";
import { Skeleton } from "../ui/Skeleton";
import { DeploymentModal } from "../ui/DeploymentModal";
import {
  Server,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Wifi,
  WifiOff,
  Layers,
  Box,
  Scale,
  RotateCcw,
  ChevronRight,
  Image,
} from "lucide-react";
import { apiClient, DeploymentInfo } from "../../services/api";
import { useCluster } from "../../contexts/ClusterContext";

export const DeploymentsView: React.FC = () => {
  const { activeCluster } = useCluster();
  const [deployments, setDeployments] = useState<DeploymentInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [selectedDeployment, setSelectedDeployment] = useState<DeploymentInfo | null>(null);
  const [filterNamespace, setFilterNamespace] = useState<string | null>(null);

  const fetchDeployments = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const available = await apiClient.checkBackendAvailable();
      setIsBackendConnected(available);

      if (available) {
        const data = await apiClient.listDeployments(
          filterNamespace || undefined,
          activeCluster?.context
        );
        setDeployments(data);
      } else {
        setDeployments([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch deployments");
      setDeployments([]);
    } finally {
      setIsLoading(false);
    }
  }, [activeCluster, filterNamespace]);

  useEffect(() => {
    fetchDeployments();
  }, [fetchDeployments]);

  const getHealthStatus = (dep: DeploymentInfo) => {
    if (dep.available_replicas === dep.replicas && dep.replicas > 0) {
      return {
        status: "healthy",
        color: "text-emerald-500",
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/20",
      };
    }
    if (dep.available_replicas > 0) {
      return {
        status: "degraded",
        color: "text-amber-500",
        bg: "bg-amber-500/10",
        border: "border-amber-500/20",
      };
    }
    if (dep.replicas === 0) {
      return {
        status: "scaled down",
        color: "text-slate-500",
        bg: "bg-slate-500/10",
        border: "border-slate-500/20",
      };
    }
    return {
      status: "unhealthy",
      color: "text-red-500",
      bg: "bg-red-500/10",
      border: "border-red-500/20",
    };
  };

  const getHealthIcon = (dep: DeploymentInfo) => {
    const health = getHealthStatus(dep);
    switch (health.status) {
      case "healthy":
        return <CheckCircle size={16} className="text-emerald-500" />;
      case "degraded":
        return <AlertTriangle size={16} className="text-amber-500" />;
      case "scaled down":
        return <Scale size={16} className="text-slate-500" />;
      default:
        return <XCircle size={16} className="text-red-500" />;
    }
  };

  // Get unique namespaces
  const namespaces = [...new Set(deployments.map((d) => d.namespace))];

  // Filter deployments
  const filteredDeployments = filterNamespace
    ? deployments.filter((d) => d.namespace === filterNamespace)
    : deployments;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Deployments
          </h2>
          <div className="flex items-center gap-2 mt-1">
            {isBackendConnected ? (
              <>
                <span className="flex items-center gap-1 text-xs text-emerald-500">
                  <Wifi size={12} /> Live Data
                </span>
                {activeCluster && (
                  <span className="text-xs text-slate-500">
                    • {activeCluster.name}
                  </span>
                )}
              </>
            ) : (
              <span className="flex items-center gap-1 text-xs text-amber-500">
                <WifiOff size={12} /> Demo Mode
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Namespace Filter */}
          {namespaces.length > 1 && (
            <select
              value={filterNamespace || ""}
              onChange={(e) => setFilterNamespace(e.target.value || null)}
              className="px-3 py-2 rounded-lg bg-white dark:bg-[#0F1115] border border-slate-200 dark:border-white/10 text-sm text-slate-700 dark:text-slate-300"
            >
              <option value="">All Namespaces</option>
              {namespaces.map((ns) => (
                <option key={ns} value={ns}>
                  {ns}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={fetchDeployments}
            disabled={isLoading}
            className="px-3 py-2 text-sm bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm">
          {error}
        </div>
      )}

      {/* Stats Bar */}
      {!isLoading && deployments.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-[#0F1115] border border-slate-200 dark:border-white/5 rounded-xl p-4">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {filteredDeployments.length}
            </div>
            <div className="text-xs text-slate-500">Total Deployments</div>
          </div>
          <div className="bg-white dark:bg-[#0F1115] border border-slate-200 dark:border-white/5 rounded-xl p-4">
            <div className="text-2xl font-bold text-emerald-500">
              {
                filteredDeployments.filter(
                  (d) => d.available_replicas === d.replicas && d.replicas > 0
                ).length
              }
            </div>
            <div className="text-xs text-slate-500">Healthy</div>
          </div>
          <div className="bg-white dark:bg-[#0F1115] border border-slate-200 dark:border-white/5 rounded-xl p-4">
            <div className="text-2xl font-bold text-amber-500">
              {
                filteredDeployments.filter(
                  (d) =>
                    d.available_replicas > 0 && d.available_replicas < d.replicas
                ).length
              }
            </div>
            <div className="text-xs text-slate-500">Degraded</div>
          </div>
          <div className="bg-white dark:bg-[#0F1115] border border-slate-200 dark:border-white/5 rounded-xl p-4">
            <div className="text-2xl font-bold text-blue-500">
              {filteredDeployments.reduce((sum, d) => sum + d.replicas, 0)}
            </div>
            <div className="text-xs text-slate-500">Total Replicas</div>
          </div>
        </div>
      )}

      {/* Deployments List */}
      <div className="space-y-4">
        {isLoading ? (
          // Loading skeletons
          Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="flex items-center gap-4">
                <Skeleton className="w-12 h-12 rounded-lg" />
                <div className="flex-1">
                  <Skeleton className="h-5 w-48 mb-2" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-10 w-24 rounded-lg" />
              </div>
            </Card>
          ))
        ) : filteredDeployments.length > 0 ? (
          filteredDeployments.map((deployment) => {
            const health = getHealthStatus(deployment);
            return (
              <Card
                key={`${deployment.namespace}/${deployment.name}`}
                className="group cursor-pointer hover:border-primary/30 dark:hover:border-white/10 transition-all"
                onClick={() => setSelectedDeployment(deployment)}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center ${health.bg}`}
                    >
                      {getHealthIcon(deployment)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-900 dark:text-white">
                          {deployment.name}
                        </h3>
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${health.bg} ${health.color} border ${health.border}`}
                        >
                          {health.status}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                        <span className="flex items-center gap-1">
                          <Layers size={12} /> {deployment.namespace}
                        </span>
                        <span className="flex items-center gap-1">
                          <Box size={12} /> {deployment.ready_replicas}/
                          {deployment.replicas} ready
                        </span>
                        <span className="flex items-center gap-1 font-mono truncate max-w-[200px]">
                          <Image size={12} />{" "}
                          {deployment.image.split("/").pop()?.split(":")[0]}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Replica Progress */}
                    <div className="hidden md:block w-32">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-500">Replicas</span>
                        <span className="text-slate-700 dark:text-slate-300">
                          {deployment.available_replicas}/{deployment.replicas}
                        </span>
                      </div>
                      <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            deployment.available_replicas === deployment.replicas
                              ? "bg-emerald-500"
                              : deployment.available_replicas > 0
                              ? "bg-amber-500"
                              : "bg-red-500"
                          }`}
                          style={{
                            width:
                              deployment.replicas > 0
                                ? `${
                                    (deployment.available_replicas /
                                      deployment.replicas) *
                                    100
                                  }%`
                                : "0%",
                          }}
                        />
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDeployment(deployment);
                        }}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors"
                        title="Scale"
                      >
                        <Scale size={16} className="text-slate-400" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDeployment(deployment);
                        }}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors"
                        title="Restart"
                      >
                        <RotateCcw size={16} className="text-slate-400" />
                      </button>
                      <ChevronRight
                        size={16}
                        className="text-slate-400 group-hover:text-primary transition-colors"
                      />
                    </div>
                  </div>
                </div>
              </Card>
            );
          })
        ) : (
          <div className="text-center py-12">
            <Server
              size={48}
              className="mx-auto text-slate-300 dark:text-slate-600 mb-4"
            />
            <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-2">
              No deployments found
            </h3>
            <p className="text-sm text-slate-500">
              {filterNamespace
                ? "Try selecting a different namespace"
                : "Connect to a Kubernetes cluster to see deployments"}
            </p>
          </div>
        )}
      </div>

      {/* Deployment Modal */}
      {selectedDeployment && (
        <DeploymentModal
          deployment={selectedDeployment}
          onClose={() => setSelectedDeployment(null)}
          onUpdate={fetchDeployments}
        />
      )}
    </div>
  );
};

export default DeploymentsView;

