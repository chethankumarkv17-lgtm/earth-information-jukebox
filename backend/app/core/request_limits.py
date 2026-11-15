"""
NASA Earth Information Jukebox — Request Size Limit Middleware
2026 NASA Space Apps Challenge

Protects against:
- Excessive payload memory exhaustion attacks
- Uncontrolled file uploads
- Chunked transfer-encoding unbounded streaming
"""

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response


class RequestSizeLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, max_upload_bytes: int = 16 * 1024 * 1024, max_json_bytes: int = 1 * 1024 * 1024):
        super().__init__(app)
        self.max_upload_bytes = max_upload_bytes  # 16 MB for multipart uploads
        self.max_json_bytes = max_json_bytes      # 1 MB for standard JSON / query endpoints

    def _is_upload_route(self, path: str) -> bool:
        path_lower = path.lower()
        upload_indicators = (
            "/upload",
            "/analyze",
            "/process",
            "/image",
        )
        return any(ind in path_lower for ind in upload_indicators)

    async def dispatch(self, request: Request, call_next) -> Response:
        content_length_header = request.headers.get("content-length")
        is_upload = self._is_upload_route(request.url.path)
        allowed_max = self.max_upload_bytes if is_upload else self.max_json_bytes

        # 1. Early Content-Length header verification
        if content_length_header:
            try:
                content_length = int(content_length_header)
                if content_length > allowed_max:
                    max_mb = allowed_max / (1024 * 1024)
                    received_mb = content_length / (1024 * 1024)
                    return JSONResponse(
                        status_code=413,
                        content={
                            "status": "error",
                            "code": 413,
                            "message": f"Request entity exceeds maximum permitted size of {max_mb:.1f} MB (received {received_mb:.2f} MB).",
                            "max_allowed_bytes": allowed_max,
                            "path": request.url.path,
                        },
                    )
            except ValueError:
                return JSONResponse(
                    status_code=400,
                    content={
                        "status": "error",
                        "code": 400,
                        "message": "Invalid Content-Length header provided.",
                        "path": request.url.path,
                    },
                )

        # 2. Streaming verification for chunked transfer-encoding
        bytes_received = 0
        original_receive = request.receive

        async def monitored_receive():
            nonlocal bytes_received
            message = await original_receive()
            if message.get("type") == "http.request":
                body = message.get("body", b"")
                bytes_received += len(body)
                if bytes_received > allowed_max:
                    max_mb = allowed_max / (1024 * 1024)
                    raise RequestSizeExceededException(
                        f"Streamed request payload exceeded limit of {max_mb:.1f} MB."
                    )
            return message

        request._receive = monitored_receive

        try:
            return await call_next(request)
        except RequestSizeExceededException as e:
            return JSONResponse(
                status_code=413,
                content={
                    "status": "error",
                    "code": 413,
                    "message": str(e),
                    "max_allowed_bytes": allowed_max,
                    "path": request.url.path,
                },
            )


class RequestSizeExceededException(Exception):
    pass
