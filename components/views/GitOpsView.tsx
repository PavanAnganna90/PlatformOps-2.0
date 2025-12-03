/**
 * GitOps View
 *
 * Displays ArgoCD applications with sync status and health.
 * Supports sync operations and application details.
 */

import React, { useState, useEffect, useCallback } from "react";
import { Card } from "../ui/Card";
import { Skeleton } from "../ui/Skeleton";
import {
  GitBranch,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  ExternalLink,
  FolderGit2,
  Layers,
  AlertTriangle,
  Pause,
  HelpCircle,
  Wifi,
  WifiOff,
  RotateCcw,
  Eye,
  ChevronRight,
  Server,
} from "lucide-react";
import {
  apiClient,
  ArgoApplication,
  ArgoApplicationsResponse,
} from "../../services/api";

type SyncStatus = "Synced" | "OutOfSync" | "Unknown";
type HealthStatus = "Healthy" | "Progressing" | "Degraded" | "Suspended" | "Missing" | "Unknown";

export const GitOpsView: React.FC = () => {
  const [applications, setApplications] = useState<ArgoApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [selectedApp, setSelectedApp] = useState<ArgoApplication | null>(null);
  const [filterProject, setFilterProject] = useState<string | null>(null);
  const [filterHealth, setFilterHealth] = useState<string | null>(null);

  const fetchApplications = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const available = await apiClient.checkBackendAvailable();
      setIsBackendConnected(available);

      if (available) {
        const response: ArgoApplicationsResponse =
          await apiClient.listArgoApplications(filterProject || undefined);
        setApplications(response.applications);
      } else {
        setApplications([]);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch applications"
      );
      setApplications([]);
    } finally {
      setIsLoading(false);
    }
  }, [filterProject]);

  useEffect(() => {
    fetchApplications();
    // Refresh every 30 seconds
    const interval = setInterval(fetchApplications, 30000);
    return () => clearInterval(interval);
  }, [fetchApplications]);

  const getSyncIcon = (status: SyncStatus) => {
    switch (status) {
      case "Synced":
        return <CheckCircle size={16} className="text-emerald-500" />;
      case "OutOfSync":
        return <AlertTriangle size={16} className="text-amber-500" />;
      default:
        return <HelpCircle size={16} className="text-slate-400" />;
    }
  };

  const getHealthIcon = (status: HealthStatus) => {
    switch (status) {
      case "Healthy":
        return <CheckCircle size={16} className="text-emerald-500" />;
      case "Progressing":
        return <Loader2 size={16} className="animate-spin text-blue-500" />;
      case "Degraded":
        return <XCircle size={16} className="text-red-500" />;
      case "Suspended":
        return <Pause size={16} className="text-amber-500" />;
      case "Missing":
        return <HelpCircle size={16} className="text-slate-400" />;
      default:
        return <HelpCircle size={16} className="text-slate-400" />;
    }
  };

  const getSyncColor = (status: SyncStatus) => {
    switch (status) {
      case "Synced":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      case "OutOfSync":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    }
  };

  const getHealthColor = (status: HealthStatus) => {
    switch (status) {
      case "Healthy":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      case "Progressing":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "Degraded":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      case "Suspended":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    }
  };

  const formatTimeAgo = (date?: string) => {
    if (!date) return "N/A";
    const now = new Date();
    const past = new Date(date);
    const diff = now.getTime() - past.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return "just now";
  };

  // Get unique projects and health statuses for filters
  const projects = [...new Set(applications.map((a) => a.project))];
  const healthStatuses = [...new Set(applications.map((a) => a.health_status))];

  // Filter applications
  const filteredApps = applications.filter((app) => {
    if (filterHealth && app.health_status !== filterHealth) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            GitOps Applications
          </h2>
          <div className="flex items-center gap-2 mt-1">
            {isBackendConnected ? (
              <span className="flex items-center gap-1 text-xs text-emerald-500">
                <Wifi size={12} /> Connected to ArgoCD
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs text-amber-500">
                <WifiOff size={12} /> Demo Mode
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Project Filter */}
          {projects.length > 1 && (
            <select
              value={filterProject || ""}
              onChange={(e) => setFilterProject(e.target.value || null)}
              className="px-3 py-2 rounded-lg bg-white dark:bg-[#0F1115] border border-slate-200 dark:border-white/10 text-sm text-slate-700 dark:text-slate-300"
            >
              <option value="">All Projects</option>
              {projects.map((project) => (
                <option key={project} value={project}>
                  {project}
                </option>
              ))}
            </select>
          )}

          {/* Health Filter */}
          <select
            value={filterHealth || ""}
            onChange={(e) => setFilterHealth(e.target.value || null)}
            className="px-3 py-2 rounded-lg bg-white dark:bg-[#0F1115] border border-slate-200 dark:border-white/10 text-sm text-slate-700 dark:text-slate-300"
          >
            <option value="">All Health</option>
            {healthStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>

          <button
            onClick={fetchApplications}
            disabled={isLoading}
            className="px-3 py-2 text-sm bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
            Refresh
          </button>

          <button className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 flex items-center gap-2">
            <RotateCcw size={16} /> Sync All
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
      {!isLoading && applications.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white dark:bg-[#0F1115] border border-slate-200 dark:border-white/5 rounded-xl p-4">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {applications.length}
            </div>
            <div className="text-xs text-slate-500">Total Apps</div>
          </div>
          <div className="bg-white dark:bg-[#0F1115] border border-slate-200 dark:border-white/5 rounded-xl p-4">
            <div className="text-2xl font-bold text-emerald-500">
              {applications.filter((a) => a.sync_status === "Synced").length}
            </div>
            <div className="text-xs text-slate-500">Synced</div>
          </div>
          <div className="bg-white dark:bg-[#0F1115] border border-slate-200 dark:border-white/5 rounded-xl p-4">
            <div className="text-2xl font-bold text-amber-500">
              {applications.filter((a) => a.sync_status === "OutOfSync").length}
            </div>
            <div className="text-xs text-slate-500">Out of Sync</div>
          </div>
          <div className="bg-white dark:bg-[#0F1115] border border-slate-200 dark:border-white/5 rounded-xl p-4">
            <div className="text-2xl font-bold text-emerald-500">
              {applications.filter((a) => a.health_status === "Healthy").length}
            </div>
            <div className="text-xs text-slate-500">Healthy</div>
          </div>
          <div className="bg-white dark:bg-[#0F1115] border border-slate-200 dark:border-white/5 rounded-xl p-4">
            <div className="text-2xl font-bold text-red-500">
              {applications.filter((a) => a.health_status === "Degraded").length}
            </div>
            <div className="text-xs text-slate-500">Degraded</div>
          </div>
        </div>
      )}

      {/* Applications Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          // Loading skeletons
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <Skeleton className="w-10 h-10 rounded-lg" />
                <div className="flex-1">
                  <Skeleton className="h-5 w-32 mb-2" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </Card>
          ))
        ) : filteredApps.length > 0 ? (
          filteredApps.map((app) => (
            <Card
              key={app.name}
              className="group cursor-pointer hover:border-primary/30 dark:hover:border-white/10 transition-all"
              onClick={() => setSelectedApp(app)}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${getHealthColor(
                      app.health_status
                    )}`}
                  >
                    {getHealthIcon(app.health_status)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">
                      {app.name}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Server size={10} />
                      {app.namespace}
                    </div>
                  </div>
                </div>
                <ChevronRight
                  size={16}
                  className="text-slate-400 group-hover:text-primary transition-colors"
                />
              </div>

              {/* Status Badges */}
              <div className="flex items-center gap-2 mb-4">
                <span
                  className={`px-2 py-1 rounded-md text-xs font-medium border ${getSyncColor(
                    app.sync_status
                  )}`}
                >
                  {getSyncIcon(app.sync_status)}
                  <span className="ml-1">{app.sync_status}</span>
                </span>
                <span
                  className={`px-2 py-1 rounded-md text-xs font-medium border ${getHealthColor(
                    app.health_status
                  )}`}
                >
                  {app.health_status}
                </span>
              </div>

              {/* Git Info */}
              <div className="space-y-2 text-xs text-slate-500 mb-4">
                <div className="flex items-center gap-2 truncate">
                  <FolderGit2 size={12} className="shrink-0" />
                  <span className="truncate" title={app.repo_url}>
                    {app.repo_url.replace("https://github.com/", "")}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <GitBranch size={12} />
                  {app.target_revision}
                </div>
                <div className="flex items-center gap-2">
                  <Layers size={12} />
                  {app.path}
                </div>
              </div>

              {/* Resources Progress */}
              <div className="mb-3">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-500">Resources</span>
                  <span className="text-slate-700 dark:text-slate-300">
                    {app.resources_synced}/{app.resources_total}
                  </span>
                </div>
                <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      app.resources_synced === app.resources_total
                        ? "bg-emerald-500"
                        : "bg-amber-500"
                    }`}
                    style={{
                      width: `${
                        app.resources_total > 0
                          ? (app.resources_synced / app.resources_total) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Clock size={10} />
                  {formatTimeAgo(app.sync_finished_at)}
                </span>
                <span className="text-slate-400">{app.project}</span>
              </div>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <FolderGit2
              size={48}
              className="mx-auto text-slate-300 dark:text-slate-600 mb-4"
            />
            <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-2">
              No applications found
            </h3>
            <p className="text-sm text-slate-500">
              {filterHealth
                ? "Try adjusting your filters"
                : "Configure ArgoCD to see GitOps applications"}
            </p>
          </div>
        )}
      </div>

      {/* Application Detail Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setSelectedApp(null)}
          />
          <div className="relative w-full max-w-2xl bg-white dark:bg-[#0A0A0C] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-start justify-between p-6 border-b border-slate-200 dark:border-white/5">
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center ${getHealthColor(
                    selectedApp.health_status
                  )}`}
                >
                  {getHealthIcon(selectedApp.health_status)}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                    {selectedApp.name}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${getSyncColor(
                        selectedApp.sync_status
                      )}`}
                    >
                      {selectedApp.sync_status}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${getHealthColor(
                        selectedApp.health_status
                      )}`}
                    >
                      {selectedApp.health_status}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedApp(null)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors"
              >
                <XCircle size={20} className="text-slate-400" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5">
                  <div className="text-xs text-slate-500 mb-1">Namespace</div>
                  <div className="font-medium text-slate-900 dark:text-white">
                    {selectedApp.namespace}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5">
                  <div className="text-xs text-slate-500 mb-1">Project</div>
                  <div className="font-medium text-slate-900 dark:text-white">
                    {selectedApp.project}
                  </div>
                </div>
                <div className="col-span-2 p-4 rounded-xl bg-slate-50 dark:bg-white/5">
                  <div className="text-xs text-slate-500 mb-1">Repository</div>
                  <div className="font-medium text-slate-900 dark:text-white font-mono text-sm break-all">
                    {selectedApp.repo_url}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5">
                  <div className="text-xs text-slate-500 mb-1">Path</div>
                  <div className="font-medium text-slate-900 dark:text-white font-mono">
                    {selectedApp.path}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5">
                  <div className="text-xs text-slate-500 mb-1">
                    Target Revision
                  </div>
                  <div className="font-medium text-slate-900 dark:text-white">
                    {selectedApp.target_revision}
                  </div>
                </div>
              </div>

              {/* Resources */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-500">Synced Resources</span>
                  <span className="font-medium text-slate-900 dark:text-white">
                    {selectedApp.resources_synced} / {selectedApp.resources_total}
                  </span>
                </div>
                <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      selectedApp.resources_synced === selectedApp.resources_total
                        ? "bg-emerald-500"
                        : "bg-amber-500"
                    }`}
                    style={{
                      width: `${
                        selectedApp.resources_total > 0
                          ? (selectedApp.resources_synced /
                              selectedApp.resources_total) *
                            100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              {/* Sync Times */}
              <div className="flex justify-between text-sm text-slate-500">
                <div>
                  <span className="text-slate-400">Last Sync Started:</span>{" "}
                  {selectedApp.sync_started_at
                    ? new Date(selectedApp.sync_started_at).toLocaleString()
                    : "N/A"}
                </div>
                <div>
                  <span className="text-slate-400">Finished:</span>{" "}
                  {selectedApp.sync_finished_at
                    ? new Date(selectedApp.sync_finished_at).toLocaleString()
                    : "N/A"}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between p-4 border-t border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-black/20">
              <button
                onClick={() => setSelectedApp(null)}
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors"
              >
                Close
              </button>
              <div className="flex items-center gap-2">
                <button className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors flex items-center gap-2">
                  <Eye size={14} />
                  View Diff
                </button>
                <button className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 flex items-center gap-2">
                  <RotateCcw size={14} />
                  Sync Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GitOpsView;

