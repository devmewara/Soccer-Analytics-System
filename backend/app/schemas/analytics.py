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
class FramePlayerTrackingItem(BaseModel):
    id: int
    team: str
    x: float
    y: float
    bbox: Optional[List[float]] = None

class FrameBallTrackingItem(BaseModel):
    x: float
    y: float

class FrameTrackingRecord(BaseModel):
    frame: int
    t: float
    players: List[FramePlayerTrackingItem]
    ball: Optional[FrameBallTrackingItem] = None

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
    is_confirmed: bool = True
    team: str = "Unassigned"
    team_color: str = "#10B981"
    jersey_color_rgb: Optional[List[int]] = None

class RealAnalyticsSummary(BaseModel):
    total_frames_analyzed: int
    unique_players_count: int
    total_player_detections: int
    total_ball_detections: int
    avg_players_per_frame: float
    ball_detection_rate_pct: float
    processing_time_seconds: float
    avg_inference_fps: float
    confirmed_players_count: Optional[int] = None
    total_unique_track_ids: Optional[int] = None
    short_lived_tracks_count: Optional[int] = None
    min_frames_threshold: Optional[int] = None
    avg_track_duration_seconds: Optional[float] = None
    team_a_name: str = "Team A"
    team_b_name: str = "Team B"
    team_a_count: int = 0
    team_b_count: int = 0
    officials_count: int = 0
    unknown_count: int = 0
    team_a_color: str = "#38BDF8"
    team_b_color: str = "#F43F5E"
    unknown_color: str = "#94A3B8"
    camera_shots_detected: int = 1
    pitch_filter_applied: bool = True

class RealVideoAnalyticsResponse(BaseModel):
    video_id: str
    status: str
    model: str
    tracker: str
    video_metadata: Dict[str, Any]
    summary_metrics: RealAnalyticsSummary
    players: List[TrackedPlayerItem]
    transient_tracks: Optional[List[TrackedPlayerItem]] = None
    timeline: List[Dict[str, Any]]
    frame_tracking: Optional[List[FrameTrackingRecord]] = None
    disclaimers: Dict[str, str]
