"""
Application configuration using Pydantic Settings.

Loads configuration from environment variables with sensible defaults.
Supports .env files for local development.
"""

import os
import secrets
from functools import lru_cache
from pathlib import Path
from typing import List, Optional

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


def find_dotenv() -> Optional[Path]:
    """
    Find .env file by walking up from current directory.

    Searches in order:
    1. Current working directory
    2. Parent directories up to project root
    3. apps/api directory
    """
    current = Path.cwd()

    # Check current and parent directories
    for parent in [current] + list(current.parents):
        env_file = parent / ".env"
        if env_file.exists():
            return env_file
        # Stop at git root
        if (parent / ".git").exists():
            break

    return None


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.

    All settings can be overridden via environment variables.
    For local development, create a .env file in the project root.
    """

    model_config = SettingsConfigDict(
        env_file=find_dotenv(),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",  # Ignore extra env vars (like VITE_*)
    )

    # -------------------------------------------------------------------------
    # Application Settings
    # -------------------------------------------------------------------------
    app_name: str = Field(default="OpsSight API", description="Application name")
    app_version: str = Field(default="1.0.0", description="Application version")
    debug: bool = Field(default=False, alias="API_DEBUG", description="Enable debug mode")

    # -------------------------------------------------------------------------
    # Server Settings
    # -------------------------------------------------------------------------
    host: str = Field(default="0.0.0.0", alias="API_HOST")
    port: int = Field(default=8000, alias="API_PORT")

    # CORS origins (comma-separated string or list)
    cors_origins: str = Field(
        default="http://localhost:5173,http://localhost:5174,http://localhost:3000",
        alias="API_CORS_ORIGINS",
    )

    @property
    def cors_origins_list(self) -> List[str]:
        """Parse CORS origins into a list."""
        if not self.cors_origins:
            return []
        return [origin.strip() for origin in self.cors_origins.split(",")]

    # -------------------------------------------------------------------------
    # Database
    # -------------------------------------------------------------------------
    database_url: Optional[str] = Field(default=None, alias="DATABASE_URL")

    # -------------------------------------------------------------------------
    # Supabase
    # -------------------------------------------------------------------------
    supabase_url: Optional[str] = Field(default=None, alias="VITE_SUPABASE_URL")
    supabase_anon_key: Optional[str] = Field(default=None, alias="VITE_SUPABASE_ANON_KEY")
    supabase_service_role_key: Optional[str] = Field(
        default=None, alias="SUPABASE_SERVICE_ROLE_KEY"
    )

    @property
    def is_supabase_configured(self) -> bool:
        """Check if Supabase is configured."""
        return bool(self.supabase_url and self.supabase_anon_key)

    # -------------------------------------------------------------------------
    # Security
    # -------------------------------------------------------------------------
    jwt_secret: str = Field(
        default_factory=lambda: secrets.token_urlsafe(32),
        alias="JWT_SECRET",
    )
    jwt_algorithm: str = Field(default="HS256")
    jwt_expiration_hours: int = Field(default=24)

    encryption_key: str = Field(
        default_factory=lambda: secrets.token_urlsafe(32),
        alias="ENCRYPTION_KEY",
    )

    # -------------------------------------------------------------------------
    # Kubernetes
    # -------------------------------------------------------------------------
    kubeconfig_default: Optional[str] = Field(default=None, alias="KUBECONFIG_DEFAULT")

    @property
    def kubeconfig_path(self) -> Optional[Path]:
        """Get the kubeconfig path, defaulting to ~/.kube/config."""
        if self.kubeconfig_default:
            return Path(self.kubeconfig_default)

        default_path = Path.home() / ".kube" / "config"
        if default_path.exists():
            return default_path

        return None

    # -------------------------------------------------------------------------
    # Integrations
    # -------------------------------------------------------------------------
    prometheus_url: Optional[str] = Field(default=None, alias="PROMETHEUS_URL")
    argocd_url: Optional[str] = Field(default=None, alias="ARGOCD_URL")
    argocd_token: Optional[str] = Field(default=None, alias="ARGOCD_TOKEN")
    github_token: Optional[str] = Field(default=None, alias="GITHUB_TOKEN")
    github_org: Optional[str] = Field(default=None, alias="GITHUB_ORG")
    tfc_token: Optional[str] = Field(default=None, alias="TFC_TOKEN")
    tfc_org: Optional[str] = Field(default=None, alias="TFC_ORG")

    # -------------------------------------------------------------------------
    # Observability
    # -------------------------------------------------------------------------
    otel_endpoint: Optional[str] = Field(default=None, alias="OTEL_EXPORTER_OTLP_ENDPOINT")
    loki_url: Optional[str] = Field(default=None, alias="LOKI_URL")

    def get_integration_status(self) -> dict:
        """
        Get the configuration status of all integrations.

        Returns:
            dict: Status of each integration (configured/not configured)
        """
        return {
            "supabase": self.is_supabase_configured,
            "kubernetes": self.kubeconfig_path is not None,
            "prometheus": bool(self.prometheus_url),
            "argocd": bool(self.argocd_url and self.argocd_token),
            "github": bool(self.github_token),
            "terraform_cloud": bool(self.tfc_token and self.tfc_org),
            "opentelemetry": bool(self.otel_endpoint),
            "loki": bool(self.loki_url),
        }


@lru_cache
def get_settings() -> Settings:
    """
    Get cached application settings.

    Uses LRU cache to avoid re-reading environment on every call.

    Returns:
        Settings: Application settings instance
    """
    return Settings()
