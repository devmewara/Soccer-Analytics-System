/**
 * DEMO & PLACEHOLDER DATASET
 * 
 * DISCLAIMER:
 * All records below are simulated dummy match statistics intended solely for UI & dashboard validation.
 * Real computer vision tracking (YOLOv8 + ByteTrack) will populate authentic data in Phase 2.
 */

export const DEMO_MATCH_DATA = {
  is_demo_data: true,
  disclaimer: "SAMPLE DEMO DATA: Statistics below are mock values for dashboard layout verification.",
  match_metadata: {
    match_title: "Manchester Blue vs London Red",
    competition: "Premier Showcase Cup (Demo)",
    date: "2026-11-15",
    venue: "Etihad Arena (Simulated)",
    score: "2 - 1",
    status: "Full Time (Demo)",
  },
  team_a: {
    team_name: "Manchester Blue",
    possession_pct: 58.4,
    total_passes: 612,
    completed_passes: 545,
    pass_accuracy_pct: 89.1,
    shots_on_target: 7,
    total_distance_km: 112.4,
    high_intensity_runs: 142,
    color: "#38BDF8", // Cyan
  },
  team_b: {
    team_name: "London Red",
    possession_pct: 41.6,
    total_passes: 431,
    completed_passes: 362,
    pass_accuracy_pct: 84.0,
    shots_on_target: 4,
    total_distance_km: 116.1,
    high_intensity_runs: 156,
    color: "#F43F5E", // Rose Red
  },
  possession_trend: [
    { minute: "0-15'", team_a_pct: 64.0, team_b_pct: 36.0 },
    { minute: "15-30'", team_a_pct: 59.0, team_b_pct: 41.0 },
    { minute: "30-45'", team_a_pct: 55.0, team_b_pct: 45.0 },
    { minute: "45-60'", team_a_pct: 62.0, team_b_pct: 38.0 },
    { minute: "60-75'", team_a_pct: 53.0, team_b_pct: 47.0 },
    { minute: "75-90'", team_a_pct: 57.0, team_b_pct: 43.0 },
  ],
  top_performers: [
    {
      id: 17,
      name: "K. De Bruyne (Demo)",
      jersey_number: 17,
      team: "Manchester Blue",
      position: "Midfielder",
      distance_covered_km: 11.8,
      top_speed_kmh: 32.4,
      sprints: 24,
      pass_completion_rate: 91.4,
      minutes_played: 90,
    },
    {
      id: 7,
      name: "B. Saka (Demo)",
      jersey_number: 7,
      team: "London Red",
      position: "Winger",
      distance_covered_km: 10.9,
      top_speed_kmh: 33.8,
      sprints: 28,
      pass_completion_rate: 83.5,
      minutes_played: 88,
    },
    {
      id: 9,
      name: "E. Haaland (Demo)",
      jersey_number: 9,
      team: "Manchester Blue",
      position: "Striker",
      distance_covered_km: 9.4,
      top_speed_kmh: 34.2,
      sprints: 19,
      pass_completion_rate: 78.2,
      minutes_played: 90,
    },
    {
      id: 8,
      name: "M. Odegaard (Demo)",
      jersey_number: 8,
      team: "London Red",
      position: "Midfielder",
      distance_covered_km: 11.6,
      top_speed_kmh: 31.9,
      sprints: 21,
      pass_completion_rate: 88.7,
      minutes_played: 90,
    },
  ],
  pipeline_roadmap: [
    {
      phase: "Phase 1 (Current)",
      name: "Project Foundation & Architecture",
      status: "Active / Completed",
      items: ["FastAPI Backend Setup", "React + Tailwind Dashboard", "API Client & CORS", "Video Ingestion Pipeline"],
    },
    {
      phase: "Phase 2 (Upcoming)",
      name: "Computer Vision & Deep Learning",
      status: "Awaiting Approval",
      items: ["YOLOv8 Player/Ball Detection", "ByteTrack Multi-Object Tracking", "Pitch Calibration & Homography"],
    },
    {
      phase: "Phase 3 (Upcoming)",
      name: "Advanced Soccer Analytics Engine",
      status: "Planned",
      items: ["Dynamic Heatmaps & Voronoi Zones", "Sprint & Speed Calculations", "Tactical Passing Matrix"],
    },
  ],
};
