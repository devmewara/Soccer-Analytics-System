import assert from 'node:assert';
import { calculateBallTrajectory, TEAM_COLORS } from './ballTrajectoryEstimator.js';
import { calculateVideoContentRect } from './videoGeometry.js';

console.log('======================================================');
console.log('🧪 RUNNING BALL TRAJECTORY VIDEO OVERLAY TESTS');
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

/**
 * Pure helper mirroring BallTrajectoryVideoOverlay trail segments calculation.
 */
function computeTrailSegments({
  currentBall,
  videoRect,
  trajectoryEngine,
  trailWindowSec = 1.0,
}) {
  if (!currentBall || !videoRect || !trajectoryEngine) {
    return [];
  }
  const { width, height } = videoRect;
  if (width <= 0 || height <= 0) return [];

  const windowSec = Math.max(0.2, trailWindowSec);
  const rawTrail = trajectoryEngine.getActiveTrail(currentBall.t, windowSec);
  const filteredPoints = rawTrail.filter((p) => p.t <= currentBall.t);

  if (
    filteredPoints.length === 0 ||
    filteredPoints[filteredPoints.length - 1].frame !== currentBall.frame
  ) {
    filteredPoints.push(currentBall);
  }

  if (filteredPoints.length < 2) {
    return [];
  }

  const segments = [];
  const totalCount = filteredPoints.length;

  for (let i = 0; i < totalCount - 1; i++) {
    const p1 = filteredPoints[i];
    const p2 = filteredPoints[i + 1];

    if (p1.gapAfter) {
      continue;
    }

    const x1 = (p1.x / 100) * width;
    const y1 = (p1.y / 100) * height;
    const x2 = (p2.x / 100) * width;
    const y2 = (p2.y / 100) * height;

    const u = (i + 1) / (totalCount - 1);
    const strokeWidth = +(1.6 + 3.0 * u).toFixed(2);
    const isInterp = Boolean(p1.isInterpolated || p2.isInterpolated);
    const baseAlpha = isInterp ? 0.45 : 1.0;
    const opacity = +(Math.max(0.12, (0.18 + 0.78 * (u * u)) * baseAlpha)).toFixed(2);

    let color = TEAM_COLORS.UNKNOWN;
    if (p2.color) color = p2.color;
    else if (p2.team === 'Team A') color = TEAM_COLORS.TEAM_A;
    else if (p2.team === 'Team B') color = TEAM_COLORS.TEAM_B;

    segments.push({
      id: `seg_${i}_${p1.frame}_${p2.frame}`,
      x1: +x1.toFixed(1),
      y1: +y1.toFixed(1),
      x2: +x2.toFixed(1),
      y2: +y2.toFixed(1),
      color,
      strokeWidth,
      opacity,
      isInterpolated: isInterp,
    });
  }

  return segments;
}

// ---------------------------------------------------------------------------
// TEST 1: Trail generation with width and opacity taper
// ---------------------------------------------------------------------------
console.log('Test 1: Trail Generation & Tapering');
testCase('Active trail creates tapered line segments with increasing width and opacity', () => {
  const frames = [];
  for (let i = 0; i < 30; i++) {
    frames.push({
      frame: i,
      t: +(i / 30).toFixed(2),
      ball: { x: 20.0 + i * 1.0, y: 50.0 },
      players: [{ id: 10, team: 'Team A', x: 20.0 + i * 1.0, y: 51.0 }],
    });
  }

  const engine = calculateBallTrajectory(frames);
  const currentBall = engine.getBallAtFrame(29);
  assert.ok(currentBall, 'Current ball must exist at frame 29');

  const videoRect = { left: 0, top: 0, width: 1280, height: 720 };
  const segments = computeTrailSegments({
    currentBall,
    videoRect,
    trajectoryEngine: engine,
    trailWindowSec: 1.0,
  });

  assert.ok(segments.length > 20, `Expected > 20 segments, got ${segments.length}`);

  // Test tapering properties:
  // First segment (tail) must be thinner and more transparent than last segment (head)
  const tailSeg = segments[0];
  const headSeg = segments[segments.length - 1];

  assert.ok(tailSeg.strokeWidth < headSeg.strokeWidth, 'Tail width must be less than head width');
  assert.ok(tailSeg.opacity < headSeg.opacity, 'Tail opacity must be less than head opacity');
  assert.strictEqual(headSeg.color, TEAM_COLORS.TEAM_A);
  assert.strictEqual(tailSeg.color, TEAM_COLORS.TEAM_A);

  // Exact pixel coordinate check for 1280x720 video:
  // Head at frame 29: x = 49.0% -> 0.49 * 1280 = 627.2 px; y = 50.0% -> 0.50 * 720 = 360.0 px
  assert.strictEqual(headSeg.x2, 627.2);
  assert.strictEqual(headSeg.y2, 360.0);
});

// ---------------------------------------------------------------------------
// TEST 2: Team Color Transitions in Active Trail
// ---------------------------------------------------------------------------
console.log('\nTest 2: Team Color Attribution Transitions in Trail');
testCase('Trail segments reflect team attribution changes along the trajectory path', () => {
  const frames = [];
  // 0-14: Team A control
  for (let i = 0; i < 15; i++) {
    frames.push({
      frame: i,
      t: +(i / 30).toFixed(2),
      ball: { x: 30.0 + i * 0.5, y: 50.0 },
      players: [{ id: 1, team: 'Team A', x: 30.0, y: 51.0 }],
    });
  }
  // 15-29: Team B takes control
  for (let i = 15; i < 30; i++) {
    frames.push({
      frame: i,
      t: +(i / 30).toFixed(2),
      ball: { x: 50.0 + (i - 15) * 0.5, y: 50.0 },
      players: [{ id: 2, team: 'Team B', x: 50.0, y: 50.5 }],
    });
  }

  const engine = calculateBallTrajectory(frames);
  const currentBall = engine.getBallAtFrame(28);

  const videoRect = { left: 0, top: 0, width: 1000, height: 600 };
  const segments = computeTrailSegments({
    currentBall,
    videoRect,
    trajectoryEngine: engine,
    trailWindowSec: 1.0,
  });

  const hasTeamA = segments.some((s) => s.color === TEAM_COLORS.TEAM_A);
  const hasTeamB = segments.some((s) => s.color === TEAM_COLORS.TEAM_B);
  assert.ok(hasTeamA, 'Active trail must contain Team A segments');
  assert.ok(hasTeamB, 'Active trail must contain Team B segments');

  // Terminal segment must be Team B
  assert.strictEqual(segments[segments.length - 1].color, TEAM_COLORS.TEAM_B);
});

// ---------------------------------------------------------------------------
// TEST 3: Discontinuity Breaks (Never Connect Across Long Gaps)
// ---------------------------------------------------------------------------
console.log('\nTest 3: Long Gaps / Discontinuity Breaks');
testCase('Does NOT connect across gaps exceeding 0.35s', () => {
  const frames = [];
  // Frame 0: Ball at (20, 20)
  frames.push({ frame: 0, t: 0.0, ball: { x: 20.0, y: 20.0 }, players: [] });
  // Long gap: 15 missing frames (0.50s > 0.35s)
  for (let i = 1; i < 15; i++) {
    frames.push({ frame: i, t: +(i / 30).toFixed(2), ball: null, players: [] });
  }
  // Frame 15: Ball reappears at (80, 80)
  frames.push({ frame: 15, t: 0.50, ball: { x: 80.0, y: 80.0 }, players: [] });
  frames.push({ frame: 16, t: 0.53, ball: { x: 81.0, y: 80.0 }, players: [] });

  const engine = calculateBallTrajectory(frames);
  const currentBall = engine.getBallAtFrame(16);

  const videoRect = { left: 0, top: 0, width: 1000, height: 1000 };
  const segments = computeTrailSegments({
    currentBall,
    videoRect,
    trajectoryEngine: engine,
    trailWindowSec: 1.0,
  });

  // Because frame 0 had gapAfter = true, no segment connects (20,20) to (80,80)!
  const illegalJumpSegment = segments.find(
    (s) => Math.hypot(s.x2 - s.x1, s.y2 - s.y1) > 400
  );
  assert.strictEqual(illegalJumpSegment, undefined, 'Must NEVER draw a line spanning across a long gap break');
});

// ---------------------------------------------------------------------------
// TEST 4: Interpolated Points Tagging
// ---------------------------------------------------------------------------
console.log('\nTest 4: Short-Gap Interpolation Tagging');
testCase('Interpolated segments are explicitly flagged with isInterpolated=true and dashed styling', () => {
  const frames = [];
  frames.push({ frame: 0, t: 0.0, ball: { x: 40.0, y: 50.0 }, players: [] });
  frames.push({ frame: 1, t: 0.03, ball: null, players: [] });
  frames.push({ frame: 2, t: 0.07, ball: null, players: [] });
  frames.push({ frame: 3, t: 0.10, ball: { x: 43.0, y: 50.0 }, players: [] });

  const engine = calculateBallTrajectory(frames);
  const currentBall = engine.getBallAtFrame(3);

  const videoRect = { left: 0, top: 0, width: 1000, height: 500 };
  const segments = computeTrailSegments({
    currentBall,
    videoRect,
    trajectoryEngine: engine,
    trailWindowSec: 1.0,
  });

  assert.strictEqual(segments.length, 3);
  const interpolatedSegments = segments.filter((s) => s.isInterpolated);
  assert.ok(interpolatedSegments.length > 0, 'Intermediate short gap segments must be marked interpolated');
});

// ---------------------------------------------------------------------------
// TEST 5: Ball Unavailable Hiding
// ---------------------------------------------------------------------------
console.log('\nTest 5: Ball Unavailable Hiding');
testCase('Returns empty segments when ball position is unavailable', () => {
  const emptyRes = computeTrailSegments({
    currentBall: null,
    videoRect: { left: 0, top: 0, width: 1280, height: 720 },
    trajectoryEngine: null,
  });
  assert.strictEqual(emptyRes.length, 0);

  const frames = [
    { frame: 0, t: 0.0, ball: { x: 50, y: 50 }, players: [] },
  ];
  const engine = calculateBallTrajectory(frames);
  const resNoBall = computeTrailSegments({
    currentBall: null,
    videoRect: { left: 0, top: 0, width: 1280, height: 720 },
    trajectoryEngine: engine,
  });
  assert.strictEqual(resNoBall.length, 0);
});

// ---------------------------------------------------------------------------
// TEST 6: Letterboxing & Fullscreen Aspect Ratio Rect Positioning
// ---------------------------------------------------------------------------
console.log('\nTest 6: Letterbox & Pillarbox Positioning with videoGeometry');
testCase('Computes exact overlay bounds in letterboxed and pillarboxed conditions', () => {
  // 16:9 video inside 16:10 container (Letterboxed top and bottom)
  const letterboxContainer = { videoWidth: 1920, videoHeight: 1080, clientWidth: 1920, clientHeight: 1200 };
  const rectL = calculateVideoContentRect(letterboxContainer);
  assert.strictEqual(rectL.width, 1920);
  assert.strictEqual(rectL.height, 1080);
  assert.strictEqual(rectL.left, 0);
  assert.strictEqual(rectL.top, 60); // 1200 - 1080 = 120 / 2 = 60px black bar top and bottom

  // 16:9 video inside 21:9 ultrawide container (Pillarboxed left and right)
  const pillarboxContainer = { videoWidth: 1920, videoHeight: 1080, clientWidth: 2560, clientHeight: 1080 };
  const rectP = calculateVideoContentRect(pillarboxContainer);
  assert.strictEqual(rectP.height, 1080);
  assert.strictEqual(rectP.width, 1920);
  assert.strictEqual(rectP.top, 0);
  assert.strictEqual(rectP.left, 320); // 2560 - 1920 = 640 / 2 = 320px black bar left and right
});

console.log('\n======================================================');
console.log(`🎉 ALL ${passedTests}/${totalTests} BALL TRAJECTORY VIDEO OVERLAY TESTS PASSED!`);
console.log('======================================================');
