/**
 * Deployment Management Modal
 *
 * Allows users to:
 * - Scale deployments
 * - Restart deployments
 * - View deployment details
 */

import React, { useState } from "react";
import {
  X,
  Server,
  Scale,
  RotateCcw,
  AlertCircle,
  CheckCircle,
  Loader2,
  Minus,
  Plus,
  Box,
  Layers,
  Image,
  Settings,
} from "lucide-react";
import { apiClient, DeploymentInfo } from "../../services/api";

interface DeploymentModalProps {
  deployment: DeploymentInfo;
  onClose: () => void;
  onUpdate?: () => void;
}

type OperationType = "scale" | "restart" | null;

export const DeploymentModal: React.FC<DeploymentModalProps> = ({
  deployment,
  onClose,
  onUpdate,
}) => {
  const [activeOperation, setActiveOperation] = useState<OperationType>(null);
  const [scaleValue, setScaleValue] = useState(deployment.replicas);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const handleScale = async () => {
    if (scaleValue === deployment.replicas) {
      setResult({ success: false, message: "No change in replica count" });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const response = await apiClient.scaleDeployment(
        deployment.namespace,
        deployment.name,
        scaleValue
      );

      setResult({
        success: response.success,
        message: response.message || `Scaled to ${scaleValue} replicas`,
      });

      if (response.success && onUpdate) {
        setTimeout(onUpdate, 1000);
      }
    } catch (err) {
      setResult({
        success: false,
        message: err instanceof Error ? err.message : "Failed to scale deployment",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestart = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      const response = await apiClient.restartDeployment(
        deployment.namespace,
        deployment.name
      );

      setResult({
        success: response.success,
        message: response.message || "Restart initiated",
      });

      if (response.success && onUpdate) {
        setTimeout(onUpdate, 1000);
      }
    } catch (err) {
      setResult({
        success: false,
        message: err instanceof Error ? err.message : "Failed to restart deployment",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getHealthStatus = () => {
    if (deployment.available_replicas === deployment.replicas) {
      return { status: "healthy", color: "text-emerald-500", bg: "bg-emerald-500/10" };
    }
    if (deployment.available_replicas > 0) {
      return { status: "degraded", color: "text-amber-500", bg: "bg-amber-500/10" };
    }
    return { status: "unhealthy", color: "text-red-500", bg: "bg-red-500/10" };
  };

  const health = getHealthStatus();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white dark:bg-[#0A0A0C] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-200 dark:border-white/5">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${health.bg}`}>
              <Server size={24} className={health.color} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                {deployment.name}
              </h2>
              <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
                <Layers size={12} />
                {deployment.namespace}
                <span className="text-slate-300 dark:text-slate-600">•</span>
                <span className={health.color}>{health.status}</span>
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

        {/* Deployment Info */}
        <div className="p-6 space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 text-center">
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {deployment.replicas}
              </div>
              <div className="text-xs text-slate-500">Desired</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 text-center">
              <div className="text-2xl font-bold text-emerald-500">
                {deployment.ready_replicas}
              </div>
              <div className="text-xs text-slate-500">Ready</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 text-center">
              <div className="text-2xl font-bold text-blue-500">
                {deployment.available_replicas}
              </div>
              <div className="text-xs text-slate-500">Available</div>
            </div>
          </div>

          {/* Image Info */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5">
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <Image size={12} />
              Container Image
            </div>
            <div className="font-mono text-sm text-slate-700 dark:text-slate-300 break-all">
              {deployment.image}
            </div>
          </div>

          {/* Strategy */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-white/5">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Settings size={14} />
              Update Strategy
            </div>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {deployment.strategy}
            </span>
          </div>

          {/* Operation Result */}
          {result && (
            <div
              className={`p-4 rounded-xl flex items-center gap-3 ${
                result.success
                  ? "bg-emerald-500/10 text-emerald-500"
                  : "bg-red-500/10 text-red-500"
              }`}
            >
              {result.success ? (
                <CheckCircle size={20} />
              ) : (
                <AlertCircle size={20} />
              )}
              <span className="text-sm">{result.message}</span>
            </div>
          )}

          {/* Scale Operation */}
          {activeOperation === "scale" && (
            <div className="p-4 rounded-xl border border-slate-200 dark:border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Scale Replicas
                </span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setScaleValue(Math.max(0, scaleValue - 1))}
                    className="p-2 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                    disabled={scaleValue <= 0}
                  >
                    <Minus size={16} className="text-slate-600 dark:text-slate-400" />
                  </button>
                  <input
                    type="number"
                    value={scaleValue}
                    onChange={(e) =>
                      setScaleValue(Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))
                    }
                    className="w-16 text-center text-lg font-bold bg-transparent border-none text-slate-900 dark:text-white focus:outline-none"
                    min={0}
                    max={100}
                  />
                  <button
                    onClick={() => setScaleValue(Math.min(100, scaleValue + 1))}
                    className="p-2 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                    disabled={scaleValue >= 100}
                  >
                    <Plus size={16} className="text-slate-600 dark:text-slate-400" />
                  </button>
                </div>
              </div>

              {scaleValue !== deployment.replicas && (
                <div className="text-xs text-slate-500">
                  {scaleValue > deployment.replicas
                    ? `Adding ${scaleValue - deployment.replicas} replica(s)`
                    : `Removing ${deployment.replicas - scaleValue} replica(s)`}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setActiveOperation(null);
                    setScaleValue(deployment.replicas);
                    setResult(null);
                  }}
                  className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleScale}
                  disabled={isLoading || scaleValue === deployment.replicas}
                  className="flex-1 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <>
                      <Scale size={16} />
                      Apply Scale
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Restart Operation */}
          {activeOperation === "restart" && (
            <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 space-y-4">
              <div className="flex items-start gap-3">
                <AlertCircle size={20} className="text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium text-slate-900 dark:text-white">
                    Restart Deployment?
                  </div>
                  <div className="text-sm text-slate-500 mt-1">
                    This will trigger a rolling restart of all pods. The deployment
                    will remain available during the restart.
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setActiveOperation(null);
                    setResult(null);
                  }}
                  className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRestart}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <>
                      <RotateCcw size={16} />
                      Confirm Restart
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {!activeOperation && (
          <div className="flex items-center justify-between p-4 border-t border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-black/20">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors"
            >
              Close
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setActiveOperation("scale");
                  setResult(null);
                }}
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors flex items-center gap-2"
              >
                <Scale size={14} />
                Scale
              </button>
              <button
                onClick={() => {
                  setActiveOperation("restart");
                  setResult(null);
                }}
                className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
              >
                <RotateCcw size={14} />
                Restart
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeploymentModal;

