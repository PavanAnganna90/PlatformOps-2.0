"""
Tests for Kubernetes API endpoints.
"""

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client():
    """Create a test client."""
    return TestClient(app)


def test_list_clusters(client):
    """Test listing clusters returns demo data when not connected."""
    response = client.get("/api/v1/kubernetes/clusters")
    
    assert response.status_code == 200
    data = response.json()
    
    assert "clusters" in data
    assert isinstance(data["clusters"], list)
    
    # Should have at least demo cluster
    assert len(data["clusters"]) > 0
    
    # Check cluster structure
    cluster = data["clusters"][0]
    assert "name" in cluster
    assert "context" in cluster
    assert "status" in cluster


def test_list_nodes(client):
    """Test listing nodes returns demo data."""
    response = client.get("/api/v1/kubernetes/nodes")
    
    assert response.status_code == 200
    data = response.json()
    
    assert isinstance(data, list)
    
    if len(data) > 0:
        node = data[0]
        assert "name" in node
        assert "status" in node
        assert "role" in node


def test_list_namespaces(client):
    """Test listing namespaces returns demo data."""
    response = client.get("/api/v1/kubernetes/namespaces")
    
    assert response.status_code == 200
    data = response.json()
    
    assert isinstance(data, list)
    
    if len(data) > 0:
        ns = data[0]
        assert "name" in ns
        assert "status" in ns


def test_list_pods(client):
    """Test listing pods returns demo data."""
    response = client.get("/api/v1/kubernetes/pods")
    
    assert response.status_code == 200
    data = response.json()
    
    assert isinstance(data, list)
    
    if len(data) > 0:
        pod = data[0]
        assert "name" in pod
        assert "namespace" in pod
        assert "phase" in pod
        assert "status" in pod


def test_list_pods_by_namespace(client):
    """Test listing pods filtered by namespace."""
    response = client.get("/api/v1/kubernetes/namespaces/default/pods")
    
    assert response.status_code == 200
    data = response.json()
    
    assert isinstance(data, list)


def test_get_cluster(client):
    """Test getting a specific cluster."""
    # First get the list to find a cluster name
    list_response = client.get("/api/v1/kubernetes/clusters")
    clusters = list_response.json()["clusters"]
    
    if clusters:
        cluster_name = clusters[0]["name"]
        response = client.get(f"/api/v1/kubernetes/clusters/{cluster_name}")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["name"] == cluster_name


def test_get_nonexistent_cluster(client):
    """Test getting a cluster that doesn't exist."""
    response = client.get("/api/v1/kubernetes/clusters/nonexistent-cluster")
    
    assert response.status_code == 200
    data = response.json()
    
    # Should return disconnected status for unknown cluster
    assert data["status"] == "disconnected"
    assert "error" in data

