from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class TeamStats(BaseModel):
    team_name: str
    possession_pct: float
    total_passes: int
    completed_passes: int
    pass_accuracy_pct: float
    shots_on_target: int
    total_distance_km: float
    high_intensity_runs: int

class PlayerMetric(BaseModel):
    id: int
    name: str
    jersey_number: int
    team: str
    position: str
    distance_covered_km: float
    top_speed_kmh: float
    sprints: int
    pass_completion_rate: float
    minutes_played: int

class PossessionPeriod(BaseModel):
    minute: str
    team_a_pct: float
    team_b_pct: float

class OverviewStatsResponse(BaseModel):
    is_demo_data: bool = Field(True, description="Explicit flag indicating mock/placeholder demo data")
    disclaimer: str = Field(
        "DEMO DATASET: All statistics shown below are synthesized mock data for layout verification. "
        "Real-time computer vision inference (YOLO detection, ByteTrack tracking) computes real metrics for uploaded videos."
    )
    match_metadata: Dict[str, Any]
    team_a: TeamStats
    team_b: TeamStats
    possession_trend: List[PossessionPeriod]
    top_performers: List[PlayerMetric]
    pipeline_status: Dict[str, str]

# Real Computer Vision Tracking Analytics Schemas
class TrackedPlayerItem(BaseModel):
    track_id: int
    label: str
    detections_count: int
    first_frame: int
    last_frame: int
    visibility_duration_seconds: float
    avg_confidence: float
    avg_bbox_width: float
    avg_bbox_height: float
    last_known_bbox: List[int]

class RealAnalyticsSummary(BaseModel):
    total_frames_analyzed: int
    unique_players_count: int
    total_player_detections: int
    total_ball_detections: int
    avg_players_per_frame: float
    ball_detection_rate_pct: float
    processing_time_seconds: float
    avg_inference_fps: float

class RealVideoAnalyticsResponse(BaseModel):
    video_id: str
    status: str
    model: str
    tracker: str
    video_metadata: Dict[str, Any]
    summary_metrics: RealAnalyticsSummary
    players: List[TrackedPlayerItem]
    timeline: List[Dict[str, Any]]
    disclaimers: Dict[str, str]
