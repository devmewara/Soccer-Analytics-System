import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import {
  calculateBallTrajectory,
  calculateDistance,
  computeBallToPlayerDistance,
  TEAM_COLORS,
} from './ballTrajectoryEstimator.js';

console.log('======================================================');
console.log('🧪 RUNNING BALL TRAJECTORY & ATTRIBUTION TEST SUITE');
console.log('======================================================\n');

let totalTests = 0;
let passedTests = 0;

function testCase(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ FAILED: ${name}`);
    console.error(err);
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// TEST 1: Stationary Ball with Team A Player Control
// ---------------------------------------------------------------------------
console.log('Test 1: Stationary Ball with Player Control');
testCase('Stationary ball near Team A player is attributed to Team A with high confidence', () => {
  const frames = [];
  for (let i = 0; i < 30; i++) {
    frames.push({
      frame: i,
      t: +(i / 30).toFixed(2),
      ball: { x: 50.0, y: 50.0 },
      players: [
        { id: 10, team: 'Team A', x: 50.5, y: 51.0, bbox: [49.0, 43.5, 52.0, 51.0] },
        { id: 20, team: 'Team B', x: 70.0, y: 50.0, bbox: [68.5, 42.5, 71.5, 50.0] },
      ],
    });
  }

  const result = calculateBallTrajectory(frames);
  assert.strictEqual(result.points.length, 30);
  assert.strictEqual(result.segments.length, 1);
  assert.strictEqual(result.segments[0].team, 'Team A');
  assert.strictEqual(result.segments[0].color, TEAM_COLORS.TEAM_A);

  const pt15 = result.getBallAtFrame(15);
  assert.ok(pt15);
  assert.strictEqual(pt15.team, 'Team A');
  assert.strictEqual(pt15.attributingPlayerId, 10);
  assert.ok(pt15.confidence >= 0.9);
  assert.strictEqual(pt15.isDetected, true);
  assert.strictEqual(pt15.isInterpolated, false);
});

// ---------------------------------------------------------------------------
// TEST 2: Team A to Team B Transition (Pass intercepted or Turnover)
// ---------------------------------------------------------------------------
console.log('\nTest 2: Team A to Team B Transition (Turnover / Interception)');
testCase('Ball passing from Team A to Team B cleanly transitions attribution and creates 2 segments', () => {
  const frames = [];
  // Frames 0-14: Team A Player 10 in contact
  for (let i = 0; i < 15; i++) {
    frames.push({
      frame: i,
      t: +(i / 30).toFixed(2),
      ball: { x: 30.0 + i * 0.1, y: 50.0 },
      players: [
        { id: 10, team: 'Team A', x: 30.0, y: 51.0 },
        { id: 25, team: 'Team B', x: 60.0, y: 50.0 },
      ],
    });
  }
  // Frames 15-29: Ball moves to Team B Player 25, who takes control
  for (let i = 15; i < 30; i++) {
    frames.push({
      frame: i,
      t: +(i / 30).toFixed(2),
      ball: { x: 59.0 + (i - 15) * 0.05, y: 50.0 },
      players: [
        { id: 10, team: 'Team A', x: 30.0, y: 51.0 },
        { id: 25, team: 'Team B', x: 59.5, y: 50.5 },
      ],
    });
  }

  const result = calculateBallTrajectory(frames);
  assert.strictEqual(result.points.length, 30);

  // Early points should be Team A
  const p0 = result.getBallAtFrame(0);
  assert.strictEqual(p0.team, 'Team A');

  // Later points should be Team B
  const p25 = result.getBallAtFrame(25);
  assert.strictEqual(p25.team, 'Team B');
  assert.strictEqual(p25.attributingPlayerId, 25);

  // Segments should record both teams
  const segA = result.segments.find((s) => s.team === 'Team A');
  const segB = result.segments.find((s) => s.team === 'Team B');
  assert.ok(segA, 'Team A segment must exist');
  assert.ok(segB, 'Team B segment must exist');
  assert.strictEqual(segA.color, TEAM_COLORS.TEAM_A);
  assert.strictEqual(segB.color, TEAM_COLORS.TEAM_B);
});

// ---------------------------------------------------------------------------
// TEST 3: Team B to Team A Transition
// ---------------------------------------------------------------------------
console.log('\nTest 3: Team B to Team A Transition');
testCase('Ball controlled by Team B transitioning to Team A updates correctly', () => {
  const frames = [];
  for (let i = 0; i < 10; i++) {
    frames.push({
      frame: i,
      t: +(i / 30).toFixed(2),
      ball: { x: 80.0, y: 40.0 },
      players: [{ id: 5, team: 'Team B', x: 80.5, y: 41.0 }],
    });
  }
  for (let i = 10; i < 20; i++) {
    frames.push({
      frame: i,
      t: +(i / 30).toFixed(2),
      ball: { x: 20.0, y: 40.0 },
      players: [{ id: 7, team: 'Team A', x: 20.2, y: 40.8 }],
    });
  }

  const result = calculateBallTrajectory(frames);
  assert.strictEqual(result.getBallAtFrame(5).team, 'Team B');
  assert.strictEqual(result.getBallAtFrame(15).team, 'Team A');
  assert.strictEqual(result.segments.length >= 2, true);
});

// ---------------------------------------------------------------------------
// TEST 4: Loose Ball (Open Space, No Nearby Players)
// ---------------------------------------------------------------------------
console.log('\nTest 4: Loose Ball in Empty Territory');
testCase('Ball rolling in open space with all players far away is attributed as Unknown', () => {
  const frames = [];
  for (let i = 0; i < 20; i++) {
    frames.push({
      frame: i,
      t: +(i / 30).toFixed(2),
      ball: { x: 50.0 + i * 0.2, y: 50.0 },
      players: [
        { id: 1, team: 'Team A', x: 10.0, y: 10.0 }, // distance ~50%
        { id: 2, team: 'Team B', x: 90.0, y: 90.0 }, // distance ~50%
      ],
    });
  }

  const result = calculateBallTrajectory(frames);
  assert.strictEqual(result.points.length, 20);
  for (const pt of result.points) {
    assert.strictEqual(pt.team, 'Unknown');
    assert.strictEqual(pt.color, TEAM_COLORS.UNKNOWN);
    assert.strictEqual(pt.reason, 'loose_ball');
  }
});

// ---------------------------------------------------------------------------
// TEST 5: Contested Ball (Tackle / Scrum with Both Teams)
// ---------------------------------------------------------------------------
console.log('\nTest 5: Contested Tackle / Scrum');
testCase('Ball within contact radius of both Team A and Team B simultaneously is marked Unknown', () => {
  const frames = [];
  for (let i = 0; i < 15; i++) {
    frames.push({
      frame: i,
      t: +(i / 30).toFixed(2),
      ball: { x: 50.0, y: 50.0 },
      players: [
        { id: 11, team: 'Team A', x: 51.0, y: 51.0 }, // dist ~1.4% (contact)
        { id: 22, team: 'Team B', x: 49.0, y: 49.5 }, // dist ~1.1% (contact)
      ],
    });
  }

  const result = calculateBallTrajectory(frames);
  assert.strictEqual(result.points.length, 15);
  for (const pt of result.points) {
    assert.strictEqual(pt.team, 'Unknown');
    assert.strictEqual(pt.reason, 'contested_tackle');
    assert.strictEqual(pt.color, TEAM_COLORS.UNKNOWN);
  }
});

// ---------------------------------------------------------------------------
// TEST 6: Missing Detections and Short-Gap Interpolation (<= 0.35s)
// ---------------------------------------------------------------------------
console.log('\nTest 6: Short-Gap Missing Detection Interpolation (<= 0.35s)');
testCase('Missing ball detections for 0.20s (6 frames) are cleanly interpolated and marked estimated', () => {
  const frames = [];
  // Frame 0: Ball at (40, 50)
  frames.push({
    frame: 0,
    t: 0.0,
    ball: { x: 40.0, y: 50.0 },
    players: [{ id: 1, team: 'Team A', x: 39.0, y: 50.0 }],
  });
  // Frames 1-5: Missing ball (null) for dt = 0.2s (6 frames at 30fps)
  for (let i = 1; i <= 5; i++) {
    frames.push({
      frame: i,
      t: +(i / 30).toFixed(2),
      ball: null,
      players: [{ id: 1, team: 'Team A', x: 39.0, y: 50.0 }],
    });
  }
  // Frame 6: Ball reappears at (46, 50) -> moved 6% in 0.2s = 30%/s (plausible)
  frames.push({
    frame: 6,
    t: 0.20,
    ball: { x: 46.0, y: 50.0 },
    players: [{ id: 1, team: 'Team A', x: 45.0, y: 50.0 }],
  });

  const result = calculateBallTrajectory(frames);
  // Total trajectory points should be 7 (frame 0, 1, 2, 3, 4, 5, 6)
  assert.strictEqual(result.points.length, 7);

  // Frame 0: detected
  const p0 = result.getBallAtFrame(0);
  assert.strictEqual(p0.isDetected, true);
  assert.strictEqual(p0.isInterpolated, false);
  assert.strictEqual(p0.x, 40.0);

  // Frame 3: interpolated
  const p3 = result.getBallAtFrame(3);
  assert.ok(p3, 'Frame 3 must be interpolated');
  assert.strictEqual(p3.isDetected, false);
  assert.strictEqual(p3.isInterpolated, true);
  assert.strictEqual(p3.x, 43.0); // Exact linear midpoint
  assert.strictEqual(p3.y, 50.0);

  // Frame 6: detected
  const p6 = result.getBallAtFrame(6);
  assert.strictEqual(p6.isDetected, true);
  assert.strictEqual(p6.isInterpolated, false);
  assert.strictEqual(p6.x, 46.0);

  assert.strictEqual(result.summary.detectedBallFrames, 2);
  assert.strictEqual(result.summary.interpolatedBallFrames, 5);
});

// ---------------------------------------------------------------------------
// TEST 7: Long Detection Gaps (> 0.35s)
// ---------------------------------------------------------------------------
console.log('\nTest 7: Long Detection Gaps (> 0.35s)');
testCase('Missing ball detections for 1.0s (30 frames) are NOT interpolated and create a trajectory break', () => {
  const frames = [];
  frames.push({ frame: 0, t: 0.0, ball: { x: 20.0, y: 30.0 }, players: [] });
  for (let i = 1; i <= 30; i++) {
    frames.push({ frame: i, t: +(i / 30).toFixed(2), ball: null, players: [] });
  }
  frames.push({ frame: 31, t: 1.03, ball: { x: 70.0, y: 80.0 }, players: [] });

  const result = calculateBallTrajectory(frames);
  // Must NOT interpolate across 1-second gap
  assert.strictEqual(result.points.length, 2);
  assert.strictEqual(result.points[0].frame, 0);
  assert.strictEqual(result.points[1].frame, 31);
  assert.strictEqual(result.points[0].gapAfter, true);
  assert.strictEqual(result.summary.interpolatedBallFrames, 0);
});

// ---------------------------------------------------------------------------
// TEST 8: Implausible Position Jumps (Teleport / Camera Cut)
// ---------------------------------------------------------------------------
console.log('\nTest 8: Implausible Position Jumps (> 80%/s in short time)');
testCase('Ball jumping 60% across the screen in 0.1s is rejected as camera cut/teleport', () => {
  const frames = [
    { frame: 10, t: 0.33, ball: { x: 10.0, y: 10.0 }, players: [] },
    // Missing 2 frames (dt = 0.1s)
    { frame: 11, t: 0.36, ball: null, players: [] },
    { frame: 12, t: 0.40, ball: null, players: [] },
    // Ball appears at (90, 90) -> displacement ~113% in 0.1s = 1130%/s (impossible)
    { frame: 13, t: 0.43, ball: { x: 90.0, y: 90.0 }, players: [] },
  ];

  const result = calculateBallTrajectory(frames);
  assert.strictEqual(result.points.length, 2);
  assert.strictEqual(result.summary.interpolatedBallFrames, 0);
  assert.strictEqual(result.points[0].gapAfter, true);
});

// ---------------------------------------------------------------------------
// TEST 9: Empty, Null, Malformed Inputs
// ---------------------------------------------------------------------------
console.log('\nTest 9: Empty and Malformed Inputs');
testCase('Empty array and malformed inputs return safe fallbacks without throwing', () => {
  const emptyRes = calculateBallTrajectory([]);
  assert.strictEqual(emptyRes.points.length, 0);
  assert.strictEqual(emptyRes.getBallAtFrame(0), null);
  assert.strictEqual(emptyRes.getBallAtTime(0), null);
  assert.strictEqual(emptyRes.getActiveTrail(0).length, 0);

  const nullRes = calculateBallTrajectory(null);
  assert.strictEqual(nullRes.points.length, 0);

  const malformedRes = calculateBallTrajectory([
    null,
    undefined,
    {},
    { frame: 1, t: 0.1, ball: { x: NaN, y: 'bad' } },
  ]);
  assert.strictEqual(malformedRes.points.length, 0);
});

// ---------------------------------------------------------------------------
// TEST 10: Lookup Helpers (getBallAtFrame, getBallAtTime, getActiveTrail)
// ---------------------------------------------------------------------------
console.log('\nTest 10: Fast Lookup Helpers');
testCase('Temporal binary search and sliding window trail query return accurate slices', () => {
  const frames = [];
  for (let i = 0; i < 60; i++) {
    frames.push({
      frame: i,
      t: +(i / 30).toFixed(2),
      ball: { x: 10.0 + i * 0.5, y: 40.0 },
      players: [{ id: 1, team: 'Team A', x: 10.0 + i * 0.5, y: 41.0 }],
    });
  }

  const result = calculateBallTrajectory(frames);

  // Exact frame query
  const pt20 = result.getBallAtFrame(20);
  assert.strictEqual(pt20.frame, 20);
  assert.strictEqual(pt20.x, 20.0);

  // Time binary search query at t = 1.0s (frame 30)
  const ptTime = result.getBallAtTime(1.0);
  assert.ok(ptTime);
  assert.strictEqual(ptTime.frame, 30);

  // Active trail in 0.5s window at t = 1.5s (window: 1.0s to 1.5s -> frames 30..45)
  const trail = result.getActiveTrail(1.5, 0.5);
  assert.ok(trail.length >= 15);
  assert.strictEqual(trail[0].frame >= 30, true);
  assert.strictEqual(trail[trail.length - 1].frame <= 46, true);
});

// ---------------------------------------------------------------------------
// TEST 11: Real-World Match Footage Verification (Argentina vs Cabo Verde 655 frames)
// ---------------------------------------------------------------------------
console.log('\nTest 11: Real Match Clip Benchmark (655 Frames from CV Pipeline)');
testCase('Processes real match analytics JSON and returns coherent trajectory metrics', () => {
  const analyticsPath = path.resolve('backend/uploads/a5b6266a-03f5-4e05-ab88-298fb47cdb3d_analytics.json');
  assert.ok(fs.existsSync(analyticsPath), `File exists at ${analyticsPath}`);

  const raw = JSON.parse(fs.readFileSync(analyticsPath, 'utf8'));
  const frameTracking = raw.frame_tracking;
  assert.strictEqual(frameTracking.length, 655);

  const t0 = performance.now();
  const result = calculateBallTrajectory(frameTracking);
  const durationMs = performance.now() - t0;

  console.log(`  ⏱️ Processed 655 frames in ${durationMs.toFixed(2)} ms`);
  assert.ok(durationMs < 50.0, 'Performance benchmark: must process 655 frames in under 50ms');

  // Verify non-zero trajectory
  assert.ok(result.points.length > 100, `Expected > 100 points, got ${result.points.length}`);
  assert.strictEqual(result.summary.totalFrames, 655);
  assert.strictEqual(result.summary.detectedBallFrames, 117);
  assert.ok(result.summary.interpolatedBallFrames > 0, 'Should interpolate short dropout gaps');

  // Verify coordinates are bounded (0-100)
  for (const pt of result.points) {
    assert.ok(pt.x >= 0.0 && pt.x <= 100.0, `X coordinate out of bounds: ${pt.x}`);
    assert.ok(pt.y >= 0.0 && pt.y <= 100.0, `Y coordinate out of bounds: ${pt.y}`);
    assert.ok(['Team A', 'Team B', 'Unknown'].includes(pt.team));
    assert.ok(['#38BDF8', '#F43F5E', '#94A3B8'].includes(pt.color));
  }

  // Frame 71 was ball at (77.1, 87.2) near Player #19 (Team B)
  const p71 = result.getBallAtFrame(71);
  assert.ok(p71);
  assert.strictEqual(p71.team, 'Team B');
  assert.strictEqual(p71.color, TEAM_COLORS.TEAM_B);

  console.log(`  📊 Detected ball frames: ${result.summary.detectedBallFrames}`);
  console.log(`  📊 Interpolated frames: ${result.summary.interpolatedBallFrames}`);
  console.log(`  📊 Total trajectory points: ${result.summary.totalTrajectoryPoints}`);
  console.log(`  📊 Trajectory segments: ${result.summary.segmentsCount}`);
  console.log(`  📊 Possession Split: Team A: ${result.summary.possessionPct['Team A']}%, Team B: ${result.summary.possessionPct['Team B']}%, Unknown: ${result.summary.possessionPct['Unknown']}%`);
});

console.log('\n======================================================');
console.log(`🎉 ALL ${passedTests}/${totalTests} BALL TRAJECTORY TESTS PASSED SUCCESSFULLY!`);
console.log('======================================================');
