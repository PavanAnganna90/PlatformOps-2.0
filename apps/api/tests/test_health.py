"""
Tests for health check endpoints.
"""

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client():
    """Create a test client."""
    return TestClient(app)


def test_health_check(client):
    """Test basic health check endpoint."""
    response = client.get("/api/v1/health")

    assert response.status_code == 200
    data = response.json()

    assert data["status"] == "healthy"
    assert "version" in data
    assert "timestamp" in data


def test_liveness_probe(client):
    """Test Kubernetes liveness probe."""
    response = client.get("/api/v1/health/live")

    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_readiness_probe(client):
    """Test Kubernetes readiness probe."""
    response = client.get("/api/v1/health/ready")

    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_root_endpoint(client):
    """Test root endpoint returns API info."""
    response = client.get("/")

    assert response.status_code == 200
    data = response.json()

    assert "name" in data
    assert "version" in data
    assert "health" in data
