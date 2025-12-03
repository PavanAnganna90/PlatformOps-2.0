/**
 * Cloud Visibility View
 *
 * Displays resources from AWS, GCP, and Azure.
 * Supports filtering by provider, resource type, and region.
 */

import React, { useState, useEffect, useCallback } from "react";
import { Card } from "../ui/Card";
import { Skeleton } from "../ui/Skeleton";
import {
  Cloud,
  Server,
  Database,
  HardDrive,
  RefreshCw,
  Filter,
  DollarSign,
  MapPin,
  Calendar,
  Tag,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Wifi,
  WifiOff,
  ChevronDown,
  Layers,
  TrendingUp,
} from "lucide-react";
import {
  apiClient,
  CloudResource,
  CloudResourcesResponse,
  CloudSummaryResponse,
  CloudProvider,
  ResourceType,
} from "../../services/api";

const PROVIDER_ICONS: Record<CloudProvider, React.ComponentType<any>> = {
  aws: Cloud,
  gcp: Cloud,
  azure: Cloud,
};

const PROVIDER_COLORS: Record<CloudProvider, string> = {
  aws: "text-orange-500",
  gcp: "text-blue-500",
  azure: "text-blue-600",
};

const RESOURCE_ICONS: Record<string, React.ComponentType<any>> = {
  ec2_instance: Server,
  gcp_vm: Server,
  azure_vm: Server,
  s3_bucket: HardDrive,
  gcs_bucket: HardDrive,
  azure_blob: HardDrive,
  rds_instance: Database,
  cloud_sql: Database,
  azure_sql: Database,
  lambda: Layers,
  cloud_function: Layers,
  azure_function: Layers,
};

const RESOURCE_LABELS: Record<string, string> = {
  ec2_instance: "EC2 Instance",
  gcp_vm: "Compute Engine VM",
  azure_vm: "Virtual Machine",
  s3_bucket: "S3 Bucket",
  gcs_bucket: "Cloud Storage",
  azure_blob: "Blob Container",
  rds_instance: "RDS Instance",
  cloud_sql: "Cloud SQL",
  azure_sql: "SQL Database",
  lambda: "Lambda Function",
  cloud_function: "Cloud Function",
  azure_function: "Function App",
};

export const CloudView: React.FC = () => {
  const [summary, setSummary] = useState<CloudSummaryResponse | null>(null);
  const [resources, setResources] = useState<CloudResource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isBackendConnected, setIsBackendConnected] = useState(false);

  // Filters
  const [selectedProvider, setSelectedProvider] = useState<CloudProvider | "all">("all");
  const [selectedResourceType, setSelectedResourceType] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    try {
      const available = await apiClient.checkBackendAvailable();
      setIsBackendConnected(available);

      if (available) {
        const data = await apiClient.getCloudSummary();
        setSummary(data);
      } else {
        // Demo summary
        setSummary({
          providers: {
            aws: { ec2_instance: 5, s3_bucket: 3, rds_instance: 2 },
            gcp: { gcp_vm: 4, gcs_bucket: 2, cloud_sql: 1 },
            azure: { azure_vm: 3, azure_blob: 2, azure_sql: 1 },
          },
          total_resources: 23,
          total_estimated_cost: 1250.5,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch cloud summary");
    }
  }, []);

  const fetchResources = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const available = await apiClient.checkBackendAvailable();
      setIsBackendConnected(available);

      if (available) {
        const allResources: CloudResource[] = [];

        if (selectedProvider === "all" || selectedProvider === "aws") {
          const awsData = await apiClient.listCloudResources("aws", {
            resourceType: selectedResourceType || undefined,
            region: selectedRegion || undefined,
          });
          allResources.push(...awsData.resources);
        }

        if (selectedProvider === "all" || selectedProvider === "gcp") {
          const gcpData = await apiClient.listCloudResources("gcp", {
            resourceType: selectedResourceType || undefined,
            region: selectedRegion || undefined,
          });
          allResources.push(...gcpData.resources);
        }

        if (selectedProvider === "all" || selectedProvider === "azure") {
          const azureData = await apiClient.listCloudResources("azure", {
            resourceType: selectedResourceType || undefined,
            region: selectedRegion || undefined,
          });
          allResources.push(...azureData.resources);
        }

        setResources(allResources);
      } else {
        setResources([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch cloud resources");
      setResources([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedProvider, selectedResourceType, selectedRegion]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "running":
      case "healthy":
        return <CheckCircle size={14} className="text-emerald-500" />;
      case "stopped":
        return <XCircle size={14} className="text-slate-400" />;
      case "terminated":
        return <XCircle size={14} className="text-red-500" />;
      case "pending":
        return <Clock size={14} className="text-amber-500 animate-pulse" />;
      default:
        return <AlertCircle size={14} className="text-slate-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "running":
      case "healthy":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      case "stopped":
        return "bg-slate-500/10 text-slate-400 border-slate-500/20";
      case "terminated":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      case "pending":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    }
  };

  const formatCost = (cost?: number) => {
    if (!cost) return "N/A";
    return `$${cost.toFixed(2)}/mo`;
  };

  const formatTimeAgo = (date?: string) => {
    if (!date) return "N/A";
    const now = new Date();
    const past = new Date(date);
    const diff = now.getTime() - past.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days > 0) return `${days}d ago`;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours > 0) return `${hours}h ago`;
    const minutes = Math.floor(diff / (1000 * 60));
    return `${minutes}m ago`;
  };

  // Get unique resource types and regions from resources
  const resourceTypes = [...new Set(resources.map((r) => r.resource_type))];
  const regions = [...new Set(resources.map((r) => r.region))];

  // Filter resources
  const filteredResources = resources.filter((r) => {
    if (selectedProvider !== "all" && r.provider !== selectedProvider) return false;
    if (selectedResourceType && r.resource_type !== selectedResourceType) return false;
    if (selectedRegion && r.region !== selectedRegion) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Cloud Visibility
          </h2>
          <div className="flex items-center gap-2 mt-1">
            {isBackendConnected ? (
              <span className="flex items-center gap-1 text-xs text-emerald-500">
                <Wifi size={12} /> Live Data
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs text-amber-500">
                <WifiOff size={12} /> Demo Mode
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => {
            fetchSummary();
            fetchResources();
          }}
          disabled={isLoading}
          className="px-3 py-2 text-sm bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-500">Total Resources</span>
              <Cloud size={16} className="text-slate-400" />
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {summary.total_resources}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Across {Object.keys(summary.providers).length} providers
            </div>
          </Card>

          {Object.entries(summary.providers).map(([provider, counts]) => {
            const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
            const ProviderIcon = PROVIDER_ICONS[provider as CloudProvider];
            return (
              <Card key={provider} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-500 uppercase">{provider}</span>
                  <ProviderIcon size={16} className={PROVIDER_COLORS[provider as CloudProvider]} />
                </div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{total}</div>
                <div className="text-xs text-slate-500 mt-1">
                  {Object.keys(counts).length} resource types
                </div>
              </Card>
            );
          })}

          {summary.total_estimated_cost && (
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-500">Est. Monthly Cost</span>
                <DollarSign size={16} className="text-emerald-500" />
              </div>
              <div className="text-2xl font-bold text-emerald-500">
                ${summary.total_estimated_cost.toFixed(2)}
              </div>
              <div className="text-xs text-slate-500 mt-1">Across all providers</div>
            </Card>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-slate-400" />
          <span className="text-sm text-slate-500">Filters:</span>
        </div>

        {/* Provider Filter */}
        <select
          value={selectedProvider}
          onChange={(e) => setSelectedProvider(e.target.value as CloudProvider | "all")}
          className="px-3 py-2 rounded-lg bg-white dark:bg-[#0F1115] border border-slate-200 dark:border-white/10 text-sm text-slate-700 dark:text-slate-300"
        >
          <option value="all">All Providers</option>
          <option value="aws">AWS</option>
          <option value="gcp">GCP</option>
          <option value="azure">Azure</option>
        </select>

        {/* Resource Type Filter */}
        {resourceTypes.length > 0 && (
          <select
            value={selectedResourceType || ""}
            onChange={(e) => setSelectedResourceType(e.target.value || null)}
            className="px-3 py-2 rounded-lg bg-white dark:bg-[#0F1115] border border-slate-200 dark:border-white/10 text-sm text-slate-700 dark:text-slate-300"
          >
            <option value="">All Resource Types</option>
            {resourceTypes.map((type) => (
              <option key={type} value={type}>
                {RESOURCE_LABELS[type] || type}
              </option>
            ))}
          </select>
        )}

        {/* Region Filter */}
        {regions.length > 0 && (
          <select
            value={selectedRegion || ""}
            onChange={(e) => setSelectedRegion(e.target.value || null)}
            className="px-3 py-2 rounded-lg bg-white dark:bg-[#0F1115] border border-slate-200 dark:border-white/10 text-sm text-slate-700 dark:text-slate-300"
          >
            <option value="">All Regions</option>
            {regions.map((region) => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Resources Grid */}
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
        ) : filteredResources.length > 0 ? (
          filteredResources.map((resource) => {
            const ResourceIcon = RESOURCE_ICONS[resource.resource_type] || Server;
            const ProviderIcon = PROVIDER_ICONS[resource.provider];
            return (
              <Card
                key={resource.resource_id}
                className="group hover:border-primary/30 dark:hover:border-white/10 transition-all"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        resource.status === "running" || resource.status === "healthy"
                          ? "bg-emerald-500/10 text-emerald-500"
                          : "bg-slate-500/10 text-slate-400"
                      }`}
                    >
                      <ResourceIcon size={20} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white">
                        {resource.name}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                        <ProviderIcon
                          size={12}
                          className={PROVIDER_COLORS[resource.provider]}
                        />
                        <span className="uppercase">{resource.provider}</span>
                        <span className="text-slate-300 dark:text-slate-600">•</span>
                        <span>{RESOURCE_LABELS[resource.resource_type] || resource.resource_type}</span>
                      </div>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-md text-xs font-medium border flex items-center gap-1 ${getStatusColor(
                      resource.status
                    )}`}
                  >
                    {getStatusIcon(resource.status)}
                    {resource.status}
                  </span>
                </div>

                {/* Details */}
                <div className="space-y-2 text-xs text-slate-500 mb-4">
                  <div className="flex items-center gap-2">
                    <MapPin size={12} className="shrink-0" />
                    <span>{resource.region}</span>
                  </div>
                  {resource.cost_estimate && (
                    <div className="flex items-center gap-2">
                      <DollarSign size={12} className="shrink-0" />
                      <span>{formatCost(resource.cost_estimate)}</span>
                    </div>
                  )}
                  {resource.created_at && (
                    <div className="flex items-center gap-2">
                      <Calendar size={12} className="shrink-0" />
                      <span>{formatTimeAgo(resource.created_at)}</span>
                    </div>
                  )}
                </div>

                {/* Tags */}
                {Object.keys(resource.tags).length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {Object.entries(resource.tags)
                      .slice(0, 3)
                      .map(([key, value]) => (
                        <span
                          key={key}
                          className="px-2 py-0.5 text-[10px] bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 rounded-full"
                          title={`${key}=${value}`}
                        >
                          <Tag size={8} className="inline mr-1" />
                          {key}={value}
                        </span>
                      ))}
                  </div>
                )}

                {/* Footer */}
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-400">
                  ID: {resource.resource_id.slice(0, 20)}...
                </div>
              </Card>
            );
          })
        ) : (
          <div className="col-span-full text-center py-12">
            <Cloud
              size={48}
              className="mx-auto text-slate-300 dark:text-slate-600 mb-4"
            />
            <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-2">
              No cloud resources found
            </h3>
            <p className="text-sm text-slate-500">
              {selectedProvider !== "all" || selectedResourceType || selectedRegion
                ? "Try adjusting your filters"
                : "Configure cloud provider credentials to see resources"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CloudView;

