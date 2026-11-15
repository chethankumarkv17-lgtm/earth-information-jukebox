"""
NASA Earth Information Jukebox — HTTP Security Headers Middleware
2026 NASA Space Apps Challenge

Enforces OWASP recommended security response headers:
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY (anti-clickjacking)
- X-XSS-Protection: 1; mode=block
- Strict-Transport-Security: max-age=31536000; includeSubDomains
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy: camera=(), microphone=(), geolocation=()
- Content-Security-Policy: default-src 'self'; frame-ancestors 'none';
- Strips server and fingerprinting headers
"""

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        response: Response = await call_next(request)

        # 1. Anti-MIME-sniffing
        response.headers["X-Content-Type-Options"] = "nosniff"

        # 2. Anti-clickjacking
        response.headers["X-Frame-Options"] = "DENY"

        # 3. Cross-Site Scripting filter (defense in depth for legacy browsers)
        response.headers["X-XSS-Protection"] = "1; mode=block"

        # 4. Strict Transport Security (HSTS - 1 year with subdomains)
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"

        # 5. Referrer policy
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

        # 6. Restrict hardware API access
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"

        # 7. Content Security Policy frame protection
        if "Content-Security-Policy" not in response.headers:
            response.headers["Content-Security-Policy"] = (
                "default-src 'self'; frame-ancestors 'none'; object-src 'none';"
            )

        # 8. Strip server banner / fingerprinting
        if "server" in response.headers:
            del response.headers["server"]
        if "x-powered-by" in response.headers:
            del response.headers["x-powered-by"]

        return response
