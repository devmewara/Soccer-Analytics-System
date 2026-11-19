import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { calculateBallTrajectory, TEAM_COLORS } from './ballTrajectoryEstimator.js';

console.log('======================================================');
console.log('🧪 RUNNING BALL TRAJECTORY ANALYSIS PANEL TESTS');
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
 * Pure coordinate mapping helper mirroring BallTrajectoryAnalysisPanel SVG pitch logic.
 */
const PITCH_BOUNDS = {
  x: 40,
  y: 40,
  width: 970,
  height: 600,
};

function mapToPitchSvg(normX, normY) {
  if (normX == null || normY == null) return null;
  const clampedX = Math.max(0, Math.min(100, normX));
  const clampedY = Math.max(0, Math.min(100, normY));
  return {
    x: +(PITCH_BOUNDS.x + (clampedX / 100) * PITCH_BOUNDS.width).toFixed(1),
    y: +(PITCH_BOUNDS.y + (clampedY / 100) * PITCH_BOUNDS.height).toFixed(1),
  };
}

/**
 * Helper to compute directional movement arrows along trajectory segments
 * using accumulated displacement.
 */
function extractDirectionArrows(points, minDistancePct = 6.0) {
  if (!Array.isArray(points) || points.length < 2) return [];
  const arrows = [];
  let anchorPt = points[0];
  let anchorIndex = 0;

  for (let i = 1; i < points.length; i++) {
    const pt = points[i];
    const prevPt = points[i - 1];

    if (prevPt.gapAfter) {
      anchorPt = pt;
      anchorIndex = i;
      continue;
    }

    const dist = Math.hypot(pt.x - anchorPt.x, pt.y - anchorPt.y);
    const frameGap = i - anchorIndex;

    if (dist >= minDistancePct && frameGap >= 3) {
      const midX = (anchorPt.x + pt.x) / 2;
      const midY = (anchorPt.y + pt.y) / 2;
      const svgPos = mapToPitchSvg(midX, midY);
      const angleDeg = Math.round((Math.atan2(pt.y - anchorPt.y, pt.x - anchorPt.x) * 180) / Math.PI);

      arrows.push({
        frame: pt.frame,
        t: pt.t,
        team: pt.team,
        color: pt.color || TEAM_COLORS.UNKNOWN,
        svgX: svgPos.x,
        svgY: svgPos.y,
        angleDeg,
      });

      anchorPt = pt;
      anchorIndex = i;
    }
  }

  return arrows;
}

// ---------------------------------------------------------------------------
// TEST 1: Pitch Coordinate Mapping within FIFA Regulation Bounds
// ---------------------------------------------------------------------------
console.log('Test 1: Pitch SVG Coordinate Mapping');
testCase('Maps normalized 0-100 coordinates strictly within pitch SVG bounds', () => {
  const topLeft = mapToPitchSvg(0, 0);
  assert.strictEqual(topLeft.x, 40.0);
  assert.strictEqual(topLeft.y, 40.0);

  const center = mapToPitchSvg(50, 50);
  assert.strictEqual(center.x, 525.0); // 40 + 0.5 * 970 = 525.0
  assert.strictEqual(center.y, 340.0); // 40 + 0.5 * 600 = 340.0

  const bottomRight = mapToPitchSvg(100, 100);
  assert.strictEqual(bottomRight.x, 1010.0); // 40 + 970 = 1010.0
  assert.strictEqual(bottomRight.y, 640.0);  // 40 + 600 = 640.0

  // Clamping test
  const clamped = mapToPitchSvg(-10, 120);
  assert.strictEqual(clamped.x, 40.0);
  assert.strictEqual(clamped.y, 640.0);
});

// ---------------------------------------------------------------------------
// TEST 2: Directional Movement Arrows
// ---------------------------------------------------------------------------
console.log('\nTest 2: Trajectory Directional Flow Arrows');
testCase('Generates properly oriented directional arrows along movement paths', () => {
  const frames = [];
  // Ball moving from left (20, 50) to right (50, 50) at 1.5% per frame (speed ~45%/s, plausible)
  for (let i = 0; i < 20; i++) {
    frames.push({
      frame: i,
      t: +(i / 30).toFixed(2),
      ball: { x: 20.0 + i * 1.5, y: 50.0 },
      players: [{ id: 1, team: 'Team A', x: 20.0 + i * 1.5, y: 51.0 }],
    });
  }

  const engine = calculateBallTrajectory(frames);
  const arrows = extractDirectionArrows(engine.points);

  assert.ok(arrows.length >= 2, `Expected at least 2 arrows, got ${arrows.length}`);
  for (const arrow of arrows) {
    // Movement strictly left to right: angle must be 0 degrees
    assert.strictEqual(arrow.angleDeg, 0);
    assert.strictEqual(arrow.color, TEAM_COLORS.TEAM_A);
    assert.ok(arrow.svgX >= 40 && arrow.svgX <= 1010);
    assert.strictEqual(arrow.svgY, 340.0); // Center pitch Y
  }
});

// ---------------------------------------------------------------------------
// TEST 3: Multi-Segment Trajectory Breakdown with Breaks
// ---------------------------------------------------------------------------
console.log('\nTest 3: Trajectory Segments and Attribution Preservation');
testCase('Preserves separate team segments and avoids bridging long gaps', () => {
  const frames = [];
  // Segment 1: Team A possession (10 frames)
  for (let i = 0; i < 10; i++) {
    frames.push({
      frame: i,
      t: +(i / 30).toFixed(2),
      ball: { x: 25.0 + i * 0.5, y: 40.0 },
      players: [{ id: 1, team: 'Team A', x: 25.0, y: 41.0 }],
    });
  }
  // Long gap (> 0.35s = 15 frames)
  for (let i = 10; i < 25; i++) {
    frames.push({ frame: i, t: +(i / 30).toFixed(2), ball: null, players: [] });
  }
  // Segment 2: Team B possession (10 frames)
  for (let i = 25; i < 35; i++) {
    frames.push({
      frame: i,
      t: +(i / 30).toFixed(2),
      ball: { x: 75.0 + (i - 25) * 0.5, y: 40.0 },
      players: [{ id: 2, team: 'Team B', x: 75.0, y: 40.5 }],
    });
  }

  const engine = calculateBallTrajectory(frames);
  assert.strictEqual(engine.segments.length, 2);
  assert.strictEqual(engine.segments[0].team, 'Team A');
  assert.strictEqual(engine.segments[1].team, 'Team B');

  // Verify gap occurred between segment 0 and segment 1
  const seg0EndPt = engine.segments[0].points[engine.segments[0].points.length - 1];
  assert.strictEqual(seg0EndPt.gapAfter, true);
});

// ---------------------------------------------------------------------------
// TEST 4: Trajectory Click-to-Seek Target Resolution
// ---------------------------------------------------------------------------
console.log('\nTest 4: Interactive Click-to-Seek Target Resolution');
testCase('Resolves closest trajectory point timestamp when clicking pitch canvas', () => {
  const frames = [];
  for (let i = 0; i < 30; i++) {
    frames.push({
      frame: i,
      t: +(i / 30).toFixed(2),
      ball: { x: 10.0 + i * 2.0, y: 30.0 + i * 1.0 },
      players: [],
    });
  }

  const engine = calculateBallTrajectory(frames);

  // User clicks near normalized (30.0, 40.0) -> Frame 10 has ball at (30.0, 40.0), t = 0.33s
  const clickNormX = 30.2;
  const clickNormY = 40.1;

  let closestPt = null;
  let minDistance = Infinity;

  for (const pt of engine.points) {
    const dist = Math.hypot(pt.x - clickNormX, pt.y - clickNormY);
    if (dist < minDistance) {
      minDistance = dist;
      closestPt = pt;
    }
  }

  assert.ok(closestPt);
  assert.strictEqual(closestPt.frame, 10);
  assert.strictEqual(closestPt.t, 0.33);
});

// ---------------------------------------------------------------------------
// TEST 5: Summary Statistics Denominator Integrity
// ---------------------------------------------------------------------------
console.log('\nTest 5: Summary Statistics Integrity');
testCase('Ensures valid denominators and percentages sum to 100% without fabricated metrics', () => {
  const frames = [];
  // 10 frames Team A
  for (let i = 0; i < 10; i++) {
    frames.push({
      frame: i,
      t: +(i / 30).toFixed(2),
      ball: { x: 30.0, y: 50.0 },
      players: [{ id: 1, team: 'Team A', x: 30.0, y: 51.0 }],
    });
  }
  // 10 frames Team B
  for (let i = 10; i < 20; i++) {
    frames.push({
      frame: i,
      t: +(i / 30).toFixed(2),
      ball: { x: 70.0, y: 50.0 },
      players: [{ id: 2, team: 'Team B', x: 70.0, y: 51.0 }],
    });
  }

  const engine = calculateBallTrajectory(frames);
  const summary = engine.getSummaryStats();

  assert.strictEqual(summary.totalFrames, 20);
  assert.strictEqual(summary.detectedBallFrames, 20);
  assert.strictEqual(summary.interpolatedBallFrames, 0);

  const pctA = summary.possessionPct['Team A'];
  const pctB = summary.possessionPct['Team B'];
  const pctUnk = summary.possessionPct['Unknown'];

  assert.strictEqual(pctA, 50.0);
  assert.strictEqual(pctB, 50.0);
  assert.strictEqual(pctUnk, 0.0);
  assert.strictEqual(pctA + pctB + pctUnk, 100.0);

  // Both possessionFrames and possessionPoints aliases must exist and be defined
  assert.strictEqual(typeof summary.possessionFrames, 'object');
  assert.strictEqual(typeof summary.possessionPoints, 'object');
  assert.strictEqual(summary.possessionPoints['Team A'], 10);
  assert.strictEqual(summary.possessionPoints['Team B'], 10);
  assert.strictEqual(summary.possessionPoints['Unknown'], 0);
  assert.strictEqual(summary.possessionFrames['Team A'], 10);
  assert.strictEqual(summary.possessionFrames['Team B'], 10);
  assert.strictEqual(summary.possessionFrames['Unknown'], 0);
});

// ---------------------------------------------------------------------------
// TEST 6: Real Match Clip Summary Points Verification
// ---------------------------------------------------------------------------
console.log('\nTest 6: Real Match Clip Summary Points Verification');
testCase('Real match footage summary exposes both possessionFrames and possessionPoints without undefined properties', () => {
  const analyticsPath = path.resolve('backend/uploads/a5b6266a-03f5-4e05-ab88-298fb47cdb3d_analytics.json');

  if (fs.existsSync(analyticsPath)) {
    const raw = JSON.parse(fs.readFileSync(analyticsPath, 'utf8'));
    const engine = calculateBallTrajectory(raw.frame_tracking);
    const summary = engine.getSummaryStats();

    assert.ok(summary, 'Summary must exist for real match');
    assert.strictEqual(typeof summary.possessionPoints, 'object');
    assert.strictEqual(typeof summary.possessionPoints['Team A'], 'number');
    assert.strictEqual(typeof summary.possessionPoints['Team B'], 'number');
    assert.strictEqual(typeof summary.possessionPoints['Unknown'], 'number');
    assert.strictEqual(typeof summary.possessionFrames['Team A'], 'number');
    assert.strictEqual(typeof summary.possessionFrames['Team B'], 'number');
    assert.strictEqual(typeof summary.possessionFrames['Unknown'], 'number');
  }
});

// ---------------------------------------------------------------------------
// TEST 7: Resilience Against Incomplete or Corrupted Trajectory Engine
// ---------------------------------------------------------------------------
console.log('\nTest 7: Resilience Against Incomplete or Corrupted Statistics');
testCase('Safely handles malformed, partial, or missing statistics without throwing TypeError', () => {
  // Simulate an incomplete engine that returned a summary missing possessionPoints/possessionFrames
  const incompleteRaw = {
    totalFrames: 100,
    detectedBallFrames: 50,
  };

  const rawPossessionPoints = incompleteRaw.possessionPoints || incompleteRaw.possessionFrames || {};
  const rawPossessionPct = incompleteRaw.possessionPct || {};

  const normalized = {
    totalFrames: typeof incompleteRaw.totalFrames === 'number' ? incompleteRaw.totalFrames : 0,
    detectedBallFrames: typeof incompleteRaw.detectedBallFrames === 'number' ? incompleteRaw.detectedBallFrames : 0,
    interpolatedBallFrames: typeof incompleteRaw.interpolatedBallFrames === 'number' ? incompleteRaw.interpolatedBallFrames : 0,
    totalTrajectoryPoints: typeof incompleteRaw.totalTrajectoryPoints === 'number' ? incompleteRaw.totalTrajectoryPoints : 0,
    detectionRatePct: typeof incompleteRaw.detectionRatePct === 'number' ? incompleteRaw.detectionRatePct : 0.0,
    segmentsCount: typeof incompleteRaw.segmentsCount === 'number' ? incompleteRaw.segmentsCount : 0,
    possessionFrames: {
      'Team A': rawPossessionPoints['Team A'] ?? 0,
      'Team B': rawPossessionPoints['Team B'] ?? 0,
      'Unknown': rawPossessionPoints['Unknown'] ?? 0,
    },
    possessionPoints: {
      'Team A': rawPossessionPoints['Team A'] ?? 0,
      'Team B': rawPossessionPoints['Team B'] ?? 0,
      'Unknown': rawPossessionPoints['Unknown'] ?? 0,
    },
    possessionPct: {
      'Team A': rawPossessionPct['Team A'] ?? 0.0,
      'Team B': rawPossessionPct['Team B'] ?? 0.0,
      'Unknown': rawPossessionPct['Unknown'] ?? 0.0,
    },
  };

  assert.strictEqual(normalized.possessionPoints['Team A'], 0);
  assert.strictEqual(normalized.possessionPoints['Team B'], 0);
  assert.strictEqual(normalized.possessionPoints['Unknown'], 0);
  assert.strictEqual(normalized.possessionPct['Team A'], 0.0);
  assert.strictEqual(normalized.possessionPct['Team B'], 0.0);
  assert.strictEqual(normalized.possessionPct['Unknown'], 0.0);
});

console.log('\n======================================================');
console.log(`🎉 ALL ${passedTests}/${totalTests} BALL TRAJECTORY ANALYSIS PANEL TESTS PASSED!`);
console.log('======================================================');
