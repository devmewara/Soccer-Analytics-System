from datetime import datetime, timezone
from fastapi import APIRouter
from app.schemas.analytics import OverviewStatsResponse, TeamStats, PlayerMetric, PossessionPeriod

router = APIRouter()

@router.get("/overview", response_model=OverviewStatsResponse)
async def get_overview_analytics():
    """
    Returns sample soccer match overview metrics for the dashboard.
    DISCLAIMER: All returned metrics are DEMO PLACEHOLDER VALUES for frontend layout verification.
    """
    return OverviewStatsResponse(
        is_demo_data=True,
        disclaimer="DEMO DATASET: The statistics below are simulated placeholders for UI verification. Authentic metrics will be computed via YOLOv8 player tracking in Phase 2.",
        match_metadata={
            "match_title": "Manchester Blue vs London Red",
            "competition": "Premier Showcase Cup (Demo)",
            "date": "2026-11-15",
            "venue": "Etihad Arena (Simulated)",
            "duration_minutes": 90,
            "demo_badge": "SAMPLE DATA - NOT REAL INFERENCE RESULTS"
        },
        team_a=TeamStats(
            team_name="Manchester Blue",
            possession_pct=58.4,
            total_passes=612,
            completed_passes=545,
            pass_accuracy_pct=89.1,
            shots_on_target=7,
            total_distance_km=112.4,
            high_intensity_runs=142
        ),
        team_b=TeamStats(
            team_name="London Red",
            possession_pct=41.6,
            total_passes=431,
            completed_passes=362,
            pass_accuracy_pct=84.0,
            shots_on_target=4,
            total_distance_km=116.1,
            high_intensity_runs=156
        ),
        possession_trend=[
            PossessionPeriod(minute="0-15'", team_a_pct=64.0, team_b_pct=36.0),
            PossessionPeriod(minute="15-30'", team_a_pct=59.0, team_b_pct=41.0),
            PossessionPeriod(minute="30-45'", team_a_pct=55.0, team_b_pct=45.0),
            PossessionPeriod(minute="45-60'", team_a_pct=62.0, team_b_pct=38.0),
            PossessionPeriod(minute="60-75'", team_a_pct=53.0, team_b_pct=47.0),
            PossessionPeriod(minute="75-90'", team_a_pct=57.0, team_b_pct=43.0),
        ],
        top_performers=[
            PlayerMetric(
                id=17,
                name="K. De Bruyne (Demo)",
                jersey_number=17,
                team="Manchester Blue",
                position="Midfielder",
                distance_covered_km=11.8,
                top_speed_kmh=32.4,
                sprints=24,
                pass_completion_rate=91.4,
                minutes_played=90
            ),
            PlayerMetric(
                id=7,
                name="B. Saka (Demo)",
                jersey_number=7,
                team="London Red",
                position="Winger",
                distance_covered_km=10.9,
                top_speed_kmh=33.8,
                sprints=28,
                pass_completion_rate=83.5,
                minutes_played=88
            ),
            PlayerMetric(
                id=9,
                name="E. Haaland (Demo)",
                jersey_number=9,
                team="Manchester Blue",
                position="Striker",
                distance_covered_km=9.4,
                top_speed_kmh=34.2,
                sprints=19,
                pass_completion_rate=78.2,
                minutes_played=90
            ),
            PlayerMetric(
                id=8,
                name="M. Odegaard (Demo)",
                jersey_number=8,
                team="London Red",
                position="Midfielder",
                distance_covered_km=11.6,
                top_speed_kmh=31.9,
                sprints=21,
                pass_completion_rate=88.7,
                minutes_played=90
            ),
        ],
        pipeline_status={
            "detection": "Pending Phase 2",
            "tracking": "Pending Phase 2",
            "homography": "Pending Phase 2",
            "speed_estimation": "Pending Phase 2"
        }
    )
