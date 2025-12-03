"""
OpsSight API - Main Application Entry Point

This is the FastAPI application that serves as the backend for OpsSight.
It provides REST APIs for:
- Kubernetes cluster management
- CI/CD pipeline integration
- Infrastructure monitoring
- Security scanning
- AI-powered insights
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import router as v1_router
from app.core.config import get_settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan handler.
    
    Runs on startup and shutdown to initialize/cleanup resources.
    """
    # Startup
    settings = get_settings()
    logger.info(f"Starting {settings.app_name} v{settings.app_version}")
    logger.info(f"Debug mode: {settings.debug}")
    logger.info(f"CORS origins: {settings.cors_origins_list}")
    
    # Log integration status
    integrations = settings.get_integration_status()
    configured = [k for k, v in integrations.items() if v]
    logger.info(f"Configured integrations: {', '.join(configured) or 'none'}")
    
    yield
    
    # Shutdown
    logger.info("Shutting down OpsSight API")


def create_app() -> FastAPI:
    """
    Create and configure the FastAPI application.
    
    Returns:
        FastAPI: Configured application instance
    """
    settings = get_settings()
    
    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        description="""
# OpsSight API

Backend API for the OpsSight DevOps Visibility Platform.

## Features

- **Kubernetes Management**: Connect to and monitor multiple K8s clusters
- **CI/CD Integration**: View pipeline status from GitHub Actions, ArgoCD
- **Infrastructure Monitoring**: Real-time metrics and resource status
- **Security Scanning**: Vulnerability reports and compliance status
- **AI Insights**: Gemini-powered analysis and recommendations

## Quick Start

1. Copy `.env.example` to `.env`
2. Configure your integrations
3. Run `make dev` or `docker-compose up`

## Authentication

Most endpoints require authentication via JWT token.
Use the `/auth/login` endpoint to obtain a token.
        """,
        docs_url="/docs" if settings.debug else None,
        redoc_url="/redoc" if settings.debug else None,
        openapi_url="/openapi.json" if settings.debug else None,
        lifespan=lifespan,
    )
    
    # Configure CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # Include API routers
    app.include_router(v1_router, prefix="/api")
    
    # Root endpoint
    @app.get("/", include_in_schema=False)
    async def root():
        """Root endpoint - redirects to docs or returns basic info."""
        return {
            "name": settings.app_name,
            "version": settings.app_version,
            "docs": "/docs" if settings.debug else "Disabled in production",
            "health": "/api/v1/health",
        }
    
    return app


# Create the application instance
app = create_app()


if __name__ == "__main__":
    import uvicorn
    
    settings = get_settings()
    
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        log_level="debug" if settings.debug else "info",
    )

