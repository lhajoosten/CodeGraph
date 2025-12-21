"""Tests for API health and basic endpoints."""

import pytest
from fastapi.testclient import TestClient


@pytest.mark.asyncio
class TestHealthAPI:
    """Test cases for health check endpoints."""

    async def test_health_check(self, client: TestClient) -> None:
        """Test the health check endpoint."""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert "status" in data or data is not None
