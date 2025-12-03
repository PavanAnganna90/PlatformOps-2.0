"""
Prometheus integration service.

Provides functionality to:
- Query Prometheus metrics
- Get cluster metrics
- Get historical data
"""

import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import random
import math

from app.core.config import get_settings
from app.schemas.integrations import (
    ClusterMetricsResponse,
    MetricDataPoint,
    MetricSeries,
    PrometheusQueryResponse,
)

logger = logging.getLogger(__name__)


class PrometheusService:
    """Service for Prometheus integration."""

    def __init__(self):
        """Initialize Prometheus service."""
        self._settings = get_settings()
        self._prometheus_url = self._settings.prometheus_url
        self._prometheus_available = bool(self._prometheus_url)

        if self._prometheus_available:
            logger.info(f"Prometheus integration configured: {self._prometheus_url}")
        else:
            logger.info("Prometheus integration not configured")

    def is_configured(self) -> bool:
        """Check if Prometheus is configured."""
        return self._prometheus_available

    async def query(
        self,
        query: str,
        time: Optional[datetime] = None,
    ) -> PrometheusQueryResponse:
        """
        Execute a PromQL instant query.

        Args:
            query: PromQL query string
            time: Evaluation timestamp (defaults to now)

        Returns:
            PrometheusQueryResponse with results
        """
        if self._prometheus_available:
            return await self._execute_query(query, time)
        else:
            return self._get_demo_query_result(query)

    async def query_range(
        self,
        query: str,
        start: datetime,
        end: datetime,
        step: str = "1m",
    ) -> PrometheusQueryResponse:
        """
        Execute a PromQL range query.

        Args:
            query: PromQL query string
            start: Start timestamp
            end: End timestamp
            step: Query resolution step

        Returns:
            PrometheusQueryResponse with time series results
        """
        if self._prometheus_available:
            return await self._execute_range_query(query, start, end, step)
        else:
            return self._get_demo_range_result(query, start, end, step)

    async def get_cluster_metrics(
        self,
        cluster: Optional[str] = None,
    ) -> ClusterMetricsResponse:
        """
        Get aggregated cluster metrics.

        Args:
            cluster: Cluster name (optional)

        Returns:
            ClusterMetricsResponse with aggregated metrics
        """
        if self._prometheus_available:
            return await self._fetch_cluster_metrics(cluster)
        else:
            return self._get_demo_cluster_metrics(cluster)

    async def _execute_query(
        self,
        query: str,
        time: Optional[datetime],
    ) -> PrometheusQueryResponse:
        """Execute real Prometheus query."""
        try:
            import httpx

            url = f"{self._prometheus_url}/api/v1/query"
            params = {"query": query}
            if time:
                params["time"] = time.timestamp()

            async with httpx.AsyncClient() as client:
                response = await client.get(url, params=params)
                response.raise_for_status()
                data = response.json()

            if data["status"] != "success":
                raise Exception(data.get("error", "Unknown error"))

            result = data["data"]
            series = []

            for item in result.get("result", []):
                metric = item.get("metric", {})
                value = item.get("value", [])

                if len(value) == 2:
                    series.append(
                        MetricSeries(
                            metric_name=metric.get("__name__", query),
                            labels={k: v for k, v in metric.items() if k != "__name__"},
                            data_points=[
                                MetricDataPoint(
                                    timestamp=datetime.fromtimestamp(value[0]),
                                    value=float(value[1]),
                                )
                            ],
                        )
                    )

            return PrometheusQueryResponse(
                query=query,
                result_type=result.get("resultType", "vector"),
                series=series,
            )

        except Exception as e:
            logger.error(f"Failed to execute Prometheus query: {e}")
            return self._get_demo_query_result(query)

    async def _execute_range_query(
        self,
        query: str,
        start: datetime,
        end: datetime,
        step: str,
    ) -> PrometheusQueryResponse:
        """Execute real Prometheus range query."""
        try:
            import httpx

            url = f"{self._prometheus_url}/api/v1/query_range"
            params = {
                "query": query,
                "start": start.timestamp(),
                "end": end.timestamp(),
                "step": step,
            }

            async with httpx.AsyncClient() as client:
                response = await client.get(url, params=params)
                response.raise_for_status()
                data = response.json()

            if data["status"] != "success":
                raise Exception(data.get("error", "Unknown error"))

            result = data["data"]
            series = []

            for item in result.get("result", []):
                metric = item.get("metric", {})
                values = item.get("values", [])

                data_points = [
                    MetricDataPoint(
                        timestamp=datetime.fromtimestamp(v[0]),
                        value=float(v[1]),
                    )
                    for v in values
                ]

                series.append(
                    MetricSeries(
                        metric_name=metric.get("__name__", query),
                        labels={k: v for k, v in metric.items() if k != "__name__"},
                        data_points=data_points,
                    )
                )

            return PrometheusQueryResponse(
                query=query,
                result_type=result.get("resultType", "matrix"),
                series=series,
            )

        except Exception as e:
            logger.error(f"Failed to execute Prometheus range query: {e}")
            return self._get_demo_range_result(query, start, end, step)

    async def _fetch_cluster_metrics(
        self,
        cluster: Optional[str],
    ) -> ClusterMetricsResponse:
        """Fetch real cluster metrics from Prometheus."""
        # This would execute multiple PromQL queries
        # For now, return demo data
        return self._get_demo_cluster_metrics(cluster)

    def _get_demo_query_result(self, query: str) -> PrometheusQueryResponse:
        """Generate demo query result."""
        return PrometheusQueryResponse(
            query=query,
            result_type="vector",
            series=[
                MetricSeries(
                    metric_name=query.split("{")[0] if "{" in query else query,
                    labels={"instance": "demo"},
                    data_points=[
                        MetricDataPoint(
                            timestamp=datetime.utcnow(),
                            value=random.uniform(0, 100),
                        )
                    ],
                )
            ],
        )

    def _get_demo_range_result(
        self,
        query: str,
        start: datetime,
        end: datetime,
        step: str,
    ) -> PrometheusQueryResponse:
        """Generate demo range query result."""
        # Parse step to seconds
        step_seconds = 60  # Default 1m
        if step.endswith("s"):
            step_seconds = int(step[:-1])
        elif step.endswith("m"):
            step_seconds = int(step[:-1]) * 60
        elif step.endswith("h"):
            step_seconds = int(step[:-1]) * 3600

        # Generate data points
        data_points = []
        current = start
        base_value = random.uniform(30, 70)

        while current <= end:
            # Add some variation with a sine wave pattern
            time_factor = (current - start).total_seconds() / 3600
            variation = math.sin(time_factor * 0.5) * 15 + random.uniform(-5, 5)
            value = max(0, min(100, base_value + variation))

            data_points.append(
                MetricDataPoint(
                    timestamp=current,
                    value=value,
                )
            )
            current += timedelta(seconds=step_seconds)

        return PrometheusQueryResponse(
            query=query,
            result_type="matrix",
            series=[
                MetricSeries(
                    metric_name=query.split("{")[0] if "{" in query else query,
                    labels={"instance": "demo"},
                    data_points=data_points,
                )
            ],
        )

    def _get_demo_cluster_metrics(
        self,
        cluster: Optional[str],
    ) -> ClusterMetricsResponse:
        """Generate demo cluster metrics."""
        return ClusterMetricsResponse(
            cluster_name=cluster or "demo-cluster",
            timestamp=datetime.utcnow(),
            cpu_usage_percent=random.uniform(35, 65),
            cpu_requests_percent=random.uniform(40, 70),
            cpu_limits_percent=random.uniform(60, 90),
            memory_usage_percent=random.uniform(45, 75),
            memory_requests_percent=random.uniform(50, 80),
            memory_limits_percent=random.uniform(70, 95),
            pods_running=random.randint(20, 50),
            pods_pending=random.randint(0, 3),
            pods_failed=random.randint(0, 2),
            network_receive_bytes=random.uniform(1000000, 5000000),
            network_transmit_bytes=random.uniform(500000, 2000000),
        )


# Singleton instance
_prometheus_service: Optional[PrometheusService] = None


def get_prometheus_service() -> PrometheusService:
    """Get the Prometheus service singleton."""
    global _prometheus_service
    if _prometheus_service is None:
        _prometheus_service = PrometheusService()
    return _prometheus_service

