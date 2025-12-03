"""
GitHub Actions integration service.

Provides functionality to:
- List workflow runs
- Get workflow run details
- Trigger workflows (future)
"""

import logging
from datetime import datetime, timedelta
from typing import List, Optional
import random

from app.core.config import get_settings
from app.schemas.integrations import (
    WorkflowRun,
    WorkflowRunsResponse,
    WorkflowRunStatus,
    WorkflowRunConclusion,
)

logger = logging.getLogger(__name__)


class GitHubService:
    """Service for GitHub Actions integration."""

    def __init__(self):
        """Initialize GitHub service."""
        self._settings = get_settings()
        self._github_token = self._settings.github_token
        self._github_available = bool(self._github_token)

        if self._github_available:
            logger.info("GitHub integration configured")
        else:
            logger.info("GitHub integration not configured (no token)")

    def is_configured(self) -> bool:
        """Check if GitHub is configured."""
        return self._github_available

    async def list_workflow_runs(
        self,
        owner: str,
        repo: str,
        workflow_id: Optional[int] = None,
        branch: Optional[str] = None,
        status: Optional[str] = None,
        per_page: int = 10,
    ) -> WorkflowRunsResponse:
        """
        List workflow runs for a repository.

        Args:
            owner: Repository owner
            repo: Repository name
            workflow_id: Filter by workflow ID
            branch: Filter by branch
            status: Filter by status
            per_page: Number of results per page

        Returns:
            WorkflowRunsResponse with list of runs
        """
        if self._github_available:
            return await self._fetch_real_runs(
                owner, repo, workflow_id, branch, status, per_page
            )
        else:
            return self._get_demo_runs(owner, repo, per_page)

    async def _fetch_real_runs(
        self,
        owner: str,
        repo: str,
        workflow_id: Optional[int],
        branch: Optional[str],
        status: Optional[str],
        per_page: int,
    ) -> WorkflowRunsResponse:
        """Fetch real workflow runs from GitHub API."""
        try:
            import httpx

            url = f"https://api.github.com/repos/{owner}/{repo}/actions/runs"
            params = {"per_page": per_page}
            if workflow_id:
                params["workflow_id"] = workflow_id
            if branch:
                params["branch"] = branch
            if status:
                params["status"] = status

            headers = {
                "Authorization": f"Bearer {self._github_token}",
                "Accept": "application/vnd.github.v3+json",
            }

            async with httpx.AsyncClient() as client:
                response = await client.get(url, headers=headers, params=params)
                response.raise_for_status()
                data = response.json()

            runs = []
            for run in data.get("workflow_runs", []):
                runs.append(
                    WorkflowRun(
                        id=run["id"],
                        name=run["name"],
                        head_branch=run["head_branch"],
                        head_sha=run["head_sha"][:7],
                        status=WorkflowRunStatus(run["status"]),
                        conclusion=(
                            WorkflowRunConclusion(run["conclusion"])
                            if run.get("conclusion")
                            else None
                        ),
                        workflow_id=run["workflow_id"],
                        url=run["url"],
                        html_url=run["html_url"],
                        created_at=datetime.fromisoformat(
                            run["created_at"].replace("Z", "+00:00")
                        ),
                        updated_at=datetime.fromisoformat(
                            run["updated_at"].replace("Z", "+00:00")
                        ),
                        run_started_at=(
                            datetime.fromisoformat(
                                run["run_started_at"].replace("Z", "+00:00")
                            )
                            if run.get("run_started_at")
                            else None
                        ),
                        actor=run["actor"]["login"],
                        event=run["event"],
                        run_number=run["run_number"],
                    )
                )

            return WorkflowRunsResponse(
                runs=runs,
                total_count=data.get("total_count", len(runs)),
                repository=f"{owner}/{repo}",
            )

        except Exception as e:
            logger.error(f"Failed to fetch GitHub workflow runs: {e}")
            return self._get_demo_runs(owner, repo, per_page)

    def _get_demo_runs(self, owner: str, repo: str, per_page: int) -> WorkflowRunsResponse:
        """Generate demo workflow runs."""
        workflows = ["CI/CD Pipeline", "Tests", "Build & Deploy", "Security Scan", "Lint"]
        branches = ["main", "develop", "feature/new-ui", "fix/bug-123"]
        events = ["push", "pull_request", "schedule", "workflow_dispatch"]
        actors = ["developer1", "developer2", "bot", "admin"]

        runs = []
        now = datetime.utcnow()

        for i in range(min(per_page, 10)):
            # Determine status and conclusion
            rand = random.random()
            if rand < 0.1:
                status = WorkflowRunStatus.IN_PROGRESS
                conclusion = None
            elif rand < 0.15:
                status = WorkflowRunStatus.QUEUED
                conclusion = None
            else:
                status = WorkflowRunStatus.COMPLETED
                if rand < 0.75:
                    conclusion = WorkflowRunConclusion.SUCCESS
                elif rand < 0.9:
                    conclusion = WorkflowRunConclusion.FAILURE
                else:
                    conclusion = WorkflowRunConclusion.CANCELLED

            created = now - timedelta(hours=i * 2 + random.randint(0, 60) / 60)
            updated = created + timedelta(minutes=random.randint(2, 15))

            runs.append(
                WorkflowRun(
                    id=10000000 + i,
                    name=random.choice(workflows),
                    head_branch=random.choice(branches),
                    head_sha=f"{random.randint(1000000, 9999999):07x}",
                    status=status,
                    conclusion=conclusion,
                    workflow_id=1000 + (i % 5),
                    url=f"https://api.github.com/repos/{owner}/{repo}/actions/runs/{10000000 + i}",
                    html_url=f"https://github.com/{owner}/{repo}/actions/runs/{10000000 + i}",
                    created_at=created,
                    updated_at=updated,
                    run_started_at=created + timedelta(seconds=5),
                    actor=random.choice(actors),
                    event=random.choice(events),
                    run_number=100 - i,
                )
            )

        return WorkflowRunsResponse(
            runs=runs,
            total_count=len(runs),
            repository=f"{owner}/{repo}",
        )


# Singleton instance
_github_service: Optional[GitHubService] = None


def get_github_service() -> GitHubService:
    """Get the GitHub service singleton."""
    global _github_service
    if _github_service is None:
        _github_service = GitHubService()
    return _github_service

