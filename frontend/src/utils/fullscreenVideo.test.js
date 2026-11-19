import assert from 'node:assert';
import { calculateVideoContentRect } from './videoGeometry.js';

console.log('======================================================');
console.log('🧪 RUNNING FULLSCREEN & MULTI-ASPECT-RATIO TEST SUITE');
console.log('======================================================\n');

// Mock HTML5 video element with client and video dimensions
function createMockVideo(videoWidth, videoHeight, clientWidth, clientHeight) {
  return {
    videoWidth,
    videoHeight,
    clientWidth,
    clientHeight,
  };
}

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

console.log('Category A: Standard 16:9 Landscape Video (1920x1080, 1280x720)');

testCase('16:9 video on exact 16:9 1080p display (1920x1080) in fullscreen', () => {
  const v = createMockVideo(1920, 1080, 1920, 1080);
  const rect = calculateVideoContentRect(v);
  assert.strictEqual(rect.left, 0, 'Left should be 0');
  assert.strictEqual(rect.top, 0, 'Top should be 0');
  assert.strictEqual(rect.width, 1920, 'Width should fill screen (1920px)');
  assert.strictEqual(rect.height, 1080, 'Height should fill screen (1080px)');
  assert.strictEqual(rect.width / rect.height, 1920 / 1080, 'Aspect ratio must match 16:9 exactly');
});

testCase('16:9 720p video (1280x720) on 1440p screen (2560x1440) in fullscreen', () => {
  const v = createMockVideo(1280, 720, 2560, 1440);
  const rect = calculateVideoContentRect(v);
  assert.strictEqual(rect.left, 0);
  assert.strictEqual(rect.top, 0);
  assert.strictEqual(rect.width, 2560);
  assert.strictEqual(rect.height, 1440);
  assert.strictEqual(rect.width / rect.height, 16 / 9);
});

testCase('16:9 video on 16:10 MacBook screen (2880x1800) in fullscreen', () => {
  // 16:10 screen is taller than 16:9 (container ratio 1.6 < 1.7777) -> Letterboxed top/bottom
  const v = createMockVideo(1920, 1080, 2880, 1800);
  const rect = calculateVideoContentRect(v);
  assert.strictEqual(rect.width, 2880, 'Video must span full width of 2880px');
  assert.strictEqual(rect.height, 1620, 'Video height should be 2880 / (16/9) = 1620px');
  assert.strictEqual(rect.left, 0, 'Horizontal left offset should be 0');
  assert.strictEqual(rect.top, 90, 'Vertical letterbox margin should be (1800 - 1620) / 2 = 90px');
  // Aspect ratio preserved
  assert.ok(Math.abs(rect.width / rect.height - 16 / 9) < 0.001);
});

console.log('\nCategory B: Non-16:9 Real Broadcast Clips (16:10 / 2880x1800 actual test clip)');

testCase('Real match clip (2880x1800, 16:10) on 16:10 MacBook display (2880x1800) in fullscreen', () => {
  const v = createMockVideo(2880, 1800, 2880, 1800);
  const rect = calculateVideoContentRect(v);
  assert.strictEqual(rect.left, 0);
  assert.strictEqual(rect.top, 0);
  assert.strictEqual(rect.width, 2880, 'Fills full screen width (2880px)');
  assert.strictEqual(rect.height, 1800, 'Fills full screen height (1800px)');
  assert.strictEqual(rect.width / rect.height, 1.6);
});

testCase('Real match clip (2880x1800, 16:10) on 16:9 1080p display (1920x1080) in fullscreen', () => {
  // Container ratio 1.777 > Video ratio 1.6 -> Pillarboxed left/right
  const v = createMockVideo(2880, 1800, 1920, 1080);
  const rect = calculateVideoContentRect(v);
  assert.strictEqual(rect.height, 1080, 'Video must span full screen height (1080px)');
  assert.strictEqual(rect.width, 1728, 'Video width must be 1080 * 1.6 = 1728px');
  assert.strictEqual(rect.top, 0, 'Vertical top offset must be 0 (no top/bottom black bars)');
  assert.strictEqual(rect.left, 96, 'Pillarbox left margin must be (1920 - 1728) / 2 = 96px');
  assert.ok(Math.abs(rect.width / rect.height - 1.6) < 0.001);
});

console.log('\nCategory C: Non-16:9 Formats (4:3 Classic, 21:9 Ultrawide, 9:16 Vertical)');

testCase('4:3 classic footage (1440x1080) on 16:9 display (1920x1080) in fullscreen', () => {
  const v = createMockVideo(1440, 1080, 1920, 1080);
  const rect = calculateVideoContentRect(v);
  assert.strictEqual(rect.height, 1080, 'Height touches top and bottom (1080px)');
  assert.strictEqual(rect.width, 1440, 'Width is 1080 * (4/3) = 1440px');
  assert.strictEqual(rect.top, 0);
  assert.strictEqual(rect.left, 240, 'Pillarbox left is (1920 - 1440) / 2 = 240px');
  assert.ok(Math.abs(rect.width / rect.height - 4 / 3) < 0.001);
});

testCase('21:9 ultrawide video (2560x1080) on 16:9 display (1920x1080) in fullscreen', () => {
  const v = createMockVideo(2560, 1080, 1920, 1080);
  const rect = calculateVideoContentRect(v);
  assert.strictEqual(rect.width, 1920, 'Width spans full 1920px');
  assert.strictEqual(rect.height, 810, 'Height is 1920 / (2560/1080) = 810px');
  assert.strictEqual(rect.left, 0);
  assert.strictEqual(rect.top, 135, 'Letterbox top is (1080 - 810) / 2 = 135px');
  assert.ok(Math.abs(rect.width / rect.height - 2560 / 1080) < 0.001);
});

testCase('9:16 vertical smartphone clip (1080x1920) on 16:9 display (1920x1080) in fullscreen', () => {
  const v = createMockVideo(1080, 1920, 1920, 1080);
  const rect = calculateVideoContentRect(v);
  assert.strictEqual(rect.height, 1080, 'Height touches top and bottom (1080px)');
  assert.strictEqual(rect.width, 608, 'Width is Math.round(1080 * 9/16) = 608px');
  assert.strictEqual(rect.top, 0);
  assert.strictEqual(rect.left, 656, 'Pillarbox left is (1920 - 608) / 2 = 656px');
  assert.ok(Math.abs(rect.width / rect.height - 9 / 16) < 0.01);
});

console.log('\nCategory D: Edge Cases & Safety Fallbacks');

testCase('Null video element returns null safely', () => {
  assert.strictEqual(calculateVideoContentRect(null), null);
});

testCase('Video element with uninitialized videoWidth returns null safely', () => {
  const v = createMockVideo(0, 0, 1920, 1080);
  assert.strictEqual(calculateVideoContentRect(v), null);
});

testCase('Video element with uninitialized clientHeight returns null safely', () => {
  const v = createMockVideo(1920, 1080, 1920, 0);
  assert.strictEqual(calculateVideoContentRect(v), null);
});

console.log('\n======================================================');
console.log(`🎉 ALL ${passedTests}/${totalTests} FULLSCREEN TESTS PASSED SUCCESSFULLY!`);
console.log('======================================================');
