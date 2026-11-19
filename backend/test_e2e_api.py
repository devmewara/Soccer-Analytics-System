"""
PitchVision AI - Automated End-to-End API and Integration Test Suite
Validates health check, recent videos, real analytics retrieval,
demo overview, static video streaming, and video upload workflow.
"""
import io
import sys
import json
import tempfile
from pathlib import Path

# Add backend to sys.path
backend_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_dir))

import cv2
import numpy as np
from fastapi.testclient import TestClient
from app.main import app
from app.core.config import settings

client = TestClient(app)

EXISTING_VIDEO_ID = "a5b6266a-03f5-4e05-ab88-298fb47cdb3d"

def test_health():
    print("\n[TEST 1] GET /api/health ...")
    res = client.get("/api/health")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    data = res.json()
    assert data["status"] == "healthy", f"Expected status healthy, got {data['status']}"
    assert data["cv_pipeline_ready"] is True, "Expected cv_pipeline_ready to be True"
    print(f"  PASSED: Health check OK, CV Pipeline ready ({data.get('message')})")


def test_demo_overview():
    print("\n[TEST 2] GET /api/analytics/overview (Demo Sandbox) ...")
    res = client.get("/api/analytics/overview")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    data = res.json()
    assert data["is_demo_data"] is True, "Expected is_demo_data == True"
    assert "Manchester Blue" in data["match_metadata"]["match_title"]
    assert len(data["top_performers"]) > 0
    print(f"  PASSED: Demo overview returns valid mock dataset with {len(data['top_performers'])} players")


def test_recent_videos():
    print("\n[TEST 3] GET /api/video/recent ...")
    res = client.get("/api/video/recent")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    videos = res.json()
    assert isinstance(videos, list), "Expected list of videos"
    assert len(videos) > 0, "Expected at least one uploaded video"
    
    # Check that our test video is found
    target = next((v for v in videos if v["video_id"] == EXISTING_VIDEO_ID), None)
    assert target is not None, f"Video {EXISTING_VIDEO_ID} not found in recent list"
    assert target["is_analyzed"] is True, f"Video {EXISTING_VIDEO_ID} should be marked as analyzed"
    print(f"  PASSED: Found {len(videos)} videos in uploads; test video is analyzed: {target['filename']}")


def test_real_analytics():
    print(f"\n[TEST 4] GET /api/analytics/{EXISTING_VIDEO_ID} (Real CV Inference) ...")
    res = client.get(f"/api/analytics/{EXISTING_VIDEO_ID}")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    data = res.json()
    
    assert data["video_id"] == EXISTING_VIDEO_ID
    assert data["status"] == "completed"
    assert "YOLO11" in data["model"]
    assert "ByteTrack" in data["tracker"]
    
    summary = data["summary_metrics"]
    confirmed_count = summary["confirmed_players_count"]
    total_detections = summary["total_player_detections"]
    ball_detections = summary["total_ball_detections"]
    frames = summary["total_frames_analyzed"]
    
    assert frames == 655, f"Expected 655 frames, got {frames}"
    assert confirmed_count >= 20, f"Expected >= 20 confirmed players, got {confirmed_count}"
    assert total_detections > 10000, f"Expected > 10000 player detections, got {total_detections}"
    assert ball_detections > 0, f"Expected > 0 ball sightings, got {ball_detections}"
    
    # Check team classification
    assert summary["team_a_count"] > 0, "Team A count should be > 0"
    assert summary["team_b_count"] > 0, "Team B count should be > 0"
    assert summary["officials_count"] > 0, "Officials count should be > 0"
    
    # Check player list
    players = data["players"]
    assert len(players) == confirmed_count, f"Players array length ({len(players)}) != confirmed count ({confirmed_count})"
    
    # Check disclaimers
    assert "homography" in data["disclaimers"]
    assert "team_classification" in data["disclaimers"]
    assert "track_count_derivation" in data["disclaimers"]
    
    print(f"  PASSED: Real analytics verified ({frames} frames, {confirmed_count} confirmed track IDs, "
          f"{ball_detections} ball sightings, {summary['team_a_count']} Team A, {summary['team_b_count']} Team B, "
          f"{summary['officials_count']} Ref)")


def test_video_status():
    print(f"\n[TEST 5] GET /api/video/status/{EXISTING_VIDEO_ID} ...")
    res = client.get(f"/api/video/status/{EXISTING_VIDEO_ID}")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    data = res.json()
    assert data["status"] == "completed"
    assert data["progress"] == 100
    assert data["annotated_video_url"] is not None
    print(f"  PASSED: Status endpoint reports completed ({data['annotated_video_url']})")


def test_video_streaming_and_partial_range():
    print(f"\n[TEST 6] GET /uploads/annotated_{EXISTING_VIDEO_ID}.mp4 (Streaming & Partial Content) ...")
    stream_url = f"/uploads/annotated_{EXISTING_VIDEO_ID}.mp4"
    
    # Normal GET request
    res = client.get(stream_url)
    assert res.status_code in (200, 206), f"Expected 200 or 206, got {res.status_code}"
    assert "video/mp4" in res.headers.get("content-type", "")
    content_len = len(res.content)
    assert content_len > 1_000_000, f"Expected > 1MB video content, got {content_len} bytes"
    
    # Range request for video seeking (Safari / Chrome byte-range streaming)
    range_res = client.get(stream_url, headers={"Range": "bytes=0-1023"})
    assert range_res.status_code == 206, f"Expected 206 Partial Content, got {range_res.status_code}"
    assert len(range_res.content) == 1024, f"Expected exactly 1024 bytes, got {len(range_res.content)}"
    assert "bytes 0-1023/" in range_res.headers.get("content-range", "")
    print(f"  PASSED: Video stream serves MP4 ({content_len / (1024*1024):.1f} MB), HTTP 206 Range seeking supported")


def test_upload_synthetic_clip():
    print("\n[TEST 7] POST /api/video/upload (Synthetic Match Clip) ...")
    # Create tiny in-memory 5-frame video
    temp_mp4 = tempfile.NamedTemporaryFile(suffix=".mp4", delete=False)
    temp_mp4_path = Path(temp_mp4.name)
    temp_mp4.close()
    
    try:
        fourcc = cv2.VideoWriter_fourcc(*"mp4v")
        writer = cv2.VideoWriter(str(temp_mp4_path), fourcc, 10.0, (320, 240))
        for _ in range(5):
            img = np.zeros((240, 320, 3), dtype=np.uint8)
            img[:] = (35, 120, 35) # green
            writer.write(img)
        writer.release()
        
        with open(temp_mp4_path, "rb") as f:
            upload_res = client.post(
                "/api/video/upload",
                files={"file": ("test_synthetic.mp4", f, "video/mp4")}
            )
        
        assert upload_res.status_code == 200, f"Expected 200, got {upload_res.status_code}: {upload_res.text}"
        data = upload_res.json()
        synth_id = data["video_id"]
        assert data["status"] == "ready_for_analysis"
        assert Path(settings.UPLOAD_DIR / data["saved_filename"]).exists()
        print(f"  PASSED: Uploaded synthetic video {synth_id} ({data['file_size_formatted']})")
        
        # Clean up uploaded synthetic video to keep repository clean
        saved_file = settings.UPLOAD_DIR / data["saved_filename"]
        if saved_file.exists():
            saved_file.unlink()
    finally:
        if temp_mp4_path.exists():
            temp_mp4_path.unlink()


if __name__ == "__main__":
    print("==================================================")
    print("PitchVision AI - Automated E2E Backend Suite")
    print("==================================================")
    test_health()
    test_demo_overview()
    test_recent_videos()
    test_real_analytics()
    test_video_status()
    test_video_streaming_and_partial_range()
    test_upload_synthetic_clip()
    print("\n==================================================")
    print("ALL 7 BACKEND E2E TESTS PASSED SUCCESSFULLY!")
    print("==================================================")
