"""
EARTH JUKEBOX - FastAPI Main Application Entrypoint
NASA Space Apps Challenge 2026 - Phase 1: Backend Foundation

Structure:
- CORS Configuration for Frontend Connectivity
- Global Structured Error Handling
- OpenAPI Swagger Documentation (/docs, /redoc)
- Foundation Endpoints:
  - GET /
  - GET /health
  - GET /api/earth/layers
- Earth Information Endpoints (/api/earth/*)
- API V1 Compatibility Endpoints (/api/v1/*)
"""
import datetime
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.config import settings
from app.api.routes import router as foundation_router
from app.api.router import api_router
from app.api.v1.endpoints.earth import router as earth_router
from app.api.v1.endpoints.auth import router as auth_router
from app.api.v1.endpoints.user_data import router as user_router
from app.api.v1.endpoints.admin import router as admin_router

from app.core.security_headers import SecurityHeadersMiddleware
from app.core.rate_limiter import RateLimitMiddleware
from app.core.request_limits import RequestSizeLimitMiddleware
from app.core.safe_logging import setup_secure_logging
from app.core.ssrf_protection import SSRFSecurityError

# Initialize credential-sanitized logging
setup_secure_logging()

# 3 & 10. Set up clean FastAPI application with OpenAPI documentation
# In production, disable interactive docs unless DEBUG is explicitly enabled
is_production = settings.ENVIRONMENT.lower() == "production"
docs_enabled = not is_production or settings.DEBUG

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    description="""
# 🌍 NASA Earth Information Jukebox Backend API
**2026 NASA Space Apps Challenge**

Transforming NASA multi-spectral Earth observations into living, scientifically grounded auditory landscapes.

### Core Capabilities:
- **NASA GIBS Integration:** Direct access to 12 authentic satellite imagery layers across 6 domains.
- **Copernicus Sentinel-2:** STAC catalogue search for multispectral granules.
- **Physical Sonification:** Translation of NDVI, SST, albedo, and thermal radiance into procedural audio parameters.
- **WCAG 2.2 AAA Accessibility:** Audio descriptions and procedural acoustic earcons.
    """,
    docs_url="/docs" if docs_enabled else None,
    redoc_url="/redoc" if docs_enabled else None,
    openapi_url="/openapi.json" if docs_enabled else None,
)

# 1. OWASP Security Response Headers Middleware
app.add_middleware(SecurityHeadersMiddleware)

# 2. In-Memory Sliding Window Rate Limiter
app.add_middleware(RateLimitMiddleware)

# 3. Payload Size Limitation Middleware (16MB uploads, 1MB JSON)
app.add_middleware(
    RequestSizeLimitMiddleware,
    max_upload_bytes=settings.MAX_REQUEST_BODY_SIZE_BYTES,
    max_json_bytes=settings.MAX_JSON_BODY_SIZE_BYTES
)

# 4. Strict Cross-Origin Resource Sharing (CORS) for trusted frontend origins only
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD"],
    allow_headers=["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"],
)


# =============================================================================
# 9. Proper Error Handling (Global Exception Handlers)
# =============================================================================
@app.exception_handler(SSRFSecurityError)
async def ssrf_exception_handler(request: Request, exc: SSRFSecurityError):
    """Handles SSRF and external host security violations."""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "status": "error",
            "code": exc.status_code,
            "message": exc.message,
            "type": "SSRFSecurityViolation",
            "path": str(request.url.path),
            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        },
    )


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """Handles standard HTTP exceptions with structured JSON error response."""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "status": "error",
            "code": exc.status_code,
            "message": exc.detail,
            "path": str(request.url.path),
            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        },
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handles Pydantic input validation errors with structured field diagnostics."""
    # Clean sensitive data from error reports
    cleaned_errors = []
    for err in exc.errors():
        loc = list(err.get("loc", []))
        msg = err.get("msg", "Invalid value.")
        err_type = err.get("type", "value_error")
        cleaned_errors.append({"field": " -> ".join(str(l) for l in loc), "message": msg, "type": err_type})

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "status": "error",
            "code": 422,
            "message": "Input validation error in request payload or query parameters.",
            "errors": cleaned_errors,
            "path": str(request.url.path),
            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        },
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Catches unhandled server exceptions safely without leaking internal diagnostics."""
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "status": "error",
            "code": 500,
            "message": "An unexpected internal server error occurred.",
            "detail": str(exc) if settings.DEBUG else "Internal server error. Please contact system administrator.",
            "path": str(request.url.path),
            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        },
    )


# =============================================================================
# Route Registration
# =============================================================================
# 7. Phase 1 Foundation endpoints: GET /, GET /health, GET /api/earth/layers
app.include_router(foundation_router)

# Full Earth observation endpoints: /api/earth/imagery, /region, /datasets, /analyze, /timeline, /sentinel
app.include_router(earth_router, prefix="/api/earth")

# Authentication, User Data & Admin Endpoints (/api/auth, /api/user, /api/admin)
app.include_router(auth_router, prefix="/api")
app.include_router(user_router, prefix="/api")
app.include_router(admin_router, prefix="/api")

# API V1 router: /api/v1/* (health, image upload, cv_analysis, sequence, auth, user, admin)
app.include_router(api_router)
app.include_router(auth_router, prefix="/api/v1")
app.include_router(user_router, prefix="/api/v1")
app.include_router(admin_router, prefix="/api/v1")
