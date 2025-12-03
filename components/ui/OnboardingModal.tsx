/**
 * Onboarding Modal
 *
 * Welcome flow for first-time users.
 * Guides them through initial setup.
 */

import React, { useState } from "react";
import {
  X,
  CheckCircle,
  ArrowRight,
  Cloud,
  GitBranch,
  Activity,
  Settings,
  Sparkles,
  Rocket,
} from "lucide-react";
import { SettingsModal } from "./SettingsModal";

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: () => void;
}

type Step = "welcome" | "setup" | "complete";

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onComplete,
}) => {
  const [currentStep, setCurrentStep] = useState<Step>("welcome");
  const [showSettings, setShowSettings] = useState(false);

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentStep === "welcome") {
      setCurrentStep("setup");
    } else if (currentStep === "setup") {
      setCurrentStep("complete");
    }
  };

  const handleComplete = () => {
    // Mark onboarding as complete in localStorage
    localStorage.setItem("opssight_onboarding_complete", "true");
    onComplete();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

        {/* Modal */}
        <div className="relative w-full max-w-2xl bg-white dark:bg-[#0A0A0C] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden">
          {/* Step 1: Welcome */}
          {currentStep === "welcome" && (
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-primary to-accent rounded-xl">
                    <Sparkles size={24} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                      Welcome to OpsSight
                    </h2>
                    <p className="text-sm text-slate-500">Your DevOps Visibility Platform</p>
                  </div>
                </div>
                <button
                  onClick={handleComplete}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors"
                >
                  <X size={20} className="text-slate-400" />
                </button>
              </div>

              <div className="space-y-4 mb-8">
                <p className="text-slate-600 dark:text-slate-400">
                  OpsSight provides unified visibility across your entire infrastructure. Let's get you set up!
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-xl">
                    <Cloud size={24} className="text-primary mb-2" />
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                      Cloud Providers
                    </h3>
                    <p className="text-xs text-slate-500">
                      Connect AWS, GCP, or Azure
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-xl">
                    <GitBranch size={24} className="text-primary mb-2" />
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                      CI/CD & GitOps
                    </h3>
                    <p className="text-xs text-slate-500">
                      Track pipelines and deployments
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-xl">
                    <Activity size={24} className="text-primary mb-2" />
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                      Monitoring
                    </h3>
                    <p className="text-xs text-slate-500">
                      Prometheus, Datadog, and more
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <button
                  onClick={handleComplete}
                  className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                >
                  Skip for now
                </button>
                <button
                  onClick={handleNext}
                  className="px-6 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
                >
                  Get Started
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Setup */}
          {currentStep === "setup" && (
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                    Configure Integrations
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Connect your cloud providers and services
                  </p>
                </div>
                <button
                  onClick={handleComplete}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors"
                >
                  <X size={20} className="text-slate-400" />
                </button>
              </div>

              <div className="space-y-4 mb-8">
                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                  <div className="flex items-start gap-3">
                    <Settings size={20} className="text-blue-500 shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-slate-900 dark:text-white mb-1">
                        Quick Setup
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Configure your credentials in one place. You can always access settings from the header.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border border-slate-200 dark:border-white/10 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <Cloud size={18} className="text-primary" />
                      <h3 className="font-semibold text-slate-900 dark:text-white">
                        Cloud Providers
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500 mb-3">
                      AWS, GCP, Azure credentials
                    </p>
                    <button
                      onClick={() => setShowSettings(true)}
                      className="text-xs text-primary hover:underline"
                    >
                      Configure →
                    </button>
                  </div>

                  <div className="p-4 border border-slate-200 dark:border-white/10 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <GitBranch size={18} className="text-primary" />
                      <h3 className="font-semibold text-slate-900 dark:text-white">
                        CI/CD & GitOps
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500 mb-3">
                      GitHub Actions, ArgoCD
                    </p>
                    <button
                      onClick={() => setShowSettings(true)}
                      className="text-xs text-primary hover:underline"
                    >
                      Configure →
                    </button>
                  </div>

                  <div className="p-4 border border-slate-200 dark:border-white/10 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity size={18} className="text-primary" />
                      <h3 className="font-semibold text-slate-900 dark:text-white">
                        Monitoring
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500 mb-3">
                      Prometheus, Datadog
                    </p>
                    <button
                      onClick={() => setShowSettings(true)}
                      className="text-xs text-primary hover:underline"
                    >
                      Configure →
                    </button>
                  </div>

                  <div className="p-4 border border-slate-200 dark:border-white/10 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <Rocket size={18} className="text-primary" />
                      <h3 className="font-semibold text-slate-900 dark:text-white">
                        Infrastructure
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500 mb-3">
                      Terraform Cloud
                    </p>
                    <button
                      onClick={() => setShowSettings(true)}
                      className="text-xs text-primary hover:underline"
                    >
                      Configure →
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-xl">
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    <strong className="text-slate-900 dark:text-white">Note:</strong> For local development, add credentials to your <code className="px-1 py-0.5 bg-slate-200 dark:bg-white/10 rounded">.env</code> file. In production, credentials are stored securely in Supabase.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <button
                  onClick={() => setCurrentStep("welcome")}
                  className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                >
                  ← Back
                </button>
                <button
                  onClick={handleNext}
                  className="px-6 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
                >
                  Continue
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Complete */}
          {currentStep === "complete" && (
            <div className="p-8 text-center">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <CheckCircle size={40} className="text-emerald-500" />
                </div>
              </div>

              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                You're All Set!
              </h2>
              <p className="text-slate-600 dark:text-slate-400 mb-8">
                Start exploring your infrastructure. You can configure integrations anytime from Settings.
              </p>

              <button
                onClick={handleComplete}
                className="px-6 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
              >
                Start Using OpsSight
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          onSave={() => {
            setShowSettings(false);
            // Optionally move to next step
          }}
        />
      )}
    </>
  );
};

export default OnboardingModal;

