from datetime import datetime, timezone
from fastapi import APIRouter
from app.schemas.health import HealthCheckResponse
from app.core.config import settings
from app.services.cv_pipeline import cv_pipeline_service

router = APIRouter()

@router.get("", response_model=HealthCheckResponse)
@router.get("/", response_model=HealthCheckResponse)
async def get_health_status():
    """
    Returns system health, version, and CV pipeline readiness.
    Used by frontend to show live connectivity indicator.
    """
    readiness = cv_pipeline_service.check_readiness()
    is_ready = readiness.get("ready_for_inference", False)

    return HealthCheckResponse(
        status="healthy",
        version=settings.VERSION,
        timestamp=datetime.now(timezone.utc).isoformat(),
        cv_pipeline_ready=is_ready,
        message=f"Backend active. Computer vision pipeline ready ({readiness.get('yolo_detection', 'YOLO')})."
    )
