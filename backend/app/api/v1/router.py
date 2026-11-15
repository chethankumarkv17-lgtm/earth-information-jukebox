from fastapi import APIRouter
from app.api.v1.endpoints import health, image, cv_analysis, sequence, earth

api_v1_router = APIRouter()
api_v1_router.include_router(health.router)
api_v1_router.include_router(image.router)
api_v1_router.include_router(cv_analysis.router)
api_v1_router.include_router(sequence.router)
api_v1_router.include_router(earth.router, prefix="/earth")
