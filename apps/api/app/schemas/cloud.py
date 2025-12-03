"""
Cloud provider resource schemas.

Supports AWS, GCP, and Azure resources.
"""

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


# =============================================================================
# Common Types
# =============================================================================


class CloudProvider(str, Enum):
    """Cloud provider types."""

    AWS = "aws"
    GCP = "gcp"
    AZURE = "azure"


class ResourceStatus(str, Enum):
    """Resource status across all providers."""

    RUNNING = "running"
    STOPPED = "stopped"
    TERMINATED = "terminated"
    PENDING = "pending"
    UNKNOWN = "unknown"
    HEALTHY = "healthy"
    UNHEALTHY = "unhealthy"


class ResourceType(str, Enum):
    """Cloud resource types."""

    # Compute
    EC2_INSTANCE = "ec2_instance"
    GCP_VM = "gcp_vm"
    AZURE_VM = "azure_vm"
    LAMBDA = "lambda"
    CLOUD_FUNCTION = "cloud_function"
    AZURE_FUNCTION = "azure_function"

    # Storage
    S3_BUCKET = "s3_bucket"
    GCS_BUCKET = "gcs_bucket"
    AZURE_BLOB = "azure_blob"

    # Database
    RDS_INSTANCE = "rds_instance"
    CLOUD_SQL = "cloud_sql"
    AZURE_SQL = "azure_sql"

    # Networking
    VPC = "vpc"
    GCP_VPC = "gcp_vpc"
    AZURE_VNET = "azure_vnet"
    LOAD_BALANCER = "load_balancer"

    # Container
    ECS_CLUSTER = "ecs_cluster"
    EKS_CLUSTER = "eks_cluster"
    GKE_CLUSTER = "gke_cluster"
    AKS_CLUSTER = "aks_cluster"


# =============================================================================
# AWS Resources
# =============================================================================


class EC2Instance(BaseModel):
    """AWS EC2 instance."""

    instance_id: str = Field(description="EC2 instance ID")
    name: str = Field(description="Instance name (from tags)")
    instance_type: str = Field(description="Instance type (e.g., t3.medium)")
    status: ResourceStatus = Field(description="Instance status")
    region: str = Field(description="AWS region")
    availability_zone: Optional[str] = Field(default=None, description="Availability zone")
    private_ip: Optional[str] = Field(default=None, description="Private IP address")
    public_ip: Optional[str] = Field(default=None, description="Public IP address")
    vpc_id: Optional[str] = Field(default=None, description="VPC ID")
    security_groups: List[str] = Field(default_factory=list, description="Security group IDs")
    tags: Dict[str, str] = Field(default_factory=dict, description="Instance tags")
    launched_at: Optional[datetime] = Field(default=None, description="Launch time")
    cpu_cores: Optional[int] = Field(default=None, description="Number of vCPUs")
    memory_gb: Optional[float] = Field(default=None, description="Memory in GB")


class S3Bucket(BaseModel):
    """AWS S3 bucket."""

    name: str = Field(description="Bucket name")
    region: str = Field(description="Bucket region")
    creation_date: Optional[datetime] = Field(default=None, description="Creation date")
    size_bytes: Optional[int] = Field(default=None, description="Total size in bytes")
    object_count: Optional[int] = Field(default=None, description="Number of objects")
    public_access: bool = Field(default=False, description="Public access enabled")
    versioning_enabled: bool = Field(default=False, description="Versioning enabled")
    encryption_enabled: bool = Field(default=False, description="Encryption enabled")
    tags: Dict[str, str] = Field(default_factory=dict, description="Bucket tags")


class RDSInstance(BaseModel):
    """AWS RDS instance."""

    instance_id: str = Field(description="RDS instance identifier")
    engine: str = Field(description="Database engine (e.g., mysql, postgres)")
    engine_version: str = Field(description="Engine version")
    instance_class: str = Field(description="Instance class (e.g., db.t3.medium)")
    status: ResourceStatus = Field(description="Instance status")
    region: str = Field(description="AWS region")
    availability_zone: Optional[str] = Field(default=None, description="Availability zone")
    endpoint: Optional[str] = Field(default=None, description="Database endpoint")
    port: Optional[int] = Field(default=None, description="Database port")
    storage_gb: Optional[int] = Field(default=None, description="Allocated storage in GB")
    multi_az: bool = Field(default=False, description="Multi-AZ deployment")
    tags: Dict[str, str] = Field(default_factory=dict, description="Instance tags")


# =============================================================================
# GCP Resources
# =============================================================================


class GCPVM(BaseModel):
    """GCP Compute Engine VM instance."""

    instance_id: str = Field(description="Instance ID")
    name: str = Field(description="Instance name")
    machine_type: str = Field(description="Machine type (e.g., n1-standard-1)")
    status: ResourceStatus = Field(description="Instance status")
    zone: str = Field(description="GCP zone")
    region: str = Field(description="GCP region")
    internal_ip: Optional[str] = Field(default=None, description="Internal IP address")
    external_ip: Optional[str] = Field(default=None, description="External IP address")
    network: Optional[str] = Field(default=None, description="VPC network name")
    cpu_cores: Optional[int] = Field(default=None, description="Number of vCPUs")
    memory_gb: Optional[float] = Field(default=None, description="Memory in GB")
    disk_size_gb: Optional[int] = Field(default=None, description="Boot disk size in GB")
    labels: Dict[str, str] = Field(default_factory=dict, description="Instance labels")
    created_at: Optional[datetime] = Field(default=None, description="Creation time")


class GCSBucket(BaseModel):
    """GCP Cloud Storage bucket."""

    name: str = Field(description="Bucket name")
    location: str = Field(description="Bucket location")
    storage_class: str = Field(description="Storage class (e.g., STANDARD, NEARLINE)")
    creation_date: Optional[datetime] = Field(default=None, description="Creation date")
    size_bytes: Optional[int] = Field(default=None, description="Total size in bytes")
    object_count: Optional[int] = Field(default=None, description="Number of objects")
    public_access: bool = Field(default=False, description="Public access enabled")
    versioning_enabled: bool = Field(default=False, description="Versioning enabled")
    encryption_enabled: bool = Field(default=False, description="Encryption enabled")
    labels: Dict[str, str] = Field(default_factory=dict, description="Bucket labels")


class CloudSQLInstance(BaseModel):
    """GCP Cloud SQL instance."""

    instance_id: str = Field(description="Instance ID")
    name: str = Field(description="Instance name")
    database_version: str = Field(description="Database version (e.g., POSTGRES_14)")
    instance_type: str = Field(description="Instance type (e.g., db-n1-standard-1)")
    status: ResourceStatus = Field(description="Instance status")
    region: str = Field(description="GCP region")
    zone: Optional[str] = Field(default=None, description="GCP zone")
    ip_address: Optional[str] = Field(default=None, description="IP address")
    port: Optional[int] = Field(default=None, description="Database port")
    storage_gb: Optional[int] = Field(default=None, description="Storage size in GB")
    high_availability: bool = Field(default=False, description="High availability enabled")
    labels: Dict[str, str] = Field(default_factory=dict, description="Instance labels")


# =============================================================================
# Azure Resources
# =============================================================================


class AzureVM(BaseModel):
    """Azure Virtual Machine."""

    vm_id: str = Field(description="VM resource ID")
    name: str = Field(description="VM name")
    vm_size: str = Field(description="VM size (e.g., Standard_B1s)")
    status: ResourceStatus = Field(description="VM status")
    resource_group: str = Field(description="Resource group name")
    location: str = Field(description="Azure region")
    private_ip: Optional[str] = Field(default=None, description="Private IP address")
    public_ip: Optional[str] = Field(default=None, description="Public IP address")
    vnet_name: Optional[str] = Field(default=None, description="Virtual network name")
    subnet_name: Optional[str] = Field(default=None, description="Subnet name")
    os_type: Optional[str] = Field(default=None, description="OS type (Linux/Windows)")
    cpu_cores: Optional[int] = Field(default=None, description="Number of vCPUs")
    memory_gb: Optional[float] = Field(default=None, description="Memory in GB")
    disk_size_gb: Optional[int] = Field(default=None, description="OS disk size in GB")
    tags: Dict[str, str] = Field(default_factory=dict, description="VM tags")
    created_at: Optional[datetime] = Field(default=None, description="Creation time")


class AzureBlobContainer(BaseModel):
    """Azure Blob Storage container."""

    name: str = Field(description="Container name")
    storage_account: str = Field(description="Storage account name")
    location: str = Field(description="Storage account location")
    access_tier: str = Field(description="Access tier (Hot/Cool/Archive)")
    creation_date: Optional[datetime] = Field(default=None, description="Creation date")
    size_bytes: Optional[int] = Field(default=None, description="Total size in bytes")
    blob_count: Optional[int] = Field(default=None, description="Number of blobs")
    public_access: bool = Field(default=False, description="Public access enabled")
    encryption_enabled: bool = Field(default=True, description="Encryption enabled")
    tags: Dict[str, str] = Field(default_factory=dict, description="Container tags")


class AzureSQLDatabase(BaseModel):
    """Azure SQL Database."""

    database_id: str = Field(description="Database resource ID")
    name: str = Field(description="Database name")
    server_name: str = Field(description="SQL server name")
    edition: str = Field(description="Service tier (e.g., Basic, Standard, Premium)")
    status: ResourceStatus = Field(description="Database status")
    resource_group: str = Field(description="Resource group name")
    location: str = Field(description="Azure region")
    max_size_gb: Optional[int] = Field(default=None, description="Max size in GB")
    current_size_gb: Optional[int] = Field(default=None, description="Current size in GB")
    collation: Optional[str] = Field(default=None, description="Database collation")
    tags: Dict[str, str] = Field(default_factory=dict, description="Database tags")


# =============================================================================
# Unified Cloud Resource
# =============================================================================


class CloudResource(BaseModel):
    """Unified cloud resource representation."""

    resource_id: str = Field(description="Unique resource identifier")
    name: str = Field(description="Resource name")
    provider: CloudProvider = Field(description="Cloud provider")
    resource_type: ResourceType = Field(description="Resource type")
    status: ResourceStatus = Field(description="Resource status")
    region: str = Field(description="Region/location")
    created_at: Optional[datetime] = Field(default=None, description="Creation time")
    tags: Dict[str, str] = Field(default_factory=dict, description="Resource tags/labels")
    metadata: Dict[str, Any] = Field(
        default_factory=dict, description="Provider-specific metadata"
    )
    cost_estimate: Optional[float] = Field(default=None, description="Estimated monthly cost in USD")


class CloudResourcesResponse(BaseModel):
    """Response containing cloud resources."""

    provider: CloudProvider = Field(description="Cloud provider")
    resources: List[CloudResource] = Field(description="List of resources")
    total_count: int = Field(description="Total number of resources")
    regions: List[str] = Field(default_factory=list, description="Available regions")


class CloudSummaryResponse(BaseModel):
    """Summary of cloud resources across all providers."""

    providers: Dict[str, Dict[str, int]] = Field(
        description="Resource counts by provider and type"
    )
    total_resources: int = Field(description="Total resources across all providers")
    total_estimated_cost: Optional[float] = Field(
        default=None, description="Total estimated monthly cost in USD"
    )

