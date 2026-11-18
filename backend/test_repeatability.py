"""
End-to-end repeatability test for PitchVision AI computer vision pipeline.
Executes two sequential video inference jobs on the same clip to test for
state leakage, ID determinism, and metrics consistency.
"""
import sys
import json
import time
from pathlib import Path

# Add backend to sys.path
backend_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_dir))

from app.services.cv_pipeline import cv_pipeline_service

test_video = backend_dir / "uploads" / "ac90d9f4-1433-445c-88da-9f178d5881af.mov"
assert test_video.exists(), f"Test video not found: {test_video}"

out_dir = backend_dir / "uploads" / "test_repeatability"
out_dir.mkdir(parents=True, exist_ok=True)

print("=== STARTING REPEATABILITY TEST ===")
print(f"Test Video: {test_video.name}")

# Run Job 1
job1_id = "job_rep_01"
job1_out_video = out_dir / f"{job1_id}_annotated.mp4"
job1_analytics = out_dir / f"{job1_id}_analytics.json"

print(f"\n--- Running Job 1 ({job1_id}) ---")
t0 = time.time()
cv_pipeline_service._process_video_worker(
    video_id=job1_id,
    input_path=test_video,
    output_path=job1_out_video,
    analytics_path=job1_analytics,
    conf_threshold=0.10,
)
t_job1 = time.time() - t0
print(f"Job 1 completed in {t_job1:.2f}s")

# Run Job 2 immediately after Job 1
job2_id = "job_rep_02"
job2_out_video = out_dir / f"{job2_id}_annotated.mp4"
job2_analytics = out_dir / f"{job2_id}_analytics.json"

print(f"\n--- Running Job 2 ({job2_id}) ---")
t0 = time.time()
cv_pipeline_service._process_video_worker(
    video_id=job2_id,
    input_path=test_video,
    output_path=job2_out_video,
    analytics_path=job2_analytics,
    conf_threshold=0.10,
)
t_job2 = time.time() - t0
print(f"Job 2 completed in {t_job2:.2f}s")

# Load and compare results
with open(job1_analytics) as f:
    d1 = json.load(f)
with open(job2_analytics) as f:
    d2 = json.load(f)

s1 = d1["summary_metrics"]
s2 = d2["summary_metrics"]

p1 = d1["players"]
p2 = d2["players"]

p1_ids = [p["track_id"] for p in p1]
p2_ids = [p["track_id"] for p in p2]

print("\n=== COMPARISON RESULTS ===")
print(f"Job 1 Min Track ID: {min(p1_ids) if p1_ids else 'N/A'}, Max Track ID: {max(p1_ids) if p1_ids else 'N/A'}")
print(f"Job 2 Min Track ID: {min(p2_ids) if p2_ids else 'N/A'}, Max Track ID: {max(p2_ids) if p2_ids else 'N/A'}")

print(f"\nMetric Comparison:")
metrics = [
    "total_frames_analyzed",
    "unique_players_count",
    "confirmed_players_count",
    "total_unique_track_ids",
    "short_lived_tracks_count",
    "total_player_detections",
    "total_ball_detections",
    "ball_detection_rate_pct",
    "avg_players_per_frame",
    "avg_track_duration_seconds",
]

all_match = True
for m in metrics:
    v1 = s1.get(m)
    v2 = s2.get(m)
    match = v1 == v2
    if not match:
        all_match = False
    print(f"  {m:28s} | Job 1: {str(v1):10s} | Job 2: {str(v2):10s} | Match: {match}")

print(f"\nReported Players list length | Job 1: {len(p1)} | Job 2: {len(p2)} | Match: {len(p1) == len(p2)}")
print(f"Player Track IDs Match 1:1: {p1_ids == p2_ids}")
print(f"Overall Determinism Check Passed: {all_match and (p1_ids == p2_ids)}")
