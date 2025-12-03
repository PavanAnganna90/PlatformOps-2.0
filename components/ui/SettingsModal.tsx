/**
 * Settings Modal
 *
 * Centralized configuration for all integrations.
 * Users can configure credentials for:
 * - Cloud Providers (AWS, GCP, Azure)
 * - CI/CD (GitHub Actions, ArgoCD)
 * - Monitoring (Prometheus, Datadog)
 * - Infrastructure (Terraform Cloud)
 */

import React, { useState, useEffect } from "react";
import {
  X,
  Save,
  CheckCircle,
  XCircle,
  Loader2,
  Eye,
  EyeOff,
  Cloud,
  GitBranch,
  Activity,
  Settings as SettingsIcon,
  AlertCircle,
  Info,
} from "lucide-react";
import { apiClient } from "../../services/api";
import { Card } from "./Card";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
}

type TabType = "cloud" | "integrations" | "overview";

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

  // Cloud Credentials
  const [awsAccessKey, setAwsAccessKey] = useState("");
  const [awsSecretKey, setAwsSecretKey] = useState("");
  const [awsRegion, setAwsRegion] = useState("us-east-1");
  const [gcpProjectId, setGcpProjectId] = useState("");
  const [gcpCredentialsPath, setGcpCredentialsPath] = useState("");
  const [azureSubscriptionId, setAzureSubscriptionId] = useState("");
  const [azureClientId, setAzureClientId] = useState("");
  const [azureClientSecret, setAzureClientSecret] = useState("");
  const [azureTenantId, setAzureTenantId] = useState("");

  // Integration Credentials
  const [githubToken, setGithubToken] = useState("");
  const [githubOrg, setGithubOrg] = useState("");
  const [argocdUrl, setArgocdUrl] = useState("");
  const [argocdToken, setArgocdToken] = useState("");
  const [prometheusUrl, setPrometheusUrl] = useState("");
  const [datadogApiKey, setDatadogApiKey] = useState("");
  const [datadogAppKey, setDatadogAppKey] = useState("");
  const [datadogSite, setDatadogSite] = useState("datadoghq.com");
  const [tfcToken, setTfcToken] = useState("");
  const [tfcOrg, setTfcOrg] = useState("");

  // Integration Status
  const [integrationStatus, setIntegrationStatus] = useState<Record<string, boolean>>({});
  const [totalConfigured, setTotalConfigured] = useState(0);

  useEffect(() => {
    if (isOpen) {
      loadStatus();
      loadCredentials();
    }
  }, [isOpen]);

  const loadStatus = async () => {
    setIsLoading(true);
    try {
      const status = await apiClient.getIntegrationStatus();
      setIntegrationStatus(status.integrations);
      setTotalConfigured(status.total_configured);
    } catch (err) {
      console.error("Failed to load integration status:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCredentials = async () => {
    try {
      const creds = await apiClient.getCredentialsStatus();
      // Pre-fill forms with existing values (masked)
      if (creds.cloud?.aws?.configured) {
        setAwsRegion(creds.cloud.aws.region || "us-east-1");
      }
      if (creds.cloud?.gcp?.project_id) {
        setGcpProjectId(creds.cloud.gcp.project_id);
      }
      if (creds.integrations?.argocd?.url) {
        setArgocdUrl(creds.integrations.argocd.url);
      }
      if (creds.integrations?.prometheus?.url) {
        setPrometheusUrl(creds.integrations.prometheus.url);
      }
      if (creds.integrations?.terraform_cloud?.org) {
        setTfcOrg(creds.integrations.terraform_cloud.org);
      }
    } catch (err) {
      console.error("Failed to load credentials:", err);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);

    try {
      const response = await apiClient.saveCredentials({
        cloud: {
          aws_access_key_id: awsAccessKey || undefined,
          aws_secret_access_key: awsSecretKey || undefined,
          aws_region: awsRegion || undefined,
          gcp_project_id: gcpProjectId || undefined,
          gcp_credentials_path: gcpCredentialsPath || undefined,
          azure_subscription_id: azureSubscriptionId || undefined,
          azure_client_id: azureClientId || undefined,
          azure_client_secret: azureClientSecret || undefined,
          azure_tenant_id: azureTenantId || undefined,
        },
        integrations: {
          github_token: githubToken || undefined,
          github_org: githubOrg || undefined,
          argocd_url: argocdUrl || undefined,
          argocd_token: argocdToken || undefined,
          prometheus_url: prometheusUrl || undefined,
          datadog_api_key: datadogApiKey || undefined,
          datadog_app_key: datadogAppKey || undefined,
          datadog_site: datadogSite || undefined,
          tfc_token: tfcToken || undefined,
          tfc_org: tfcOrg || undefined,
        },
      });

      setSaveMessage({ type: "success", text: response.message });
      await loadStatus();
      if (onSave) onSave();
    } catch (err) {
      setSaveMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to save credentials",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const togglePasswordVisibility = (field: string) => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const PasswordInput: React.FC<{
    label: string;
    value: string;
    onChange: (value: string) => void;
    fieldKey: string;
    placeholder?: string;
  }> = ({ label, value, onChange, fieldKey, placeholder }) => (
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
        {label}
      </label>
      <div className="relative">
        <input
          type={showPasswords[fieldKey] ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2 pr-10 rounded-lg bg-white dark:bg-[#0F1115] border border-slate-200 dark:border-white/10 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        <button
          type="button"
          onClick={() => togglePasswordVisibility(fieldKey)}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
        >
          {showPasswords[fieldKey] ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-[#0A0A0C] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 text-primary rounded-lg">
              <SettingsIcon size={24} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                Settings & Integrations
              </h2>
              <p className="text-sm text-slate-500">
                Configure your cloud providers and integrations
              </p>
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
          <button
            onClick={() => setActiveTab("overview")}
            className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "overview"
                ? "text-primary border-primary"
                : "text-slate-500 border-transparent hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("cloud")}
            className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "cloud"
                ? "text-primary border-primary"
                : "text-slate-500 border-transparent hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            <Cloud size={16} className="inline mr-2" />
            Cloud Providers
          </button>
          <button
            onClick={() => setActiveTab("integrations")}
            className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "integrations"
                ? "text-primary border-primary"
                : "text-slate-500 border-transparent hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            <GitBranch size={16} className="inline mr-2" />
            Integrations
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                <div className="flex items-start gap-3">
                  <Info size={20} className="text-blue-500 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-slate-900 dark:text-white mb-1">
                      How to Configure
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      For local development, add credentials to your <code className="px-1 py-0.5 bg-slate-200 dark:bg-white/10 rounded text-xs">.env</code> file.
                      In production, credentials are stored securely in Supabase.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                  Integration Status
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(integrationStatus).map(([name, configured]) => (
                    <Card key={name} className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-slate-900 dark:text-white capitalize">
                            {name.replace("_", " ")}
                          </div>
                          <div className="text-xs text-slate-500 mt-1">
                            {configured ? "Configured" : "Not configured"}
                          </div>
                        </div>
                        {configured ? (
                          <CheckCircle size={20} className="text-emerald-500" />
                        ) : (
                          <XCircle size={20} className="text-slate-400" />
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-xl">
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  <strong className="text-slate-900 dark:text-white">
                    {totalConfigured}
                  </strong>{" "}
                  of {Object.keys(integrationStatus).length} integrations configured
                </div>
              </div>
            </div>
          )}

          {activeTab === "cloud" && (
            <div className="space-y-6">
              {/* AWS */}
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-orange-500/10 text-orange-500 rounded-lg">
                    <Cloud size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">AWS</h3>
                    <p className="text-xs text-slate-500">Amazon Web Services</p>
                  </div>
                  {integrationStatus.aws && (
                    <CheckCircle size={20} className="text-emerald-500 ml-auto" />
                  )}
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Access Key ID
                    </label>
                    <input
                      type="text"
                      value={awsAccessKey}
                      onChange={(e) => setAwsAccessKey(e.target.value)}
                      placeholder="AKIAIOSFODNN7EXAMPLE"
                      className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#0F1115] border border-slate-200 dark:border-white/10 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <PasswordInput
                    label="Secret Access Key"
                    value={awsSecretKey}
                    onChange={setAwsSecretKey}
                    fieldKey="aws_secret"
                    placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                  />
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Region
                    </label>
                    <input
                      type="text"
                      value={awsRegion}
                      onChange={(e) => setAwsRegion(e.target.value)}
                      placeholder="us-east-1"
                      className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#0F1115] border border-slate-200 dark:border-white/10 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
              </Card>

              {/* GCP */}
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg">
                    <Cloud size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">Google Cloud Platform</h3>
                    <p className="text-xs text-slate-500">GCP</p>
                  </div>
                  {integrationStatus.gcp && (
                    <CheckCircle size={20} className="text-emerald-500 ml-auto" />
                  )}
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Project ID
                    </label>
                    <input
                      type="text"
                      value={gcpProjectId}
                      onChange={(e) => setGcpProjectId(e.target.value)}
                      placeholder="my-gcp-project"
                      className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#0F1115] border border-slate-200 dark:border-white/10 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Credentials Path (optional)
                    </label>
                    <input
                      type="text"
                      value={gcpCredentialsPath}
                      onChange={(e) => setGcpCredentialsPath(e.target.value)}
                      placeholder="/path/to/credentials.json"
                      className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#0F1115] border border-slate-200 dark:border-white/10 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
              </Card>

              {/* Azure */}
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-600/10 text-blue-600 rounded-lg">
                    <Cloud size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">Microsoft Azure</h3>
                    <p className="text-xs text-slate-500">Azure</p>
                  </div>
                  {integrationStatus.azure && (
                    <CheckCircle size={20} className="text-emerald-500 ml-auto" />
                  )}
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Subscription ID
                    </label>
                    <input
                      type="text"
                      value={azureSubscriptionId}
                      onChange={(e) => setAzureSubscriptionId(e.target.value)}
                      placeholder="12345678-1234-1234-1234-123456789012"
                      className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#0F1115] border border-slate-200 dark:border-white/10 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Client ID
                    </label>
                    <input
                      type="text"
                      value={azureClientId}
                      onChange={(e) => setAzureClientId(e.target.value)}
                      placeholder="12345678-1234-1234-1234-123456789012"
                      className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#0F1115] border border-slate-200 dark:border-white/10 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <PasswordInput
                    label="Client Secret"
                    value={azureClientSecret}
                    onChange={setAzureClientSecret}
                    fieldKey="azure_secret"
                    placeholder="your-client-secret"
                  />
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Tenant ID
                    </label>
                    <input
                      type="text"
                      value={azureTenantId}
                      onChange={(e) => setAzureTenantId(e.target.value)}
                      placeholder="12345678-1234-1234-1234-123456789012"
                      className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#0F1115] border border-slate-200 dark:border-white/10 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
              </Card>
            </div>
          )}

          {activeTab === "integrations" && (
            <div className="space-y-6">
              {/* GitHub */}
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-slate-900/10 text-slate-900 dark:text-white rounded-lg">
                    <GitBranch size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">GitHub Actions</h3>
                    <p className="text-xs text-slate-500">CI/CD Pipelines</p>
                  </div>
                  {integrationStatus.github && (
                    <CheckCircle size={20} className="text-emerald-500 ml-auto" />
                  )}
                </div>
                <div className="space-y-4">
                  <PasswordInput
                    label="GitHub Token"
                    value={githubToken}
                    onChange={setGithubToken}
                    fieldKey="github_token"
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  />
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Organization (optional)
                    </label>
                    <input
                      type="text"
                      value={githubOrg}
                      onChange={(e) => setGithubOrg(e.target.value)}
                      placeholder="my-org"
                      className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#0F1115] border border-slate-200 dark:border-white/10 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
              </Card>

              {/* ArgoCD */}
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg">
                    <GitBranch size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">ArgoCD</h3>
                    <p className="text-xs text-slate-500">GitOps</p>
                  </div>
                  {integrationStatus.argocd && (
                    <CheckCircle size={20} className="text-emerald-500 ml-auto" />
                  )}
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      ArgoCD URL
                    </label>
                    <input
                      type="url"
                      value={argocdUrl}
                      onChange={(e) => setArgocdUrl(e.target.value)}
                      placeholder="https://argocd.example.com"
                      className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#0F1115] border border-slate-200 dark:border-white/10 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <PasswordInput
                    label="ArgoCD Token"
                    value={argocdToken}
                    onChange={setArgocdToken}
                    fieldKey="argocd_token"
                    placeholder="your-argocd-token"
                  />
                </div>
              </Card>

              {/* Prometheus */}
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-orange-500/10 text-orange-500 rounded-lg">
                    <Activity size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">Prometheus</h3>
                    <p className="text-xs text-slate-500">Metrics & Monitoring</p>
                  </div>
                  {integrationStatus.prometheus && (
                    <CheckCircle size={20} className="text-emerald-500 ml-auto" />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Prometheus URL
                  </label>
                  <input
                    type="url"
                    value={prometheusUrl}
                    onChange={(e) => setPrometheusUrl(e.target.value)}
                    placeholder="http://prometheus.example.com:9090"
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#0F1115] border border-slate-200 dark:border-white/10 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </Card>

              {/* Datadog */}
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-purple-500/10 text-purple-500 rounded-lg">
                    <Activity size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">Datadog</h3>
                    <p className="text-xs text-slate-500">APM & Monitoring</p>
                  </div>
                  {integrationStatus.datadog && (
                    <CheckCircle size={20} className="text-emerald-500 ml-auto" />
                  )}
                </div>
                <div className="space-y-4">
                  <PasswordInput
                    label="API Key"
                    value={datadogApiKey}
                    onChange={setDatadogApiKey}
                    fieldKey="datadog_api"
                    placeholder="your-datadog-api-key"
                  />
                  <PasswordInput
                    label="Application Key"
                    value={datadogAppKey}
                    onChange={setDatadogAppKey}
                    fieldKey="datadog_app"
                    placeholder="your-datadog-app-key"
                  />
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Site
                    </label>
                    <input
                      type="text"
                      value={datadogSite}
                      onChange={(e) => setDatadogSite(e.target.value)}
                      placeholder="datadoghq.com"
                      className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#0F1115] border border-slate-200 dark:border-white/10 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
              </Card>

              {/* Terraform Cloud */}
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-purple-500/10 text-purple-500 rounded-lg">
                    <Cloud size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">Terraform Cloud</h3>
                    <p className="text-xs text-slate-500">Infrastructure as Code</p>
                  </div>
                  {integrationStatus.terraform_cloud && (
                    <CheckCircle size={20} className="text-emerald-500 ml-auto" />
                  )}
                </div>
                <div className="space-y-4">
                  <PasswordInput
                    label="Terraform Cloud Token"
                    value={tfcToken}
                    onChange={setTfcToken}
                    fieldKey="tfc_token"
                    placeholder="your-terraform-cloud-token"
                  />
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Organization
                    </label>
                    <input
                      type="text"
                      value={tfcOrg}
                      onChange={(e) => setTfcOrg(e.target.value)}
                      placeholder="my-org"
                      className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#0F1115] border border-slate-200 dark:border-white/10 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Save Message */}
          {saveMessage && (
            <div
              className={`p-4 rounded-xl flex items-center gap-3 ${
                saveMessage.type === "success"
                  ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                  : "bg-red-500/10 text-red-500 border border-red-500/20"
              }`}
            >
              {saveMessage.type === "success" ? (
                <CheckCircle size={20} />
              ) : (
                <AlertCircle size={20} />
              )}
              <span className="text-sm">{saveMessage.text}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-black/20">
          <div className="text-xs text-slate-500">
            Credentials are validated but not persisted. Add them to <code className="px-1 py-0.5 bg-slate-200 dark:bg-white/10 rounded">.env</code> for local development.
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
              Save Credentials
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;

