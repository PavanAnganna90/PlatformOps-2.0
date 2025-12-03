/**
 * Pod Detail Modal
 *
 * Shows detailed information about a pod including:
 * - Container status
 * - Resource usage
 * - Events
 * - Labels and annotations
 */

import React, { useState } from "react";
import {
  X,
  Box,
  Cpu,
  Activity,
  Clock,
  Tag,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Copy,
  ExternalLink,
  Server,
  Layers,
} from "lucide-react";
import { InfrastructureNode, Status } from "../../types";

interface PodDetailModalProps {
  /**
   * The pod/resource to display
   */
  resource: InfrastructureNode;

  /**
   * Callback to close the modal
   */
  onClose: () => void;
}

export const PodDetailModal: React.FC<PodDetailModalProps> = ({
  resource,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<"overview" | "labels" | "events">(
    "overview"
  );
  const [copied, setCopied] = useState(false);

  const handleCopyName = () => {
    navigator.clipboard.writeText(resource.name);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusColor = (status: Status) => {
    switch (status) {
      case Status.HEALTHY:
        return "text-emerald-500 bg-emerald-500/10";
      case Status.WARNING:
        return "text-amber-500 bg-amber-500/10";
      case Status.ERROR:
        return "text-red-500 bg-red-500/10";
      case Status.PENDING:
        return "text-blue-500 bg-blue-500/10";
      default:
        return "text-slate-500 bg-slate-500/10";
    }
  };

  const getStatusIcon = (status: Status) => {
    switch (status) {
      case Status.HEALTHY:
        return <CheckCircle size={16} />;
      case Status.WARNING:
      case Status.ERROR:
        return <AlertCircle size={16} />;
      default:
        return <Clock size={16} />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="
          relative w-full max-w-2xl max-h-[90vh]
          bg-white dark:bg-[#0A0A0C]
          border border-slate-200 dark:border-white/10
          rounded-2xl shadow-2xl
          overflow-hidden
          animate-in fade-in zoom-in-95 duration-200
        "
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-200 dark:border-white/5">
          <div className="flex items-start gap-4">
            <div
              className={`
                p-3 rounded-xl
                ${getStatusColor(resource.status)}
              `}
            >
              <Box size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  {resource.name}
                </h2>
                <button
                  onClick={handleCopyName}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-white/5 rounded transition-colors"
                  title="Copy name"
                >
                  {copied ? (
                    <CheckCircle size={14} className="text-emerald-500" />
                  ) : (
                    <Copy size={14} className="text-slate-400" />
                  )}
                </button>
              </div>
              <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
                <span className="uppercase text-xs tracking-wider">
                  {resource.type.replace("_", " ")}
                </span>
                <span>•</span>
                <span
                  className={`flex items-center gap-1 ${
                    resource.status === Status.HEALTHY
                      ? "text-emerald-500"
                      : resource.status === Status.WARNING
                      ? "text-amber-500"
                      : resource.status === Status.ERROR
                      ? "text-red-500"
                      : "text-slate-500"
                  }`}
                >
                  {getStatusIcon(resource.status)}
                  {resource.status}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors"
          >
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-white/5 px-6">
          {(["overview", "labels", "events"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`
                px-4 py-3 text-sm font-medium capitalize
                border-b-2 -mb-px transition-colors
                ${
                  activeTab === tab
                    ? "border-primary text-primary"
                    : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                }
              `}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Resource Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5">
                  <div className="flex items-center gap-2 text-slate-500 mb-2">
                    <Cpu size={14} />
                    <span className="text-xs uppercase tracking-wider">
                      CPU Usage
                    </span>
                  </div>
                  <div className="flex items-end gap-2">
                    <span className="text-2xl font-bold text-slate-900 dark:text-white">
                      {resource.metrics.cpu.toFixed(0)}%
                    </span>
                  </div>
                  <div className="mt-2 h-2 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        resource.metrics.cpu > 80
                          ? "bg-red-500"
                          : resource.metrics.cpu > 60
                          ? "bg-amber-500"
                          : "bg-primary"
                      }`}
                      style={{ width: `${Math.min(resource.metrics.cpu, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5">
                  <div className="flex items-center gap-2 text-slate-500 mb-2">
                    <Activity size={14} />
                    <span className="text-xs uppercase tracking-wider">
                      Memory Usage
                    </span>
                  </div>
                  <div className="flex items-end gap-2">
                    <span className="text-2xl font-bold text-slate-900 dark:text-white">
                      {resource.metrics.memory.toFixed(0)}%
                    </span>
                  </div>
                  <div className="mt-2 h-2 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        resource.metrics.memory > 80
                          ? "bg-red-500"
                          : resource.metrics.memory > 60
                          ? "bg-amber-500"
                          : "bg-accent"
                      }`}
                      style={{
                        width: `${Math.min(resource.metrics.memory, 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                {resource.region && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-white/5">
                    <Server size={16} className="text-slate-400" />
                    <div>
                      <div className="text-xs text-slate-500 uppercase tracking-wider">
                        Node
                      </div>
                      <div className="text-sm font-medium text-slate-900 dark:text-white truncate">
                        {resource.region}
                      </div>
                    </div>
                  </div>
                )}

                {resource.uptime && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-white/5">
                    <Clock size={16} className="text-slate-400" />
                    <div>
                      <div className="text-xs text-slate-500 uppercase tracking-wider">
                        Uptime
                      </div>
                      <div className="text-sm font-medium text-slate-900 dark:text-white">
                        {resource.uptime}
                      </div>
                    </div>
                  </div>
                )}

                {resource.description && (
                  <div className="col-span-2 flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-white/5">
                    <Layers size={16} className="text-slate-400 mt-0.5" />
                    <div>
                      <div className="text-xs text-slate-500 uppercase tracking-wider">
                        Description
                      </div>
                      <div className="text-sm text-slate-700 dark:text-slate-300">
                        {resource.description}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "labels" && (
            <div className="space-y-4">
              {resource.tags && resource.tags.length > 0 ? (
                <div className="space-y-2">
                  {resource.tags.map((tag, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 p-3 rounded-lg bg-slate-50 dark:bg-white/5"
                    >
                      <Tag size={14} className="text-primary shrink-0" />
                      <span className="text-sm font-mono text-slate-700 dark:text-slate-300 break-all">
                        {tag}
                      </span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(tag);
                        }}
                        className="ml-auto p-1 hover:bg-slate-200 dark:hover:bg-white/10 rounded transition-colors shrink-0"
                      >
                        <Copy size={12} className="text-slate-400" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  No labels available
                </div>
              )}
            </div>
          )}

          {activeTab === "events" && (
            <div className="space-y-4">
              <div className="text-center py-8 text-slate-500">
                <AlertCircle size={24} className="mx-auto mb-2 opacity-50" />
                <p>Events not yet implemented</p>
                <p className="text-xs mt-1">
                  Coming soon: Real-time pod events from Kubernetes API
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-black/20">
          <div className="text-xs text-slate-400">
            ID: {resource.id}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PodDetailModal;

