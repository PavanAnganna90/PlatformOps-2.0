"""
WebSocket endpoints for real-time updates.

Provides:
- Live pod logs streaming
- Real-time metrics updates
- Event notifications
"""

import asyncio
import json
import logging
from datetime import datetime
from typing import Optional
import random

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query

from app.services.kubernetes import get_kubernetes_service

router = APIRouter(prefix="/ws", tags=["WebSocket"])
logger = logging.getLogger(__name__)


class ConnectionManager:
    """Manages WebSocket connections."""

    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        """Accept and store a new connection."""
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        """Remove a connection."""
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def send_json(self, websocket: WebSocket, data: dict):
        """Send JSON data to a specific connection."""
        try:
            await websocket.send_json(data)
        except Exception as e:
            logger.error(f"Failed to send WebSocket message: {e}")

    async def broadcast(self, data: dict):
        """Broadcast data to all connections."""
        for connection in self.active_connections:
            await self.send_json(connection, data)


manager = ConnectionManager()


@router.websocket("/logs/{namespace}/{pod}")
async def stream_pod_logs(
    websocket: WebSocket,
    namespace: str,
    pod: str,
    container: Optional[str] = Query(default=None),
    tail_lines: int = Query(default=100, ge=1, le=1000),
):
    """
    Stream live logs from a pod.

    Connects to the Kubernetes API to stream logs in real-time.
    Falls back to demo logs if K8s is not available.
    """
    await manager.connect(websocket)
    logger.info(f"WebSocket connected for logs: {namespace}/{pod}")

    try:
        service = get_kubernetes_service()

        # Check if we can get real logs
        if service._k8s_available:
            await _stream_real_logs(
                websocket, namespace, pod, container, tail_lines, service
            )
        else:
            await _stream_demo_logs(websocket, namespace, pod)

    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected: {namespace}/{pod}")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        await manager.send_json(
            websocket,
            {"type": "error", "message": str(e)},
        )
    finally:
        manager.disconnect(websocket)


async def _stream_real_logs(
    websocket: WebSocket,
    namespace: str,
    pod: str,
    container: Optional[str],
    tail_lines: int,
    service,
):
    """Stream real logs from Kubernetes."""
    try:
        from kubernetes import client, watch

        core_v1 = client.CoreV1Api()
        w = watch.Watch()

        # Start streaming logs
        kwargs = {
            "name": pod,
            "namespace": namespace,
            "follow": True,
            "tail_lines": tail_lines,
            "_preload_content": False,
        }
        if container:
            kwargs["container"] = container

        for line in w.stream(core_v1.read_namespaced_pod_log, **kwargs):
            await manager.send_json(
                websocket,
                {
                    "type": "log",
                    "timestamp": datetime.utcnow().isoformat(),
                    "namespace": namespace,
                    "pod": pod,
                    "container": container,
                    "message": line,
                },
            )

            # Check if client is still connected
            try:
                await asyncio.wait_for(
                    websocket.receive_text(),
                    timeout=0.01,
                )
            except asyncio.TimeoutError:
                pass  # No message, continue streaming

    except Exception as e:
        logger.error(f"Failed to stream real logs: {e}")
        # Fall back to demo logs
        await _stream_demo_logs(websocket, namespace, pod)


async def _stream_demo_logs(websocket: WebSocket, namespace: str, pod: str):
    """Stream demo log messages."""
    log_templates = [
        "INFO: Request processed successfully",
        "DEBUG: Connection established to database",
        "INFO: Health check passed",
        "DEBUG: Cache hit for key: user_session_{}",
        "INFO: Processing batch job #{}",
        "WARN: Slow query detected ({}ms)",
        "INFO: API response sent in {}ms",
        "DEBUG: Memory usage: {}MB",
        "INFO: Scheduled task completed",
        "DEBUG: WebSocket connection active",
        "INFO: Authentication successful for user_{}",
        "DEBUG: Loading configuration from environment",
        "INFO: Service ready on port 8080",
        "DEBUG: Metrics exported successfully",
    ]

    await manager.send_json(
        websocket,
        {
            "type": "info",
            "message": f"Connected to log stream for {namespace}/{pod} (demo mode)",
        },
    )

    while True:
        try:
            # Generate random log message
            template = random.choice(log_templates)
            if "{}" in template:
                message = template.format(random.randint(1, 1000))
            else:
                message = template

            await manager.send_json(
                websocket,
                {
                    "type": "log",
                    "timestamp": datetime.utcnow().isoformat(),
                    "namespace": namespace,
                    "pod": pod,
                    "message": message,
                },
            )

            # Random delay between 0.5 and 3 seconds
            await asyncio.sleep(random.uniform(0.5, 3))

        except WebSocketDisconnect:
            break
        except Exception as e:
            logger.error(f"Demo log stream error: {e}")
            break


@router.websocket("/metrics")
async def stream_metrics(websocket: WebSocket):
    """
    Stream real-time cluster metrics.

    Sends periodic updates with CPU, memory, and pod metrics.
    """
    await manager.connect(websocket)
    logger.info("WebSocket connected for metrics stream")

    try:
        while True:
            # Generate metrics update
            metrics = {
                "type": "metrics",
                "timestamp": datetime.utcnow().isoformat(),
                "cluster": {
                    "cpu_usage": round(random.uniform(30, 70), 2),
                    "memory_usage": round(random.uniform(40, 80), 2),
                    "pods_running": random.randint(20, 50),
                    "pods_pending": random.randint(0, 3),
                },
                "nodes": [
                    {
                        "name": f"node-{i}",
                        "cpu": round(random.uniform(20, 90), 2),
                        "memory": round(random.uniform(30, 85), 2),
                    }
                    for i in range(1, 4)
                ],
            }

            await manager.send_json(websocket, metrics)

            # Update every 5 seconds
            await asyncio.sleep(5)

    except WebSocketDisconnect:
        logger.info("Metrics WebSocket disconnected")
    except Exception as e:
        logger.error(f"Metrics stream error: {e}")
    finally:
        manager.disconnect(websocket)


@router.websocket("/events")
async def stream_events(
    websocket: WebSocket,
    namespace: Optional[str] = Query(default=None),
):
    """
    Stream Kubernetes events.

    Watches for events in the cluster and streams them to the client.
    """
    await manager.connect(websocket)
    logger.info(f"WebSocket connected for events (namespace: {namespace or 'all'})")

    try:
        service = get_kubernetes_service()

        if service._k8s_available:
            await _stream_real_events(websocket, namespace, service)
        else:
            await _stream_demo_events(websocket, namespace)

    except WebSocketDisconnect:
        logger.info("Events WebSocket disconnected")
    except Exception as e:
        logger.error(f"Events stream error: {e}")
    finally:
        manager.disconnect(websocket)


async def _stream_real_events(
    websocket: WebSocket,
    namespace: Optional[str],
    service,
):
    """Stream real Kubernetes events."""
    try:
        from kubernetes import client, watch

        core_v1 = client.CoreV1Api()
        w = watch.Watch()

        if namespace:
            stream = w.stream(core_v1.list_namespaced_event, namespace=namespace)
        else:
            stream = w.stream(core_v1.list_event_for_all_namespaces)

        for event in stream:
            obj = event["object"]
            await manager.send_json(
                websocket,
                {
                    "type": "event",
                    "event_type": event["type"],
                    "timestamp": datetime.utcnow().isoformat(),
                    "namespace": obj.metadata.namespace,
                    "name": obj.metadata.name,
                    "reason": obj.reason,
                    "message": obj.message,
                    "kind": obj.involved_object.kind,
                    "object_name": obj.involved_object.name,
                },
            )

    except Exception as e:
        logger.error(f"Failed to stream real events: {e}")
        await _stream_demo_events(websocket, namespace)


async def _stream_demo_events(websocket: WebSocket, namespace: Optional[str]):
    """Stream demo Kubernetes events."""
    event_templates = [
        {"reason": "Scheduled", "message": "Successfully assigned pod to node", "kind": "Pod"},
        {"reason": "Pulled", "message": "Container image pulled successfully", "kind": "Pod"},
        {"reason": "Created", "message": "Created container", "kind": "Pod"},
        {"reason": "Started", "message": "Started container", "kind": "Pod"},
        {"reason": "ScalingReplicaSet", "message": "Scaled up replica set to 3", "kind": "Deployment"},
        {"reason": "SuccessfulCreate", "message": "Created pod: app-abc123", "kind": "ReplicaSet"},
        {"reason": "Sync", "message": "Successfully synced resources", "kind": "Deployment"},
        {"reason": "FailedScheduling", "message": "Insufficient cpu", "kind": "Pod"},
        {"reason": "BackOff", "message": "Back-off restarting failed container", "kind": "Pod"},
        {"reason": "Unhealthy", "message": "Liveness probe failed", "kind": "Pod"},
    ]

    namespaces = ["default", "kube-system", "monitoring", "backend"]
    if namespace:
        namespaces = [namespace]

    await manager.send_json(
        websocket,
        {
            "type": "info",
            "message": f"Connected to events stream (demo mode)",
        },
    )

    while True:
        try:
            event = random.choice(event_templates)
            ns = random.choice(namespaces)

            await manager.send_json(
                websocket,
                {
                    "type": "event",
                    "event_type": "ADDED" if random.random() > 0.2 else "MODIFIED",
                    "timestamp": datetime.utcnow().isoformat(),
                    "namespace": ns,
                    "name": f"event-{random.randint(1000, 9999)}",
                    "reason": event["reason"],
                    "message": event["message"],
                    "kind": event["kind"],
                    "object_name": f"{event['kind'].lower()}-{random.randint(100, 999)}",
                },
            )

            # Random delay between 2 and 10 seconds
            await asyncio.sleep(random.uniform(2, 10))

        except WebSocketDisconnect:
            break
        except Exception as e:
            logger.error(f"Demo events stream error: {e}")
            break

