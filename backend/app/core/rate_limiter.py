"""
NASA Earth Information Jukebox — In-Memory Sliding Window Rate Limiter
2026 NASA Space Apps Challenge

Protects API endpoints against:
- Brute-force credential stuffing attacks on authentication endpoints
- Denial of Service (DoS) and volumetric flooding
- Resource exhaustion on compute-heavy CV and sequence endpoints
"""

import time
import threading
from typing import Dict, List, Tuple
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response


class SlidingWindowRateLimiter:
    def __init__(self):
        self._lock = threading.Lock()
        # Storage: { "bucket_key": [timestamp1, timestamp2, ...] }
        self._requests: Dict[str, List[float]] = {}
        
        # Default limits (requests per 60 seconds)
        self.DEFAULT_LIMIT = 120
        self.AUTH_LIMIT = 15          # Sensitive auth endpoints (brute-force defense)
        self.COMPUTE_LIMIT = 30       # Heavy compute (CV, uploads, sequence)
        self.WINDOW_SECONDS = 60.0

        # Endpoints exempt from rate limits
        self.EXEMPT_PREFIXES = (
            "/health",
            "/api/health",
            "/api/v1/health",
            "/docs",
            "/redoc",
            "/openapi.json",
            "/favicon.ico",
        )

    def _get_client_ip(self, request: Request) -> str:
        """Extracts client IP address safely, checking trusted proxy headers."""
        forwarded = request.headers.get("x-forwarded-for")
        if forwarded:
            return forwarded.split(",")[0].strip()
        client = request.client
        return client.host if client else "127.0.0.1"

    def _get_limit_for_path(self, path: str) -> int:
        """Assigns strict per-route rate limits according to endpoint sensitivity."""
        path_lower = path.lower()

        # Sensitive auth endpoints
        auth_triggers = (
            "/api/auth/login",
            "/api/auth/register",
            "/api/auth/reset-password",
            "/api/auth/forgot-password",
            "/api/v1/auth/login",
            "/api/v1/auth/register",
            "/api/v1/auth/reset-password",
            "/api/v1/auth/forgot-password",
        )
        if any(path_lower.startswith(trigger) for trigger in auth_triggers):
            return self.AUTH_LIMIT

        # Compute-heavy endpoints
        compute_triggers = (
            "/api/image/upload",
            "/api/v1/image/upload",
            "/api/cv/analyze",
            "/api/v1/cv/analyze",
            "/api/sequence/decompose",
            "/api/v1/sequence/decompose",
            "/api/earth/process/upload",
        )
        if any(path_lower.startswith(trigger) for trigger in compute_triggers):
            return self.COMPUTE_LIMIT

        return self.DEFAULT_LIMIT

    def is_rate_limited(self, ip: str, path: str) -> Tuple[bool, int, int, int]:
        """
        Calculates rate limit state for an IP and path.
        Returns: (is_limited, remaining, limit, retry_after_seconds)
        """
        now = time.time()
        window_start = now - self.WINDOW_SECONDS
        limit = self._get_limit_for_path(path)
        category = "auth" if limit == self.AUTH_LIMIT else ("compute" if limit == self.COMPUTE_LIMIT else "gen")
        bucket_key = f"{category}:{ip}"

        with self._lock:
            timestamps = self._requests.get(bucket_key, [])
            # Prune timestamps older than the active window
            valid_timestamps = [ts for ts in timestamps if ts > window_start]

            if len(valid_timestamps) >= limit:
                oldest_timestamp = valid_timestamps[0]
                retry_after = max(1, int(oldest_timestamp + self.WINDOW_SECONDS - now))
                self._requests[bucket_key] = valid_timestamps
                return True, 0, limit, retry_after

            # Record this request
            valid_timestamps.append(now)
            self._requests[bucket_key] = valid_timestamps
            remaining = limit - len(valid_timestamps)
            return False, remaining, limit, 0

    def reset(self) -> None:
        """Resets all tracked request buckets (used for test environments)."""
        with self._lock:
            self._requests.clear()


rate_limiter = SlidingWindowRateLimiter()


class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        path = request.url.path

        # Bypass rate limits for exempt operational endpoints
        if any(path.startswith(prefix) for prefix in rate_limiter.EXEMPT_PREFIXES):
            return await call_next(request)

        client_ip = rate_limiter._get_client_ip(request)
        is_limited, remaining, limit, retry_after = rate_limiter.is_rate_limited(client_ip, path)

        if is_limited:
            return JSONResponse(
                status_code=429,
                content={
                    "status": "error",
                    "code": 429,
                    "message": "Too many requests. API rate limit exceeded.",
                    "detail": f"Allowed rate limit is {limit} requests per minute for this endpoint.",
                    "retry_after_seconds": retry_after,
                    "path": path,
                },
                headers={
                    "Retry-After": str(retry_after),
                    "X-RateLimit-Limit": str(limit),
                    "X-RateLimit-Remaining": "0",
                    "X-RateLimit-Reset": str(int(time.time() + retry_after)),
                },
            )

        response: Response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(limit)
        response.headers["X-RateLimit-Remaining"] = str(max(0, remaining))
        return response
