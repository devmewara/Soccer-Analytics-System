from fastapi import APIRouter
from app.api.endpoints import health, video, analytics

api_router = APIRouter()

api_router.include_router(health.router, prefix="/health", tags=["Health"])
api_router.include_router(video.router, prefix="/video", tags=["Video Processing"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["Analytics (Demo)"])
