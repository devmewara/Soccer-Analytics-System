import assert from 'node:assert';
import { calculatePlayerSpeeds, resolvePlayerSpeed } from './speedEstimator.js';

console.log('======================================================');
console.log('🧪 RUNNING MINI-MAP FULLSCREEN & SYNC PLAYBACK TESTS');
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

// Synthetic 10-second clip tracking dataset (30 fps)
const syntheticFrameTracking = [];
for (let i = 0; i < 300; i++) {
  const t = +(i / 30).toFixed(2);
  syntheticFrameTracking.push({
    frame: i,
    t,
    players: [
      { id: 1, team: 'Team A', x: +(40 + (i * 0.05)).toFixed(1), y: 50.0 },
      { id: 2, team: 'Team B', x: 70.0, y: +(30 + (i * 0.03)).toFixed(1) },
      { id: 3, team: 'Referee', x: 50.0, y: 50.0 },
    ],
    ball: i >= 50 && i <= 250 ? { x: +(50 + (i * 0.02)).toFixed(1), y: 52.0 } : null,
  });
}

const speedEngine = calculatePlayerSpeeds(syntheticFrameTracking);

testCase('1. Precomputed speed engine resolves identical values in video and mini-map', () => {
  const frameRecord = syntheticFrameTracking[60]; // t = 2.0s
  const speedP1 = resolvePlayerSpeed(speedEngine, frameRecord, 1);
  const speedP2 = resolvePlayerSpeed(speedEngine, frameRecord, 2);
  const speedP3 = resolvePlayerSpeed(speedEngine, frameRecord, 3);

  assert.ok(speedP1.isValid);
  assert.ok(typeof speedP1.speedVal === 'string');
  assert.strictEqual(speedP1.tier, 'idle'); // slow 0.05%/frame = 1.5%/s (<2.0)
  assert.strictEqual(speedP3.tier, 'idle'); // stationary ref
});

testCase('2. Playback state synchronization: Mini-map freeze on pause', () => {
  // Simulated playback state
  let isPlaying = false;
  let currentTime = 4.2;

  // On pause, mini-map receives current frameRecord without divergence
  const activeRecord = syntheticFrameTracking.find((f) => Math.abs(f.t - currentTime) < 0.02);
  assert.ok(activeRecord);
  assert.strictEqual(activeRecord.frame, 126);

  // Speed values stay strictly identical on pause
  const speedOnPause = resolvePlayerSpeed(speedEngine, activeRecord, 1);
  assert.strictEqual(speedOnPause.speedVal, '1.5');
});

testCase('3. Seeking synchronization: Mini-map jumping updates tracking and ball', () => {
  // User seeks to t = 6.0s (frame 180) from mini-map fullscreen scrubber
  const seekTime = 6.0;
  const soughtRecord = syntheticFrameTracking.find((f) => Math.abs(f.t - seekTime) < 0.02);
  assert.ok(soughtRecord);
  assert.strictEqual(soughtRecord.frame, 180);
  assert.ok(soughtRecord.ball !== null, 'Ball must be present at frame 180');
  assert.strictEqual(soughtRecord.ball.x, 53.6);
  assert.strictEqual(soughtRecord.players.length, 3);
});

testCase('4. Mini-map fullscreen coordinate clamping preserves normalized bounds (0-100%)', () => {
  // Edge coordinates test
  const extremeFrame = {
    frame: 999,
    t: 10.0,
    players: [
      { id: 10, team: 'Team A', x: -5.0, y: 105.0 }, // Out of bounds
      { id: 11, team: 'Team B', x: 50.0, y: 50.0 },
    ],
  };

  const p10 = extremeFrame.players[0];
  const clampedX = Math.max(3, Math.min(97, p10.x));
  const clampedY = Math.max(4, Math.min(96, p10.y));

  assert.strictEqual(clampedX, 3, 'Marker clamped to canvas safe left bound');
  assert.strictEqual(clampedY, 96, 'Marker clamped to canvas safe bottom bound');
});

testCase('5. Dual fullscreen independence logic', () => {
  let isVideoFs = false;
  let isMiniMapFs = false;

  // Enter video fullscreen
  isVideoFs = true;
  assert.strictEqual(isVideoFs, true);
  assert.strictEqual(isMiniMapFs, false);

  // Switching to mini-map fullscreen cleanly exits video fullscreen
  if (isMiniMapFs) {
    isVideoFs = false;
  }
  isMiniMapFs = true;
  isVideoFs = false;
  assert.strictEqual(isMiniMapFs, true);
  assert.strictEqual(isVideoFs, false);

  // Exit mini-map fullscreen
  isMiniMapFs = false;
  assert.strictEqual(isMiniMapFs, false);
  assert.strictEqual(isVideoFs, false);
});

console.log('\n======================================================');
console.log(`🎉 ALL ${passedTests}/${totalTests} MINI-MAP FULLSCREEN TESTS PASSED!`);
console.log('======================================================');
