"""
EARTH JUKEBOX - Backend Configuration Management
Phase 1: Backend Foundation
Loads environment variables from .env using python-dotenv.
"""
import os
from typing import List
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


class Settings:
    PROJECT_NAME: str = os.getenv("PROJECT_NAME", "EARTH JUKEBOX API")
    PROJECT_VERSION: str = os.getenv("PROJECT_VERSION", "1.0.0")
    DESCRIPTION: str = "NASA Earth Information Jukebox - Scientific Sonification Backend Service"
    API_V1_PREFIX: str = "/api/v1"
    EARTH_API_PREFIX: str = "/api/earth"

    # Environment & Debug
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DEBUG: bool = os.getenv("DEBUG", "true").lower() in ("true", "1", "t")

    # Server Host & Port
    HOST: str = os.getenv("HOST", "127.0.0.1")
    PORT: int = int(os.getenv("PORT", "8000"))

    # Strict CORS Configuration - Explicit trusted frontend origins only
    @property
    def CORS_ORIGINS(self) -> List[str]:
        env_origins = os.getenv("CORS_ORIGINS")
        if env_origins:
            return [o.strip() for o in env_origins.split(",") if o.strip()]
        return [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:5174",
            "http://localhost:5175",
            "http://localhost:5176",
            "http://localhost:3000",
            "http://127.0.0.1:3000",
        ]

    # External Request Timeouts & Limits
    EXTERNAL_REQUEST_TIMEOUT_SECONDS: float = float(os.getenv("EXTERNAL_REQUEST_TIMEOUT_SECONDS", "10.0"))
    EXTERNAL_CONNECT_TIMEOUT_SECONDS: float = float(os.getenv("EXTERNAL_CONNECT_TIMEOUT_SECONDS", "5.0"))

    # Request Size Limits
    MAX_REQUEST_BODY_SIZE_BYTES: int = int(os.getenv("MAX_REQUEST_BODY_SIZE_BYTES", str(16 * 1024 * 1024)))
    MAX_JSON_BODY_SIZE_BYTES: int = int(os.getenv("MAX_JSON_BODY_SIZE_BYTES", str(1 * 1024 * 1024)))

    # Rate Limiting Configuration
    RATE_LIMIT_DEFAULT_PER_MINUTE: int = int(os.getenv("RATE_LIMIT_DEFAULT_PER_MINUTE", "120"))
    RATE_LIMIT_AUTH_PER_MINUTE: int = int(os.getenv("RATE_LIMIT_AUTH_PER_MINUTE", "15"))
    RATE_LIMIT_COMPUTE_PER_MINUTE: int = int(os.getenv("RATE_LIMIT_COMPUTE_PER_MINUTE", "30"))

    # NASA Open APIs & GIBS (Global Imagery Browse Services)
    NASA_GIBS_BASE_URL: str = os.getenv(
        "NASA_GIBS_BASE_URL",
        "https://gibs.earthdata.nasa.gov"
    )
    NASA_API_KEY: str = os.getenv("NASA_API_KEY", "DEMO_KEY")

    # Copernicus Data Space Ecosystem (CDSE) / Sentinel-2 STAC
    COPERNICUS_CLIENT_ID: str = os.getenv("COPERNICUS_CLIENT_ID", "")
    COPERNICUS_CLIENT_SECRET: str = os.getenv("COPERNICUS_CLIENT_SECRET", "")
    COPERNICUS_AUTH_URL: str = os.getenv(
        "COPERNICUS_AUTH_URL",
        "https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token"
    )
    COPERNICUS_CATALOGUE_URL: str = os.getenv(
        "COPERNICUS_CATALOGUE_URL",
        "https://catalogue.dataspace.copernicus.eu/resto/api/collections/Sentinel2/search.json"
    )
    SENTINEL_STAC_API_URL: str = os.getenv(
        "SENTINEL_STAC_API_URL",
        "https://earth-search.aws.element84.com/v1"
    )

    # In-Memory Geospatial Cache
    CACHE_TTL_SECONDS: int = int(os.getenv("CACHE_TTL_SECONDS", "3600"))
    CACHE_MAX_ENTRIES: int = int(os.getenv("CACHE_MAX_ENTRIES", "500"))

    # Image Upload & Processing Specifications
    MAX_FILE_SIZE_MB: int = 15
    MAX_FILE_SIZE_BYTES: int = 15 * 1024 * 1024
    ALLOWED_EXTENSIONS: List[str] = [".png", ".jpg", ".jpeg"]
    ALLOWED_MIME_TYPES: List[str] = ["image/png", "image/jpeg", "image/pjpeg"]
    MAX_PROCESSING_DIMENSION: int = 1200
    THUMBNAIL_DIMENSION: int = 320
    UPLOAD_DIR: str = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads"
    )

    # Authentication & Security Specifications
    JWT_SECRET: str = os.getenv("JWT_SECRET", "earth-jukebox-spaceapps-super-secure-jwt-secret-2026")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440")) # 24 hours
    REFRESH_TOKEN_EXPIRE_DAYS: int = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "30"))

    # Supabase Auth & Database (Optional cloud tier)
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")
    SUPABASE_JWT_SECRET: str = os.getenv("SUPABASE_JWT_SECRET", "")

    # Local Embedded Database (Default resilient persistence)
    DB_PATH: str = os.path.join(
        os.path.dirname(os.path.abspath(__file__)), "db", "earth_jukebox.db"
    )


settings = Settings()

# Enforce high-entropy secrets in production
if settings.ENVIRONMENT.lower() == "production":
    if settings.JWT_SECRET == "earth-jukebox-spaceapps-super-secure-jwt-secret-2026" or len(settings.JWT_SECRET) < 32:
        raise RuntimeError(
            "FATAL: Insecure or default JWT_SECRET detected in production! "
            "Must configure a high-entropy secret (>= 32 characters) in .env."
        )

os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
