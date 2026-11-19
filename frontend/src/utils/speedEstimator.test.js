/**
 * Test suite for speedEstimator.js
 * 
 * Tests:
 * 1. Stationary players (micro-jitter suppression -> Idle)
 * 2. Moving players (moderate velocity -> Moving)
 * 3. Fast moving players (burst velocity -> Fast movement)
 * 4. Missing detections (temporary drops under maxGapSec)
 * 5. Camera-cut-like gaps (> 0.5s -> history reset, no false spikes)
 * 6. Edge cases (empty array, null, NaN coordinates, duplicate timestamps)
 * 7. Query helpers (byFrameIndex, byFrameNumber, getSpeed, getFramePlayers)
 * 8. Real-world dataset verification (655 frames from Argentina vs Cabo Verde)
 */

import {
  calculatePlayerSpeeds,
  getSpeedTier,
  DEFAULT_SPEED_OPTIONS,
  DEFAULT_SPEED_RECORD,
} from './speedEstimator.js';
import fs from 'fs';
import path from 'path';

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  passedTests++;
  console.log(`  ✓ ${message}`);
}

console.log('\n======================================================');
console.log('🧪 RUNNING SPEED ESTIMATOR TEST SUITE');
console.log('======================================================\n');

// ---------------------------------------------------------------------------
// TEST 1: Stationary Player with Detection Jitter
// ---------------------------------------------------------------------------
console.log('Test 1: Stationary player with subtle detection jitter (Idle)');
{
  const frames = [];
  const fps = 30;
  // 30 frames (1 second). Player stays around (50, 50) with ±0.15% bounding-box noise
  for (let i = 0; i < 30; i++) {
    const jitterX = (i % 2 === 0 ? 0.1 : -0.1);
    const jitterY = (i % 3 === 0 ? 0.05 : -0.05);
    frames.push({
      frame: i,
      t: Math.round((i / fps) * 100) / 100,
      players: [{ id: 10, team: 'Team A', x: 50.0 + jitterX, y: 50.0 + jitterY }],
    });
  }

  const result = calculatePlayerSpeeds(frames);
  assert(result.summary.totalFrames === 30, 'Total frames is 30');
  assert(result.summary.uniquePlayers === 1, 'Tracked 1 unique player');

  // Check frames after temporal window is saturated (e.g. frame 15 to 29)
  for (let i = 10; i < 30; i++) {
    const p10 = result.getSpeed(i, 10);
    assert(p10.speed < 2.0, `Frame ${i}: Stationary player speed (${p10.speed} %/s) is strictly < 2.0 %/s`);
    assert(p10.label === 'Idle', `Frame ${i}: Label is 'Idle' (got ${p10.label})`);
    assert(p10.tier === 'idle', `Frame ${i}: Tier is 'idle'`);
  }
}

// ---------------------------------------------------------------------------
// TEST 2: Moderate Moving Player (Moving)
// ---------------------------------------------------------------------------
console.log('\nTest 2: Moderate moving player (Moving)');
{
  const frames = [];
  const fps = 30;
  // Player moves at ~5.0 %/second along X axis for 1.5 seconds (45 frames)
  // Each frame (1/30s), moves ~0.167%
  for (let i = 0; i < 45; i++) {
    const t = Math.round((i / fps) * 100) / 100;
    frames.push({
      frame: i,
      t,
      players: [{ id: 7, team: 'Team B', x: 20.0 + (t * 5.0), y: 40.0 }],
    });
  }

  const result = calculatePlayerSpeeds(frames);
  // After initial ramp-up (~frame 12, ~0.4s), speed should stabilize near 5.0 %/s
  const midRecord = result.getSpeed(25, 7);
  assert(midRecord.speed >= 4.0 && midRecord.speed <= 6.0, `Mid-run speed is ~5.0 %/s (got ${midRecord.speed} %/s)`);
  assert(midRecord.label === 'Moving', `Label is 'Moving' (got ${midRecord.label})`);
  assert(midRecord.tier === 'moving', `Tier is 'moving'`);
  assert(midRecord.direction.dx > 0.95, `Direction dx points right (got ${midRecord.direction.dx})`);
}

// ---------------------------------------------------------------------------
// TEST 3: Fast Moving Player (Fast movement)
// ---------------------------------------------------------------------------
console.log('\nTest 3: Fast moving player (Fast movement)');
{
  const frames = [];
  const fps = 30;
  // Player moves at ~12.0 %/second across the screen
  for (let i = 0; i < 30; i++) {
    const t = Math.round((i / fps) * 100) / 100;
    frames.push({
      frame: i,
      t,
      players: [{ id: 9, team: 'Team A', x: 10.0 + (t * 12.0), y: 50.0 + (t * 4.0) }],
    });
  }

  const result = calculatePlayerSpeeds(frames);
  const endRecord = result.getSpeed(25, 9);
  assert(endRecord.speed >= 8.0, `Fast moving player speed is >= 8.0 %/s (got ${endRecord.speed} %/s)`);
  assert(endRecord.label === 'Fast movement', `Label is 'Fast movement' (got ${endRecord.label})`);
  assert(endRecord.tier === 'fast', `Tier is 'fast'`);
}

// ---------------------------------------------------------------------------
// TEST 4: Missing Detections (Short Drop < 0.5s)
// ---------------------------------------------------------------------------
console.log('\nTest 4: Missing detections (Temporary drop < 0.5s)');
{
  const frames = [
    { frame: 0, t: 0.00, players: [{ id: 14, x: 30.0, y: 30.0 }] },
    { frame: 1, t: 0.10, players: [{ id: 14, x: 30.5, y: 30.0 }] },
    { frame: 2, t: 0.20, players: [{ id: 14, x: 31.0, y: 30.0 }] },
    // Player 14 is occluded / undetected for frames 3 & 4 (gap = 0.25s)
    { frame: 3, t: 0.30, players: [] },
    { frame: 4, t: 0.40, players: [] },
    // Reappears at t = 0.45s (gap = 0.25s < maxGapSec 0.5s)
    { frame: 5, t: 0.45, players: [{ id: 14, x: 32.5, y: 30.0 }] },
  ];

  const result = calculatePlayerSpeeds(frames);
  // Missing frame query returns safe default
  const missingQuery = result.getSpeed(3, 14);
  assert(missingQuery.isValid === false, 'Missing frame query returns isValid=false');
  assert(missingQuery.speed === 0.0, 'Missing frame query returns speed=0');

  // Reappearance frame within 0.5s successfully retains tracking continuity
  const reappeared = result.getSpeed(5, 14);
  assert(reappeared.isValid === true, 'Reappeared player query returns isValid=true');
  assert(reappeared.speed > 0, `Reappeared player computed speed (${reappeared.speed} %/s)`);
}

// ---------------------------------------------------------------------------
// TEST 5: Camera-Cut-Like Gap (> 0.5s -> Discontinuity Reset)
// ---------------------------------------------------------------------------
console.log('\nTest 5: Camera-cut-like gap (> 0.5s -> Discontinuity Reset)');
{
  const frames = [
    { frame: 0, t: 0.00, players: [{ id: 5, x: 20.0, y: 20.0 }] },
    { frame: 1, t: 0.25, players: [{ id: 5, x: 21.0, y: 20.0 }] },
    // Sudden camera transition or cut: 0.8s gap! Position jumps from (21, 20) to (80, 80)
    { frame: 2, t: 1.05, players: [{ id: 5, x: 80.0, y: 80.0 }] },
    { frame: 3, t: 1.30, players: [{ id: 5, x: 80.5, y: 80.0 }] },
  ];

  const result = calculatePlayerSpeeds(frames);
  const cutFrameRecord = result.getSpeed(2, 5);
  // Frame 2 is the first frame after a 0.8s cut. History MUST have been reset.
  // Without reset, displacement would be hypot(59, 60) ≈ 84% over 0.8s = 105 %/s spike!
  assert(cutFrameRecord.rawSpeed === 0, `Cut frame rawSpeed is reset to 0 (got ${cutFrameRecord.rawSpeed} %/s)`);
  assert(cutFrameRecord.speed === 0, `Cut frame smoothed speed is reset to 0 (got ${cutFrameRecord.speed} %/s)`);
  assert(cutFrameRecord.label === 'Idle', `Cut frame label is 'Idle'`);

  // Frame 3 has fresh baseline after cut
  const postCutRecord = result.getSpeed(3, 5);
  assert(postCutRecord.speed < 3.0, `Post-cut speed settles to small movement (${postCutRecord.speed} %/s)`);
}

// ---------------------------------------------------------------------------
// TEST 6: Robust Edge Cases
// ---------------------------------------------------------------------------
console.log('\nTest 6: Robust edge cases (empty, null, NaN, duplicate timestamps)');
{
  // 6a: Empty & null inputs
  const emptyRes = calculatePlayerSpeeds([]);
  assert(emptyRes.summary.totalFrames === 0, 'Empty array returns totalFrames=0');
  assert(emptyRes.getSpeed(0, 1).isValid === false, 'Empty array getSpeed returns default');

  const nullRes = calculatePlayerSpeeds(null);
  assert(nullRes.summary.totalFrames === 0, 'Null input safely handled');

  // 6b: Corrupted coordinates and duplicate timestamps
  const corruptedFrames = [
    { frame: 0, t: 1.0, players: [{ id: 1, x: 'bad', y: null }, { id: 2, x: NaN, y: 50 }] },
    { frame: 1, t: 1.0, players: [{ id: 1, x: 50.0, y: 50.0 }] }, // duplicate t
    { frame: 2, t: 1.0, players: [{ id: 1, x: 50.0, y: 50.0 }] }, // duplicate t
    { frame: 3, t: 1.25, players: [{ id: 1, x: 52.0, y: 50.0 }] },
  ];

  const corruptRes = calculatePlayerSpeeds(corruptedFrames);
  assert(corruptRes.summary.totalFrames === 4, 'Handled corrupted frames without error');
  const validP1 = corruptRes.getSpeed(3, 1);
  assert(validP1.isValid === true, 'Player 1 recovered valid calculation on valid frame');
}

// ---------------------------------------------------------------------------
// TEST 7: Lookup Helpers & Query Performance
// ---------------------------------------------------------------------------
console.log('\nTest 7: Query helpers (byFrameIndex, byFrameNumber, getFramePlayers)');
{
  const frames = [
    { frame: 100, t: 3.33, players: [{ id: 10, x: 40, y: 40 }, { id: 20, x: 60, y: 60 }] },
    { frame: 101, t: 3.58, players: [{ id: 10, x: 42, y: 40 }, { id: 20, x: 60, y: 60 }] },
  ];

  const result = calculatePlayerSpeeds(frames);
  // Test query by frame index (0, 1)
  assert(result.getSpeed(0, 10).playerId === 10, 'Queried by frameIndex 0');
  // Test query by frame number (100, 101)
  assert(result.getSpeed(101, 10).playerId === 10, 'Queried by frameNumber 101');
  // Test getFramePlayers
  const frame0Players = result.getFramePlayers(0);
  assert(frame0Players.length === 2, 'getFramePlayers(0) returned 2 players');
  const frame101Players = result.getFramePlayers(101);
  assert(frame101Players.length === 2, 'getFramePlayers(101) returned 2 players');
}

// ---------------------------------------------------------------------------
// TEST 8: Real Match Dataset Verification (655 frames)
// ---------------------------------------------------------------------------
console.log('\nTest 8: Real-world match footage verification (655 frames from Argentina vs Cabo Verde)');
{
  const analyticsPath = path.resolve('backend/uploads/a5b6266a-03f5-4e05-ab88-298fb47cdb3d_analytics.json');
  if (fs.existsSync(analyticsPath)) {
    const rawData = fs.readFileSync(analyticsPath, 'utf8');
    const analytics = JSON.parse(rawData);
    const tracking = analytics.frame_tracking || [];

    assert(tracking.length === 655, `Loaded all 655 frames from real analytics file`);

    const tStart = performance.now();
    const result = calculatePlayerSpeeds(tracking);
    const tEnd = performance.now();
    const durationMs = Math.round((tEnd - tStart) * 100) / 100;

    console.log(`  ⏱️ Processed 655 frames in ${durationMs} ms`);
    assert(durationMs < 50, `Performance benchmark: 655 frames processed in < 50ms (took ${durationMs}ms)`);
    assert(result.summary.totalFrames === 655, 'Total frames is 655');
    assert(result.summary.uniquePlayers === 38, `Tracked 38 unique players (got ${result.summary.uniquePlayers})`);
    assert(result.summary.maxSpeed > 0 && result.summary.maxSpeed < 100, `Max speed is physically reasonable (${result.summary.maxSpeed} %/s)`);

    // Sample player 1 at mid-video (frame 300)
    const p1Record = result.getSpeed(300, 1);
    assert(p1Record.isValid === true, `Player 1 at frame 300 is valid`);
    assert(typeof p1Record.speed === 'number', `Player 1 speed is a number: ${p1Record.speed} %/s`);
    assert(['Idle', 'Moving', 'Fast movement'].includes(p1Record.label), `Player 1 label is conservative: ${p1Record.label}`);
  } else {
    console.log('  ⚠️ Real analytics file not found, skipping real-file benchmark');
  }
}

console.log('\n======================================================');
console.log(`🎉 ALL TESTS PASSED: ${passedTests}/${totalTests} assertions`);
console.log('======================================================\n');
