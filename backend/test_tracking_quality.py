"""
Detailed tracking quality and video output audit for PitchVision AI.
Inspects beginning, middle, and end frames, examines track continuity,
verifies ball detection independence, and validates output video files.
"""
import sys
import json
import cv2
from pathlib import Path

backend_dir = Path(__file__).resolve().parent

# Select video ID from CLI argument or default to latest Argentina match
default_vid = "a5b6266a-03f5-4e05-ab88-298fb47cdb3d"
video_id = sys.argv[1] if len(sys.argv) > 1 else default_vid

analytics_file = backend_dir / "uploads" / f"{video_id}_analytics.json"
if not analytics_file.exists():
    fallback_vid = "ac90d9f4-1433-445c-88da-9f178d5881af"
    analytics_file = backend_dir / "uploads" / f"{fallback_vid}_analytics.json"
    video_id = fallback_vid

# Find raw video with .mov or .mp4
raw_video = None
for ext in [".mov", ".mp4", ".avi", ".mkv"]:
    cand = backend_dir / "uploads" / f"{video_id}{ext}"
    if cand.exists():
        raw_video = cand
        break

# Find annotated video with .mp4 or .mov
annotated_video = None
for ext in [".mp4", ".mov", ".avi", ".mkv"]:
    cand = backend_dir / "uploads" / f"annotated_{video_id}{ext}"
    if cand.exists():
        annotated_video = cand
        break

assert analytics_file.exists(), f"Analytics file not found: {analytics_file}"
assert raw_video and raw_video.exists(), f"Raw video not found for {video_id}"

with open(analytics_file) as f:
    data = json.load(f)

summary = data["summary_metrics"]
players = data["players"]
transient = data.get("transient_tracks", [])
timeline = data.get("timeline", [])
fps = data.get("video_metadata", {}).get("fps", 30.0)

print(f"=== TRACKING QUALITY & CONTINUITY AUDIT ({video_id}) ===")

# 1. Track continuity check
# Track continuity: ratio of frames detected vs total lifespan (last_frame - first_frame + 1)
print("\n--- Track Continuity & Persistence Analysis ---")
lifespans = []
densities = []
for p in players:
    span = p["last_frame"] - p["first_frame"] + 1
    lifespans.append(span)
    density = p["detections_count"] / span if span > 0 else 1.0
    densities.append(density)

print(f"Total confirmed track IDs: {len(players)}")
if densities:
    print(f"Average detection density during track lifespan: {sum(densities)/len(densities)*100:.1f}%")
    print(f"High-continuity tracks (density >= 85%): {sum(1 for d in densities if d >= 0.85)} / {len(players)}")
print(f"Tracks active across >= 200 frames: {sum(1 for s in lifespans if s >= 200)}")
print(f"Tracks active across >= 400 frames: {sum(1 for s in lifespans if s >= 400)}")

# 2. Representative Frame Inspection: Beginning, Middle, End
print("\n--- Representative Frame Telemetry ---")
sample_frames = [30, 80, 250, 320, 500, 600]
for sf in sample_frames:
    if sf < len(timeline):
        t = timeline[sf]
        active_p = [p["track_id"] for p in players if p["first_frame"] <= sf <= p["last_frame"]]
        print(f"Frame {sf:3d} (t={t['timestamp_sec']}s): {t['players_detected']} detected players, {len(active_p)} active confirmed tracks, Ball detected: {t['ball_detected']}")

# 3. Ball Detection Audit
print("\n--- Ball Detection Audit ---")
ball_frames = [t["frame"] for t in timeline if t["ball_detected"]]
print(f"Total frames with ball detected: {len(ball_frames)}")
if ball_frames:
    print(f"Ball first seen at frame: {min(ball_frames)} (t={min(ball_frames)/fps:.2f}s)")
    print(f"Ball last seen at frame: {max(ball_frames)} (t={max(ball_frames)/fps:.2f}s)")
    print(f"Ball detection clusters: Frames {ball_frames[0]}..{ball_frames[-1]}")
# Verify ball is not in player list
ball_in_players = any("ball" in p["label"].lower() for p in players)
print(f"Ball excluded from player statistics: {not ball_in_players}")

# 4. Video Files Validation
print("\n--- Video Output Verification ---")
# Raw video
cap_raw = cv2.VideoCapture(str(raw_video))
raw_w = int(cap_raw.get(cv2.CAP_PROP_FRAME_WIDTH))
raw_h = int(cap_raw.get(cv2.CAP_PROP_FRAME_HEIGHT))
raw_fps = cap_raw.get(cv2.CAP_PROP_FPS)
raw_frames = int(cap_raw.get(cv2.CAP_PROP_FRAME_COUNT))
cap_raw.release()

print(f"Raw Video: {raw_video.name}")
print(f"  Resolution: {raw_w}x{raw_h}, FPS: {raw_fps:.2f}, Frames: {raw_frames}, Size: {raw_video.stat().st_size / (1024*1024):.1f} MB")

# Annotated video
if annotated_video and annotated_video.exists():
    cap_ann = cv2.VideoCapture(str(annotated_video))
    ann_w = int(cap_ann.get(cv2.CAP_PROP_FRAME_WIDTH))
    ann_h = int(cap_ann.get(cv2.CAP_PROP_FRAME_HEIGHT))
    ann_fps = cap_ann.get(cv2.CAP_PROP_FPS)
    ann_frames = int(cap_ann.get(cv2.CAP_PROP_FRAME_COUNT))
    cap_ann.release()

    print(f"Annotated Video: {annotated_video.name}")
    print(f"  Resolution: {ann_w}x{ann_h}, FPS: {ann_fps:.2f}, Frames: {ann_frames}, Size: {annotated_video.stat().st_size / (1024*1024):.1f} MB")
    print(f"  Playable & valid stream: {ann_frames == raw_frames and ann_w == raw_w and ann_h == raw_h}")
else:
    print(f"Annotated video not found for {video_id}")
