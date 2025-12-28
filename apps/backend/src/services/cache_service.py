"""Workflow caching service for plans and results.

This module provides caching capabilities for workflow artifacts using Redis.
It supports caching of plans with semantic task hashing and workflow results
for faster repeat executions.

Features:
- Plan caching with task description hashing
- Result caching for completed workflows
- TTL-based cache expiration
- Semantic similarity matching for cache hits

Usage:
    cache = WorkflowCacheService(redis_client)

    # Cache a plan
    await cache.cache_plan(task_id, task_description, plan)

    # Get cached plan
    cached_plan = await cache.get_cached_plan(task_description)

    # Cache workflow result
    await cache.cache_result(task_id, result_state)
"""

import hashlib
import json
from datetime import datetime
from typing import TYPE_CHECKING, Any

from src.core.config import settings
from src.core.logging import get_logger

if TYPE_CHECKING:
    from redis.asyncio import Redis

logger = get_logger(__name__)


# Cache key prefixes
PLAN_CACHE_PREFIX = "codegraph:plan:"
RESULT_CACHE_PREFIX = "codegraph:result:"
TASK_HASH_PREFIX = "codegraph:task_hash:"


class WorkflowCacheService:
    """Service for caching workflow artifacts.

    Provides methods to cache and retrieve workflow plans and results,
    using Redis for storage with configurable TTL.

    Attributes:
        redis: Async Redis client
        default_ttl: Default cache TTL in seconds
        plan_cache_enabled: Whether plan caching is enabled
        result_cache_enabled: Whether result caching is enabled
    """

    def __init__(
        self,
        redis: "Redis",
        default_ttl: int | None = None,
        plan_cache_enabled: bool | None = None,
        result_cache_enabled: bool | None = None,
    ) -> None:
        """Initialize the cache service.

        Args:
            redis: Async Redis client
            default_ttl: Cache TTL in seconds (defaults to settings.redis_cache_ttl)
            plan_cache_enabled: Whether to enable plan caching
            result_cache_enabled: Whether to enable result caching
        """
        self.redis = redis
        self.default_ttl = default_ttl or settings.redis_cache_ttl

        # Check settings for cache flags, defaulting to False for safety
        self.plan_cache_enabled = (
            plan_cache_enabled
            if plan_cache_enabled is not None
            else getattr(settings, "enable_plan_caching", False)
        )
        self.result_cache_enabled = (
            result_cache_enabled
            if result_cache_enabled is not None
            else getattr(settings, "enable_result_caching", False)
        )

        logger.info(
            "Cache service initialized",
            plan_cache_enabled=self.plan_cache_enabled,
            result_cache_enabled=self.result_cache_enabled,
            default_ttl=self.default_ttl,
        )

    @staticmethod
    def compute_task_hash(task_description: str) -> str:
        """Compute a hash for a task description.

        Uses normalized task description to compute a hash that can be used
        for semantic similarity matching. Basic normalization includes:
        - Lowercase conversion
        - Whitespace normalization
        - Removal of punctuation variations

        Args:
            task_description: The task description to hash

        Returns:
            SHA-256 hash of the normalized description
        """
        # Normalize the task description
        normalized = task_description.lower().strip()
        normalized = " ".join(normalized.split())  # Normalize whitespace

        # Compute SHA-256 hash
        return hashlib.sha256(normalized.encode("utf-8")).hexdigest()

    async def cache_plan(
        self,
        task_id: int,
        task_description: str,
        plan: str,
        ttl: int | None = None,
    ) -> bool:
        """Cache a generated plan.

        Stores the plan with a hash of the task description for later retrieval.
        Also stores a mapping from the exact task_id for debugging.

        Args:
            task_id: The task ID
            task_description: The task description used to generate the plan
            plan: The generated plan text
            ttl: Optional TTL override in seconds

        Returns:
            True if cached successfully, False otherwise
        """
        if not self.plan_cache_enabled:
            logger.debug("Plan caching disabled, skipping cache")
            return False

        try:
            task_hash = self.compute_task_hash(task_description)
            cache_key = f"{PLAN_CACHE_PREFIX}{task_hash}"
            cache_ttl = ttl or self.default_ttl

            # Store plan data with metadata
            cache_data = {
                "plan": plan,
                "task_id": task_id,
                "task_description": task_description,
                "cached_at": datetime.utcnow().isoformat(),
                "hash": task_hash,
            }

            await self.redis.set(
                cache_key,
                json.dumps(cache_data),
                ex=cache_ttl,
            )

            # Also store task_id to hash mapping for debugging
            await self.redis.set(
                f"{TASK_HASH_PREFIX}{task_id}",
                task_hash,
                ex=cache_ttl,
            )

            logger.info(
                "Plan cached",
                task_id=task_id,
                cache_key=cache_key[:50],
                ttl=cache_ttl,
            )
            return True

        except Exception as e:
            logger.error(
                "Failed to cache plan",
                task_id=task_id,
                error=str(e),
            )
            return False

    async def get_cached_plan(
        self,
        task_description: str,
        similarity_threshold: float = 1.0,
    ) -> dict[str, Any] | None:
        """Retrieve a cached plan for a task description.

        Looks up a cached plan using the hash of the task description.
        Currently requires exact match (similarity_threshold=1.0).

        Args:
            task_description: The task description to look up
            similarity_threshold: Required similarity score (1.0 = exact match)
                Note: Fuzzy matching not yet implemented, must be 1.0

        Returns:
            Cached plan data dict with 'plan', 'task_id', 'cached_at' keys,
            or None if not found
        """
        if not self.plan_cache_enabled:
            return None

        try:
            task_hash = self.compute_task_hash(task_description)
            cache_key = f"{PLAN_CACHE_PREFIX}{task_hash}"

            cached = await self.redis.get(cache_key)
            if cached:
                data: dict[str, Any] = json.loads(cached)
                logger.info(
                    "Plan cache hit",
                    cache_key=cache_key[:50],
                    original_task_id=data.get("task_id"),
                )
                return data

            logger.debug("Plan cache miss", cache_key=cache_key[:50])
            return None

        except Exception as e:
            logger.error(
                "Failed to get cached plan",
                error=str(e),
            )
            return None

    async def cache_result(
        self,
        task_id: int,
        result_state: dict[str, Any],
        ttl: int | None = None,
    ) -> bool:
        """Cache a workflow result.

        Stores the complete workflow result for a task. This can be used
        for replaying results or debugging.

        Args:
            task_id: The task ID
            result_state: The workflow result state dict
            ttl: Optional TTL override in seconds

        Returns:
            True if cached successfully, False otherwise
        """
        if not self.result_cache_enabled:
            logger.debug("Result caching disabled, skipping cache")
            return False

        try:
            cache_key = f"{RESULT_CACHE_PREFIX}{task_id}"
            cache_ttl = ttl or self.default_ttl

            # Prepare result data (exclude non-serializable fields)
            cache_data = {
                "task_id": result_state.get("task_id"),
                "task_description": result_state.get("task_description"),
                "plan": result_state.get("plan"),
                "code": result_state.get("code"),
                "code_files": result_state.get("code_files"),
                "test_results": result_state.get("test_results"),
                "review_feedback": result_state.get("review_feedback"),
                "status": result_state.get("status"),
                "error": result_state.get("error"),
                "iterations": result_state.get("iterations"),
                "metadata": result_state.get("metadata"),
                "cached_at": datetime.utcnow().isoformat(),
            }

            await self.redis.set(
                cache_key,
                json.dumps(cache_data),
                ex=cache_ttl,
            )

            logger.info(
                "Result cached",
                task_id=task_id,
                status=result_state.get("status"),
                ttl=cache_ttl,
            )
            return True

        except Exception as e:
            logger.error(
                "Failed to cache result",
                task_id=task_id,
                error=str(e),
            )
            return False

    async def get_cached_result(self, task_id: int) -> dict[str, Any] | None:
        """Retrieve a cached workflow result.

        Args:
            task_id: The task ID to look up

        Returns:
            Cached result state dict or None if not found
        """
        if not self.result_cache_enabled:
            return None

        try:
            cache_key = f"{RESULT_CACHE_PREFIX}{task_id}"
            cached = await self.redis.get(cache_key)

            if cached:
                data: dict[str, Any] = json.loads(cached)
                logger.info(
                    "Result cache hit",
                    task_id=task_id,
                    cached_at=data.get("cached_at"),
                )
                return data

            logger.debug("Result cache miss", task_id=task_id)
            return None

        except Exception as e:
            logger.error(
                "Failed to get cached result",
                task_id=task_id,
                error=str(e),
            )
            return None

    async def invalidate_plan(self, task_description: str) -> bool:
        """Invalidate a cached plan.

        Args:
            task_description: The task description whose plan to invalidate

        Returns:
            True if invalidated, False otherwise
        """
        try:
            task_hash = self.compute_task_hash(task_description)
            cache_key = f"{PLAN_CACHE_PREFIX}{task_hash}"
            result = await self.redis.delete(cache_key)
            logger.info("Plan cache invalidated", cache_key=cache_key[:50])
            return bool(result > 0)

        except Exception as e:
            logger.error("Failed to invalidate plan cache", error=str(e))
            return False

    async def invalidate_result(self, task_id: int) -> bool:
        """Invalidate a cached result.

        Args:
            task_id: The task ID whose result to invalidate

        Returns:
            True if invalidated, False otherwise
        """
        try:
            cache_key = f"{RESULT_CACHE_PREFIX}{task_id}"
            result = await self.redis.delete(cache_key)
            logger.info("Result cache invalidated", task_id=task_id)
            return bool(result > 0)

        except Exception as e:
            logger.error("Failed to invalidate result cache", error=str(e))
            return False

    async def get_cache_stats(self) -> dict[str, Any]:
        """Get cache statistics.

        Returns:
            Dict with cache statistics
        """
        try:
            # Count cached plans
            plan_keys = []
            async for key in self.redis.scan_iter(f"{PLAN_CACHE_PREFIX}*"):
                plan_keys.append(key)

            # Count cached results
            result_keys = []
            async for key in self.redis.scan_iter(f"{RESULT_CACHE_PREFIX}*"):
                result_keys.append(key)

            return {
                "plan_cache_count": len(plan_keys),
                "result_cache_count": len(result_keys),
                "plan_cache_enabled": self.plan_cache_enabled,
                "result_cache_enabled": self.result_cache_enabled,
                "default_ttl": self.default_ttl,
            }

        except Exception as e:
            logger.error("Failed to get cache stats", error=str(e))
            return {
                "error": str(e),
                "plan_cache_enabled": self.plan_cache_enabled,
                "result_cache_enabled": self.result_cache_enabled,
            }

    async def clear_all_caches(self) -> dict[str, int]:
        """Clear all workflow caches.

        Warning: This removes all cached plans and results.

        Returns:
            Dict with count of deleted keys per cache type
        """
        deleted = {"plans": 0, "results": 0}

        try:
            # Clear plan cache
            async for key in self.redis.scan_iter(f"{PLAN_CACHE_PREFIX}*"):
                await self.redis.delete(key)
                deleted["plans"] += 1

            # Clear result cache
            async for key in self.redis.scan_iter(f"{RESULT_CACHE_PREFIX}*"):
                await self.redis.delete(key)
                deleted["results"] += 1

            # Clear task hash mappings
            async for key in self.redis.scan_iter(f"{TASK_HASH_PREFIX}*"):
                await self.redis.delete(key)

            logger.warning(
                "All caches cleared",
                plans_deleted=deleted["plans"],
                results_deleted=deleted["results"],
            )

        except Exception as e:
            logger.error("Failed to clear caches", error=str(e))

        return deleted


async def get_redis_client() -> "Redis":
    """Get an async Redis client.

    Returns:
        Configured async Redis client

    Raises:
        ConnectionError: If Redis is not available
    """
    from redis.asyncio import Redis

    client: Redis = Redis.from_url(
        str(settings.redis_url),
        encoding="utf-8",
        decode_responses=False,
    )
    return client


async def get_cache_service() -> WorkflowCacheService:
    """Get a configured cache service instance.

    This is a dependency injection helper for FastAPI.

    Returns:
        Configured WorkflowCacheService
    """
    redis = await get_redis_client()
    return WorkflowCacheService(redis=redis)
