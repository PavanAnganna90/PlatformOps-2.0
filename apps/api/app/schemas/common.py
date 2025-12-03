"""Common schemas used across the API."""

from datetime import datetime
from typing import Dict, Optional

from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    """Health check response."""

    status: str = Field(description="Health status: 'healthy' or 'unhealthy'")
    version: str = Field(description="API version")
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    model_config = {
        "json_schema_extra": {
            "example": {
                "status": "healthy",
                "version": "1.0.0",
                "timestamp": "2024-01-15T10:30:00Z",
            }
        }
    }


class IntegrationStatus(BaseModel):
    """Status of a single integration."""

    name: str = Field(description="Integration name")
    configured: bool = Field(description="Whether the integration is configured")
    connected: bool = Field(default=False, description="Whether actively connected")
    error: Optional[str] = Field(default=None, description="Error message if any")


class ConfigStatusResponse(BaseModel):
    """
    Configuration status response.

    Shows which integrations are configured and their connection status.
    """

    mode: str = Field(description="Deployment mode: local, docker, or kubernetes")
    integrations: Dict[str, bool] = Field(description="Integration configuration status")
    details: list[IntegrationStatus] = Field(
        default_factory=list, description="Detailed status of each integration"
    )

    model_config = {
        "json_schema_extra": {
            "example": {
                "mode": "local",
                "integrations": {"kubernetes": True, "prometheus": False, "supabase": True},
                "details": [
                    {"name": "kubernetes", "configured": True, "connected": True},
                    {"name": "prometheus", "configured": False, "connected": False},
                ],
            }
        }
    }


class ErrorResponse(BaseModel):
    """Standard error response."""

    error: str = Field(description="Error type")
    message: str = Field(description="Human-readable error message")
    detail: Optional[str] = Field(default=None, description="Additional details")

    model_config = {
        "json_schema_extra": {
            "example": {
                "error": "NotFoundError",
                "message": "Resource not found",
                "detail": "Cluster 'prod-us-east' does not exist",
            }
        }
    }
