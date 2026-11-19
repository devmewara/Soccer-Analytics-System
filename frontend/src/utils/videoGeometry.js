/**
 * videoGeometry.js
 * Pure utility functions for calculating video display dimensions, aspect ratios,
 * and letterboxing/pillarboxing rects inside object-contain HTML5 video elements.
 */

/**
 * Calculates the exact rendered pixel rectangle of video content inside an object-contain HTML5 video element.
 * Accounts for letterboxing (black bars on top/bottom) and pillarboxing (black bars on left/right).
 *
 * @param {HTMLVideoElement | Object} videoElement Video element with videoWidth, videoHeight, clientWidth, clientHeight
 * @returns {{ left: number, top: number, width: number, height: number } | null}
 */
export function calculateVideoContentRect(videoElement) {
  if (!videoElement) return null;
  const { videoWidth, videoHeight, clientWidth, clientHeight } = videoElement;
  if (!videoWidth || !videoHeight || !clientWidth || !clientHeight) return null;

  const videoRatio = videoWidth / videoHeight;
  const containerRatio = clientWidth / clientHeight;

  let width = clientWidth;
  let height = clientHeight;
  let left = 0;
  let top = 0;

  if (containerRatio > videoRatio) {
    // Container is wider than video: Pillarboxed (black bars on left and right)
    height = clientHeight;
    width = height * videoRatio;
    left = (clientWidth - width) / 2;
    top = 0;
  } else {
    // Container is taller than video: Letterboxed (black bars on top and bottom)
    width = clientWidth;
    height = width / videoRatio;
    left = 0;
    top = (clientHeight - height) / 2;
  }

  return {
    left: Math.round(left),
    top: Math.round(top),
    width: Math.round(width),
    height: Math.round(height),
  };
}
