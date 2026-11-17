from pydantic import BaseModel, Field
from typing import Dict

class HealthCheckResponse(BaseModel):
    status: str = Field("healthy", description="Current backend service status")
    version: str = Field(..., description="API version")
    timestamp: str = Field(..., description="ISO 8601 current timestamp")
    cv_pipeline_ready: bool = Field(False, description="Whether YOLO/ByteTrack inference pipeline is active")
    message: str = Field("Backend foundation is running. Computer Vision modules will be integrated in Phase 2.")
