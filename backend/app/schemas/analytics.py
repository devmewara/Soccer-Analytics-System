from pydantic import BaseModel, Field
from typing import List, Dict, Any

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
        "Real-time computer vision inference (YOLO detection, ByteTrack tracking, pitch homography) "
        "will calculate authentic values once the CV pipeline is approved and integrated."
    )
    match_metadata: Dict[str, Any]
    team_a: TeamStats
    team_b: TeamStats
    possession_trend: List[PossessionPeriod]
    top_performers: List[PlayerMetric]
    pipeline_status: Dict[str, str]
