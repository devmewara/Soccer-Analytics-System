/**
 * speedEstimator.js
 * 
 * Computes normalized camera-relative movement speed (% of video frame per second)
 * for tracked players across video frames.
 * 
 * CONSTRAINTS & METHODOLOGY:
 * 1. Normalized Screen Units: Positions (x, y) are 0–100% of video dimensions.
 *    Speed is calculated as screen displacement rate (% / second).
 *    Does NOT claim real-world km/h because camera perspective is not calibrated to pitch coordinates.
 * 2. Conservative Motion Tiers:
 *    - Idle (< 2.0 %/s): stationary, small weight shifts, resting.
 *    - Moving (2.0 – 8.0 %/s): walking, jogging, repositioning.
 *    - Fast movement (> 8.0 %/s): rapid acceleration, sprint-like bursts across camera view.
 * 3. Jitter Suppression:
 *    Uses a temporal sliding window (~0.2–0.3s, default 0.25s) rather than adjacent-frame deltas,
 *    averaging out high-frequency YOLO/ByteTrack bounding box noise.
 * 4. Tracking Continuity & Discontinuity:
 *    Gaps exceeding 0.5s (camera cuts, occlusion, or re-identification) reset history
 *    to prevent artificial displacement spikes.
 * 5. Safe & Pure:
 *    Pure function with no side effects or mutations. Handles empty data, missing players,
 *    duplicate timestamps, and non-numeric inputs safely.
 */

export const SPEED_TIERS = Object.freeze({
  IDLE: { label: 'Idle', tier: 'idle', min: 0.0, max: 2.0 },
  MOVING: { label: 'Moving', tier: 'moving', min: 2.0, max: 8.0 },
  FAST: { label: 'Fast movement', tier: 'fast', min: 8.0, max: Infinity },
});

export const DEFAULT_SPEED_OPTIONS = Object.freeze({
  targetWindowSec: 0.25,     // ~0.2–0.3s temporal window to filter detection jitter
  minWindowSec: 0.10,        // minimum dt required before computing speed
  maxGapSec: 0.50,           // time gap exceeding this resets player history (e.g. camera cuts)
  smoothingFactor: 0.35,     // EMA alpha (0 < alpha <= 1)
  idleThreshold: 2.0,        // %/s threshold for 'Idle'
  fastThreshold: 8.0,        // %/s threshold for 'Fast movement'
});

export const DEFAULT_SPEED_RECORD = Object.freeze({
  playerId: null,
  frame: null,
  frameIdx: null,
  t: 0,
  speed: 0.0,
  rawSpeed: 0.0,
  displacement: 0.0,
  dt: 0.0,
  label: 'Idle',
  tier: 'idle',
  direction: Object.freeze({ dx: 0, dy: 0 }),
  isValid: false,
});

/**
 * Categorize a speed value (%/s) into conservative movement tiers.
 * 
 * @param {number} speed - Movement speed in %/second
 * @param {Object} [options] - Threshold options
 * @returns {{ label: string, tier: string }}
 */
export function getSpeedTier(speed, options = {}) {
  const idleThreshold = typeof options.idleThreshold === 'number'
    ? options.idleThreshold
    : DEFAULT_SPEED_OPTIONS.idleThreshold;
  const fastThreshold = typeof options.fastThreshold === 'number'
    ? options.fastThreshold
    : DEFAULT_SPEED_OPTIONS.fastThreshold;

  const s = typeof speed === 'number' && !isNaN(speed) ? Math.max(0, speed) : 0;
  if (s >= fastThreshold) {
    return { label: SPEED_TIERS.FAST.label, tier: SPEED_TIERS.FAST.tier };
  }
  if (s >= idleThreshold) {
    return { label: SPEED_TIERS.MOVING.label, tier: SPEED_TIERS.MOVING.tier };
  }
  return { label: SPEED_TIERS.IDLE.label, tier: SPEED_TIERS.IDLE.tier };
}

/**
 * Pure function: Calculates movement speeds and conservative tiers for all tracked players.
 * 
 * @param {Array<Object>} frameTracking - List of frame tracking records [{ frame, t, players: [{ id, x, y, team }] }]
 * @param {Object} [customOptions] - Optional configuration overrides
 * @returns {{
 *   byFrameIndex: Array<Object>,
 *   byFrameNumber: Object,
 *   getSpeed: (frameRef: number, playerId: number) => Object,
 *   getFramePlayers: (frameRef: number) => Array<Object>,
 *   summary: { totalFrames: number, uniquePlayers: number, maxSpeed: number }
 * }}
 */
export function calculatePlayerSpeeds(frameTracking, customOptions = {}) {
  const options = {
    ...DEFAULT_SPEED_OPTIONS,
    ...(customOptions || {}),
  };

  const {
    targetWindowSec,
    minWindowSec,
    maxGapSec,
    smoothingFactor,
    idleThreshold,
    fastThreshold,
  } = options;

  // Safe empty result builder
  const createEmptyResult = () => ({
    byFrameIndex: [],
    byFrameNumber: {},
    getSpeed: () => DEFAULT_SPEED_RECORD,
    getFramePlayers: () => [],
    summary: { totalFrames: 0, uniquePlayers: 0, maxSpeed: 0.0 },
  });

  if (!Array.isArray(frameTracking) || frameTracking.length === 0) {
    return createEmptyResult();
  }

  const byFrameIndex = new Array(frameTracking.length);
  const byFrameNumber = {};
  const playerStates = new Map();
  let maxObservedSpeed = 0.0;
  const uniquePlayerIds = new Set();

  for (let frameIdx = 0; frameIdx < frameTracking.length; frameIdx++) {
    const record = frameTracking[frameIdx];
    const framePlayersMap = {};

    if (!record || typeof record !== 'object') {
      byFrameIndex[frameIdx] = framePlayersMap;
      continue;
    }

    const frameNum = typeof record.frame === 'number' && !isNaN(record.frame)
      ? record.frame
      : frameIdx;

    const t = typeof record.t === 'number' && !isNaN(record.t)
      ? record.t
      : frameIdx * 0.0333;

    const rawPlayers = Array.isArray(record.players) ? record.players : [];

    for (let pIdx = 0; pIdx < rawPlayers.length; pIdx++) {
      const p = rawPlayers[pIdx];
      if (!p || typeof p !== 'object') continue;

      const playerId = p.id;
      if (playerId == null || typeof playerId !== 'number' || isNaN(playerId)) continue;

      const px = typeof p.x === 'number' && !isNaN(p.x) ? p.x : null;
      const py = typeof p.y === 'number' && !isNaN(p.y) ? p.y : null;
      if (px === null || py === null) continue;

      uniquePlayerIds.add(playerId);

      let pState = playerStates.get(playerId);
      if (!pState) {
        pState = {
          history: [], // [{ x, y, t, frameIdx }]
          lastT: null,
          smoothedSpeed: 0.0,
          prevRawSpeed: 0.0,
        };
        playerStates.set(playerId, pState);
      }

      // Check for camera cuts or tracking gaps exceeding maxGapSec (0.5s)
      if (pState.lastT !== null) {
        const gap = t - pState.lastT;
        if (gap > maxGapSec || gap < 0) {
          // Reset history on discontinuity to prevent artificial speed spikes
          pState.history = [];
          pState.smoothedSpeed = 0.0;
          pState.prevRawSpeed = 0.0;
        }
      }
      pState.lastT = t;

      // Append current point to history
      pState.history.push({ x: px, y: py, t, frameIdx });

      // Find the reference point in history closest to targetWindowSec (~0.25s) in the past
      let bestRef = pState.history[0];
      let bestRefIdx = 0;
      let minDiff = Math.abs((t - bestRef.t) - targetWindowSec);

      for (let hIdx = 1; hIdx < pState.history.length; hIdx++) {
        const candidate = pState.history[hIdx];
        const diff = Math.abs((t - candidate.t) - targetWindowSec);
        if (diff < minDiff) {
          minDiff = diff;
          bestRef = candidate;
          bestRefIdx = hIdx;
        }
      }

      // Prune history entries strictly older than the reference point
      if (bestRefIdx > 0) {
        pState.history.splice(0, bestRefIdx);
      }

      const dt = t - bestRef.t;
      let rawSpeed = 0.0;
      let displacement = 0.0;
      let dirDx = 0.0;
      let dirDy = 0.0;

      // Compute displacement only when time delta is reliable and within bounds
      if (dt >= minWindowSec && dt <= maxGapSec) {
        const dx = px - bestRef.x;
        const dy = py - bestRef.y;
        displacement = Math.hypot(dx, dy);
        rawSpeed = displacement / dt;

        if (displacement > 0.01) {
          dirDx = Number((dx / displacement).toFixed(3));
          dirDy = Number((dy / displacement).toFixed(3));
        }
      } else if (dt < minWindowSec && pState.prevRawSpeed > 0) {
        // Still accumulating minimal temporal window: inherit previous raw speed
        rawSpeed = pState.prevRawSpeed;
      }

      // Apply Exponential Moving Average (EMA) smoothing
      let smoothedSpeed;
      if (pState.history.length <= 1 || dt < minWindowSec) {
        smoothedSpeed = rawSpeed;
      } else {
        smoothedSpeed = (smoothingFactor * rawSpeed) + ((1 - smoothingFactor) * pState.smoothedSpeed);
      }

      pState.smoothedSpeed = smoothedSpeed;
      pState.prevRawSpeed = rawSpeed;

      const roundedSpeed = Math.round(smoothedSpeed * 10) / 10;
      const roundedRaw = Math.round(rawSpeed * 10) / 10;
      const roundedDisp = Math.round(displacement * 100) / 100;
      const roundedDt = Math.round(dt * 100) / 100;

      if (roundedSpeed > maxObservedSpeed) {
        maxObservedSpeed = roundedSpeed;
      }

      const tierInfo = getSpeedTier(roundedSpeed, { idleThreshold, fastThreshold });

      const speedItem = {
        playerId,
        frame: frameNum,
        frameIdx,
        t: Math.round(t * 100) / 100,
        speed: roundedSpeed,
        rawSpeed: roundedRaw,
        displacement: roundedDisp,
        dt: roundedDt,
        label: tierInfo.label,
        tier: tierInfo.tier,
        direction: { dx: dirDx, dy: dirDy },
        isValid: true,
      };

      framePlayersMap[playerId] = speedItem;
    }

    byFrameIndex[frameIdx] = framePlayersMap;
    byFrameNumber[frameNum] = framePlayersMap;
  }

  /**
   * Fast O(1) query helper for speed record.
   * Accepts either array frameIndex, frameNumber, or a frameRecord object with { frame }.
   * Returns DEFAULT_SPEED_RECORD if player or frame is not found.
   */
  const getSpeed = (frameRef, playerId) => {
    if (frameRef == null || playerId == null) return DEFAULT_SPEED_RECORD;

    const actualRef = typeof frameRef === 'object' && frameRef !== null
      ? (frameRef.frame ?? frameRef.frameIdx ?? frameRef)
      : frameRef;

    // Check byFrameNumber first (exact video frame number), fallback to array byFrameIndex
    let frameMap = byFrameNumber[actualRef];
    if (!frameMap && typeof byFrameIndex[actualRef] === 'object') {
      frameMap = byFrameIndex[actualRef];
    }

    if (!frameMap || !frameMap[playerId]) {
      return DEFAULT_SPEED_RECORD;
    }
    return frameMap[playerId];
  };

  /**
   * Returns all player speed records for a specific frame.
   */
  const getFramePlayers = (frameRef) => {
    if (frameRef == null) return [];
    const actualRef = typeof frameRef === 'object' && frameRef !== null
      ? (frameRef.frame ?? frameRef.frameIdx ?? frameRef)
      : frameRef;

    let frameMap = byFrameNumber[actualRef];
    if (!frameMap && typeof byFrameIndex[actualRef] === 'object') {
      frameMap = byFrameIndex[actualRef];
    }
    return frameMap ? Object.values(frameMap) : [];
  };

  return {
    byFrameIndex,
    byFrameNumber,
    getSpeed,
    getFramePlayers,
    summary: {
      totalFrames: frameTracking.length,
      uniquePlayers: uniquePlayerIds.size,
      maxSpeed: maxObservedSpeed,
    },
  };
}

/**
 * Resolves and formats a player's speed record from a speedData engine.
 * Guarantees 100% identical number and tier in both video overlay and mini-map.
 *
 * @param {Object} speedData - Output from calculatePlayerSpeeds
 * @param {number|Object} frameRef - frame number or frame record object
 * @param {number} playerId - ByteTrack player ID
 * @returns {{ speedVal: string, speedNum: number, label: string, tier: string, isValid: boolean }}
 */
export function resolvePlayerSpeed(speedData, frameRef, playerId) {
  if (!speedData || typeof speedData.getSpeed !== 'function' || frameRef == null || playerId == null) {
    return {
      speedVal: '—',
      speedNum: 0.0,
      label: 'Idle',
      tier: 'idle',
      isValid: false,
    };
  }

  const record = speedData.getSpeed(frameRef, playerId);
  const isValid = Boolean(
    record &&
      record.isValid &&
      typeof record.speed === 'number' &&
      !isNaN(record.speed)
  );

  return {
    speedVal: isValid ? record.speed.toFixed(1) : '—',
    speedNum: isValid ? record.speed : 0.0,
    label: record?.label || 'Idle',
    tier: record?.tier || 'idle',
    isValid,
  };
}

export default calculatePlayerSpeeds;
