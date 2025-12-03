/**
 * Namespace Filter Component
 *
 * Dropdown to filter resources by Kubernetes namespace.
 * Shows namespace list with pod counts.
 */

import React, { useState, useRef, useEffect } from "react";
import {
  ChevronDown,
  Layers,
  Check,
  Loader2,
  RefreshCw,
  X,
} from "lucide-react";
import { useNamespaces } from "../../hooks/useKubernetes";

interface NamespaceFilterProps {
  /**
   * Currently selected namespace (null = all namespaces)
   */
  selectedNamespace: string | null;

  /**
   * Callback when namespace selection changes
   */
  onNamespaceChange: (namespace: string | null) => void;

  /**
   * Additional CSS classes
   */
  className?: string;
}

export const NamespaceFilter: React.FC<NamespaceFilterProps> = ({
  selectedNamespace,
  onNamespaceChange,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: namespaces, isLoading, refetch, isBackendConnected } = useNamespaces();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedNs = namespaces.find((ns) => ns.name === selectedNamespace);
  const totalPods = namespaces.reduce((sum, ns) => sum + ns.pod_count, 0);

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className={`
          flex items-center gap-2 px-3 py-2 rounded-lg
          bg-white dark:bg-[#0F1115] 
          border border-slate-200 dark:border-white/10
          hover:border-primary/30 dark:hover:border-white/20
          transition-all duration-200
          text-sm
          ${isOpen ? "ring-2 ring-primary/20" : ""}
        `}
      >
        {isLoading ? (
          <Loader2 size={14} className="animate-spin text-slate-400" />
        ) : (
          <>
            <Layers size={14} className="text-primary" />
            <span className="text-slate-700 dark:text-slate-300">
              {selectedNamespace || "All Namespaces"}
            </span>
            {selectedNamespace && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
                {selectedNs?.pod_count || 0} pods
              </span>
            )}
            <ChevronDown
              size={14}
              className={`text-slate-400 transition-transform ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="
          absolute top-full left-0 mt-2 w-64 z-50
          bg-white dark:bg-[#0F1115]
          border border-slate-200 dark:border-white/10
          rounded-xl shadow-xl dark:shadow-2xl
          overflow-hidden
          animate-in fade-in slide-in-from-top-2 duration-200
        "
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Namespaces
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400">
                {namespaces.length} total
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  refetch();
                }}
                className="p-1 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors"
                title="Refresh namespaces"
              >
                <RefreshCw
                  size={12}
                  className={`text-slate-400 ${isLoading ? "animate-spin" : ""}`}
                />
              </button>
            </div>
          </div>

          {/* All Namespaces Option */}
          <button
            onClick={() => {
              onNamespaceChange(null);
              setIsOpen(false);
            }}
            className={`
              w-full px-4 py-2.5 flex items-center gap-3
              hover:bg-slate-50 dark:hover:bg-white/5
              transition-colors text-left
              ${selectedNamespace === null ? "bg-primary/5 dark:bg-primary/10" : ""}
            `}
          >
            <div className="w-6 h-6 rounded-md flex items-center justify-center bg-slate-100 dark:bg-white/5">
              <Layers size={14} className="text-slate-500" />
            </div>
            <div className="flex-1">
              <span className="text-sm font-medium text-slate-900 dark:text-white">
                All Namespaces
              </span>
              <span className="text-[10px] text-slate-400 ml-2">
                {totalPods} pods
              </span>
            </div>
            {selectedNamespace === null && (
              <Check size={14} className="text-primary" />
            )}
          </button>

          {/* Namespace List */}
          <div className="max-h-64 overflow-y-auto border-t border-slate-100 dark:border-white/5">
            {namespaces.length === 0 && !isLoading && (
              <div className="px-4 py-6 text-center text-slate-500 text-sm">
                No namespaces found
              </div>
            )}

            {namespaces.map((ns) => (
              <button
                key={ns.name}
                onClick={() => {
                  onNamespaceChange(ns.name);
                  setIsOpen(false);
                }}
                className={`
                  w-full px-4 py-2.5 flex items-center gap-3
                  hover:bg-slate-50 dark:hover:bg-white/5
                  transition-colors text-left
                  ${ns.name === selectedNamespace ? "bg-primary/5 dark:bg-primary/10" : ""}
                `}
              >
                <div
                  className={`
                  w-6 h-6 rounded-md flex items-center justify-center
                  ${
                    ns.status === "healthy"
                      ? "bg-emerald-500/10 text-emerald-500"
                      : ns.status === "warning"
                      ? "bg-amber-500/10 text-amber-500"
                      : "bg-slate-100 dark:bg-white/5 text-slate-400"
                  }
                `}
                >
                  <Layers size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-slate-900 dark:text-white truncate block">
                    {ns.name}
                  </span>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400">
                    <span>{ns.pod_count} pods</span>
                    {ns.deployment_count > 0 && (
                      <span>• {ns.deployment_count} deploys</span>
                    )}
                  </div>
                </div>
                {ns.name === selectedNamespace && (
                  <Check size={14} className="text-primary shrink-0" />
                )}
              </button>
            ))}
          </div>

          {/* Clear Selection */}
          {selectedNamespace && (
            <div className="px-3 py-2 border-t border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-black/20">
              <button
                onClick={() => {
                  onNamespaceChange(null);
                  setIsOpen(false);
                }}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-primary transition-colors"
              >
                <X size={12} />
                Clear filter
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NamespaceFilter;

