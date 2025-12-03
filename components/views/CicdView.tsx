/**
 * CI/CD Pipelines View
 *
 * Displays GitHub Actions workflow runs with real-time status.
 * Falls back to demo data when backend is not available.
 */

import React, { useState, useEffect, useCallback } from "react";
import { Card } from "../ui/Card";
import { StatusBadge } from "../ui/StatusBadge";
import { Skeleton } from "../ui/Skeleton";
import {
  GitBranch,
  GitCommit,
  Play,
  RefreshCw,
  Box,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  ExternalLink,
  User,
  Calendar,
  Wifi,
  WifiOff,
  Settings,
  ChevronDown,
} from "lucide-react";
import { Status } from "../../types";
import { storage } from "../../services/storage";
import {
  apiClient,
  WorkflowRun,
  WorkflowRunsResponse,
} from "../../services/api";

// Repository configuration
interface RepoConfig {
  owner: string;
  repo: string;
  label: string;
}

const DEFAULT_REPOS: RepoConfig[] = [
  { owner: "PavanAnganna90", repo: "PlatformOps-2.0", label: "OpsSight" },
];

export const CicdView: React.FC = () => {
  const [workflowRuns, setWorkflowRuns] = useState<WorkflowRun[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState<RepoConfig>(DEFAULT_REPOS[0]);
  const [showRepoSelector, setShowRepoSelector] = useState(false);
  const [filterBranch, setFilterBranch] = useState<string | null>(null);

  // Legacy pipelines for fallback
  const legacyPipelines = storage.getPipelines();

  const fetchWorkflows = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const available = await apiClient.checkBackendAvailable();
      setIsBackendConnected(available);

      if (available) {
        const response: WorkflowRunsResponse = await apiClient.listWorkflowRuns(
          selectedRepo.owner,
          selectedRepo.repo,
          { branch: filterBranch || undefined, perPage: 15 }
        );
        setWorkflowRuns(response.runs);
      } else {
        // Use demo data
        setWorkflowRuns([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch workflows");
      setWorkflowRuns([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedRepo, filterBranch]);

  useEffect(() => {
    fetchWorkflows();
    // Refresh every 30 seconds
    const interval = setInterval(fetchWorkflows, 30000);
    return () => clearInterval(interval);
  }, [fetchWorkflows]);

  const getStatusIcon = (status: string, conclusion?: string) => {
    if (status === "in_progress" || status === "queued") {
      return <Loader2 size={16} className="animate-spin text-blue-500" />;
    }
    if (conclusion === "success") {
      return <CheckCircle size={16} className="text-emerald-500" />;
    }
    if (conclusion === "failure") {
      return <XCircle size={16} className="text-red-500" />;
    }
    if (conclusion === "cancelled") {
      return <XCircle size={16} className="text-slate-500" />;
    }
    return <Clock size={16} className="text-slate-400" />;
  };

  const getStatusColor = (status: string, conclusion?: string) => {
    if (status === "in_progress") return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    if (status === "queued") return "bg-amber-500/10 text-amber-500 border-amber-500/20";
    if (conclusion === "success") return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
    if (conclusion === "failure") return "bg-red-500/10 text-red-500 border-red-500/20";
    if (conclusion === "cancelled") return "bg-slate-500/10 text-slate-500 border-slate-500/20";
    return "bg-slate-500/10 text-slate-400 border-slate-500/20";
  };

  const formatDuration = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diff = endDate.getTime() - startDate.getTime();
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  const formatTimeAgo = (date: string) => {
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

  // Get unique branches from runs
  const branches = [...new Set(workflowRuns.map((r) => r.head_branch))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            CI/CD Pipelines
          </h2>
          <div className="flex items-center gap-2 mt-1">
            {isBackendConnected ? (
              <span className="flex items-center gap-1 text-xs text-emerald-500">
                <Wifi size={12} /> Live from GitHub Actions
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs text-amber-500">
                <WifiOff size={12} /> Demo Mode
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Repository Selector */}
          <div className="relative">
            <button
              onClick={() => setShowRepoSelector(!showRepoSelector)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white dark:bg-[#0F1115] border border-slate-200 dark:border-white/10 text-sm"
            >
              <Settings size={14} className="text-slate-400" />
              <span className="text-slate-700 dark:text-slate-300">
                {selectedRepo.label}
              </span>
              <ChevronDown size={14} className="text-slate-400" />
            </button>

            {showRepoSelector && (
              <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-[#0F1115] border border-slate-200 dark:border-white/10 rounded-xl shadow-xl z-50">
                <div className="p-2">
                  {DEFAULT_REPOS.map((repo) => (
                    <button
                      key={`${repo.owner}/${repo.repo}`}
                      onClick={() => {
                        setSelectedRepo(repo);
                        setShowRepoSelector(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        selectedRepo.repo === repo.repo
                          ? "bg-primary/10 text-primary"
                          : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5"
                      }`}
                    >
                      <div className="font-medium">{repo.label}</div>
                      <div className="text-xs text-slate-500">
                        {repo.owner}/{repo.repo}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Branch Filter */}
          {branches.length > 0 && (
            <select
              value={filterBranch || ""}
              onChange={(e) => setFilterBranch(e.target.value || null)}
              className="px-3 py-2 rounded-lg bg-white dark:bg-[#0F1115] border border-slate-200 dark:border-white/10 text-sm text-slate-700 dark:text-slate-300"
            >
              <option value="">All branches</option>
              {branches.map((branch) => (
                <option key={branch} value={branch}>
                  {branch}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={fetchWorkflows}
            disabled={isLoading}
            className="px-3 py-2 text-sm bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
            Refresh
          </button>

          <button className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 flex items-center gap-2">
            <Play size={16} /> Trigger Run
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
      {!isLoading && workflowRuns.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-[#0F1115] border border-slate-200 dark:border-white/5 rounded-xl p-4">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {workflowRuns.length}
            </div>
            <div className="text-xs text-slate-500">Total Runs</div>
          </div>
          <div className="bg-white dark:bg-[#0F1115] border border-slate-200 dark:border-white/5 rounded-xl p-4">
            <div className="text-2xl font-bold text-emerald-500">
              {workflowRuns.filter((r) => r.conclusion === "success").length}
            </div>
            <div className="text-xs text-slate-500">Successful</div>
          </div>
          <div className="bg-white dark:bg-[#0F1115] border border-slate-200 dark:border-white/5 rounded-xl p-4">
            <div className="text-2xl font-bold text-red-500">
              {workflowRuns.filter((r) => r.conclusion === "failure").length}
            </div>
            <div className="text-xs text-slate-500">Failed</div>
          </div>
          <div className="bg-white dark:bg-[#0F1115] border border-slate-200 dark:border-white/5 rounded-xl p-4">
            <div className="text-2xl font-bold text-blue-500">
              {workflowRuns.filter((r) => r.status === "in_progress").length}
            </div>
            <div className="text-xs text-slate-500">In Progress</div>
          </div>
        </div>
      )}

      {/* Workflow Runs List */}
      <div className="space-y-4">
        {isLoading ? (
          // Loading skeletons
          Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="flex items-center gap-4">
                <Skeleton className="w-10 h-10 rounded-lg" />
                <div className="flex-1">
                  <Skeleton className="h-5 w-48 mb-2" />
                  <Skeleton className="h-4 w-64" />
                </div>
                <Skeleton className="h-8 w-24 rounded-full" />
              </div>
            </Card>
          ))
        ) : workflowRuns.length > 0 ? (
          // Real workflow runs from GitHub
          workflowRuns.map((run) => (
            <Card
              key={run.id}
              className="group hover:border-primary/30 dark:hover:border-white/10 transition-all"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${getStatusColor(
                      run.status,
                      run.conclusion || undefined
                    )}`}
                  >
                    {getStatusIcon(run.status, run.conclusion || undefined)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-900 dark:text-white">
                        {run.name}
                      </h3>
                      <span className="text-xs text-slate-400">#{run.run_number}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                      <span className="flex items-center gap-1">
                        <GitBranch size={12} /> {run.head_branch}
                      </span>
                      <span className="flex items-center gap-1 font-mono">
                        <GitCommit size={12} /> {run.head_sha}
                      </span>
                      <span className="flex items-center gap-1">
                        <User size={12} /> {run.actor}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar size={12} /> {formatTimeAgo(run.created_at)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right hidden md:block">
                    <div className="text-xs text-slate-500">Event</div>
                    <div className="text-sm text-slate-700 dark:text-slate-300 capitalize">
                      {run.event.replace("_", " ")}
                    </div>
                  </div>
                  <div className="text-right hidden md:block">
                    <div className="text-xs text-slate-500">Duration</div>
                    <div className="text-sm font-mono text-slate-700 dark:text-slate-300">
                      {run.status === "completed"
                        ? formatDuration(run.created_at, run.updated_at)
                        : "Running..."}
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                      run.status,
                      run.conclusion || undefined
                    )}`}
                  >
                    {run.conclusion || run.status}
                  </span>
                  <a
                    href={run.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors"
                    title="View on GitHub"
                  >
                    <ExternalLink size={16} className="text-slate-400" />
                  </a>
                </div>
              </div>
            </Card>
          ))
        ) : (
          // Fallback to legacy pipelines
          legacyPipelines.map((pipeline) => (
            <Card
              key={pipeline.id}
              className="group hover:border-primary/30 dark:hover:border-white/10 transition-all"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center
                    ${
                      pipeline.status === Status.SUCCESS
                        ? "bg-emerald-500/20 text-emerald-500"
                        : pipeline.status === Status.FAILED
                        ? "bg-red-500/20 text-red-500"
                        : "bg-primary/20 text-primary animate-pulse"
                    }`}
                  >
                    <Box size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-lg">
                      {pipeline.name}
                    </h3>
                    <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
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
                    <div className="text-sm font-mono text-slate-700 dark:text-slate-300">
                      {pipeline.duration}
                    </div>
                  </div>
                  <StatusBadge status={pipeline.status} />
                </div>
              </div>

              {/* Visual Pipeline Stages */}
              <div className="relative pt-4">
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-200 dark:bg-slate-800 -translate-y-1/2 z-0"></div>
                <div className="relative z-10 flex justify-between gap-2">
                  {pipeline.stages.map((stage, idx) => (
                    <div key={idx} className="flex flex-col items-center flex-1">
                      <div
                        className={`
                        w-8 h-8 rounded-full flex items-center justify-center border-4 border-white dark:border-slate-950 shadow-lg mb-2 transition-transform hover:scale-110
                        ${
                          stage.status === Status.SUCCESS
                            ? "bg-emerald-500 text-white"
                            : stage.status === Status.FAILED
                            ? "bg-red-500 text-white"
                            : stage.status === Status.RUNNING
                            ? "bg-primary text-white"
                            : "bg-slate-300 dark:bg-slate-700 text-slate-500"
                        }
                      `}
                      >
                        {stage.status === Status.RUNNING ? (
                          <RefreshCw size={14} className="animate-spin" />
                        ) : (
                          <div className="w-2.5 h-2.5 rounded-full bg-current" />
                        )}
                      </div>
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        {stage.name}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono mt-0.5">
                        {stage.duration}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Empty State */}
      {!isLoading && workflowRuns.length === 0 && legacyPipelines.length === 0 && (
        <div className="text-center py-12">
          <Box
            size={48}
            className="mx-auto text-slate-300 dark:text-slate-600 mb-4"
          />
          <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-2">
            No workflow runs found
          </h3>
          <p className="text-sm text-slate-500">
            Configure a GitHub repository to see CI/CD pipeline runs
          </p>
        </div>
      )}
    </div>
  );
};

export default CicdView;
