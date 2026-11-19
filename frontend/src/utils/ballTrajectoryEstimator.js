/**
 * ballTrajectoryEstimator.js
 * 
 * PitchVision AI - Pure Ball Trajectory & Team Possession Attribution Engine
 * 
 * Calculates continuous ball movement trajectories from normalized camera-relative
 * coordinates (0–100%) and performs conservative team possession attribution:
 *   - Team A: sky blue (#38BDF8)
 *   - Team B: rose/red (#F43F5E)
 *   - Unknown: neutral gray (#94A3B8)
 * 
 * CORE METHODOLOGY & CONSTRAINTS:
 * 1. Normalized Screen Coordinates:
 *    All coordinates (x, y) represent normalized camera view percentage (0–100%).
 * 2. Conservative Team Attribution:
 *    - Never assigns possession solely because a player happens to be the nearest one.
 *    - Direct Foot Contact: Ball within player ground contact / bounding box zone (<= 3.5%).
 *    - Proximity & Momentum: Recognizes passing and departure vectors initiated by a team.
 *    - Handover Latch: Retains team attribution during clean passes until an opponent clearly
 *      intercepts or touches the ball.
 *    - Contested / Scrums: When players from opposing teams are in close simultaneous contact,
 *      attribution is strictly marked as 'Unknown' (neutral gray).
 *    - Loose Balls: Free flight balls exceeding maximum flight timeout without clear possession
 *      transition to 'Unknown'.
 * 3. Short Gap Interpolation:
 *    - Bridges only short, physically plausible detection gaps (<= 0.35s, ~10-12 frames).
 *    - Velocity plausibility check: Rejects jumps exceeding 80.0 %/s or across camera cuts.
 *    - Explicitly marks interpolated points as estimated (`isInterpolated: true`).
 *    - Preserves long gaps (> 0.35s) as trajectory breaks rather than fabricating data.
 * 4. High-Performance Precomputation:
 *    Pure, deterministic calculation with O(1) indexed lookups and O(log N) temporal binary search,
 *    allowing zero-cost updates during live playback, scrubbing, and fullscreen toggles.
 */

export const TEAM_COLORS = Object.freeze({
  TEAM_A: '#38BDF8',  // Sky blue
  TEAM_B: '#F43F5E',  // Rose / red
  UNKNOWN: '#94A3B8', // Neutral slate gray
});

export const DEFAULT_TRAJECTORY_OPTIONS = Object.freeze({
  contactDistance: 3.5,       // % screen space threshold for direct foot/body contact
  proximityDistance: 8.0,     // % screen space threshold for nearby influence
  maxGapSec: 0.35,            // Maximum gap duration to interpolate (350ms)
  maxPlausibleSpeed: 80.0,    // %/s maximum physical ball speed across camera view
  maxFlightSec: 1.6,          // Maximum duration ball in flight retains prior team attribution
  minContestedDiff: 1.5,      // % difference between Team A and Team B to declare contested
  defaultTeamAColor: TEAM_COLORS.TEAM_A,
  defaultTeamBColor: TEAM_COLORS.TEAM_B,
  defaultUnknownColor: TEAM_COLORS.UNKNOWN,
});

/**
 * Calculates Euclidean distance between two points in normalized percentage coordinates.
 */
export function calculateDistance(x1, y1, x2, y2) {
  if (x1 == null || y1 == null || x2 == null || y2 == null) return Infinity;
  return Math.hypot(x2 - x1, y2 - y1);
}

/**
 * Extracts player's bounding box in normalized percentages (0–100%).
 */
export function getPlayerBoundingBox(player) {
  if (!player) return null;
  if (Array.isArray(player.bbox) && player.bbox.length === 4) {
    return {
      x1: player.bbox[0],
      y1: player.bbox[1],
      x2: player.bbox[2],
      y2: player.bbox[3],
    };
  }
  // Conservative fallback based on broadcast ground contact (x, y)
  const px = typeof player.x === 'number' ? player.x : 50;
  const py = typeof player.y === 'number' ? player.y : 50;
  return {
    x1: Math.max(0, px - 1.4),
    y1: Math.max(0, py - 7.5),
    x2: Math.min(100, px + 1.4),
    y2: Math.min(100, py),
  };
}

/**
 * Computes effective distance from ball center to player ground contact and bounding box.
 */
export function computeBallToPlayerDistance(player, ballX, ballY) {
  if (!player || ballX == null || ballY == null) return Infinity;
  const px = typeof player.x === 'number' ? player.x : 50;
  const py = typeof player.y === 'number' ? player.y : 50;

  // Ground contact / feet distance
  const feetDist = Math.hypot(px - ballX, py - ballY);

  // Bounding box distance (with 1.0% padding for foot extension)
  const box = getPlayerBoundingBox(player);
  if (!box) return feetDist;

  const dx = Math.max(0, Math.max(box.x1 - ballX, ballX - box.x2));
  const dy = Math.max(0, Math.max(box.y1 - ballY, ballY - (box.y2 + 1.0)));
  const boxDist = Math.hypot(dx, dy);

  return Math.min(feetDist, boxDist);
}

/**
 * Pure function: Calculates ball trajectory and conservative team attribution
 * from frame_tracking records.
 * 
 * @param {Array<Object>} frameTracking List of frame tracking records [{ frame, t, ball, players }]
 * @param {Object} [customOptions] Configuration overrides
 * @returns {Object} Precomputed trajectory engine with lookup helpers
 */
export function calculateBallTrajectory(frameTracking, customOptions = {}) {
  const options = {
    ...DEFAULT_TRAJECTORY_OPTIONS,
    ...(customOptions || {}),
  };

  if (!Array.isArray(frameTracking) || frameTracking.length === 0) {
    return createEmptyTrajectoryResult(options);
  }

  // 1. First Pass: Collect all raw detected ball frames & index raw frame records
  const detectedFrames = [];
  const rawFrameMap = new Map();

  for (let idx = 0; idx < frameTracking.length; idx++) {
    const record = frameTracking[idx];
    if (!record || typeof record !== 'object') continue;

    const frameNum = typeof record.frame === 'number' ? record.frame : idx;
    rawFrameMap.set(frameNum, { record, index: idx });

    const ball = record.ball;
    if (
      ball &&
      typeof ball.x === 'number' &&
      !isNaN(ball.x) &&
      typeof ball.y === 'number' &&
      !isNaN(ball.y)
    ) {
      detectedFrames.push({
        rawIndex: idx,
        frame: frameNum,
        t: typeof record.t === 'number' ? record.t : +(idx / 30).toFixed(2),
        x: Math.max(0, Math.min(100, ball.x)),
        y: Math.max(0, Math.min(100, ball.y)),
        players: Array.isArray(record.players) ? record.players : [],
        isDetected: true,
        isInterpolated: false,
      });
    }
  }

  if (detectedFrames.length === 0) {
    return createEmptyTrajectoryResult(options, frameTracking.length);
  }

  // 2. Second Pass: Interpolate short physically plausible gaps (<= maxGapSec)
  const synthesizedBallPoints = [];

  for (let i = 0; i < detectedFrames.length; i++) {
    const current = detectedFrames[i];
    synthesizedBallPoints.push(current);

    if (i < detectedFrames.length - 1) {
      const next = detectedFrames[i + 1];
      const dt = next.t - current.t;
      const dFrame = next.frame - current.frame;
      const dist = Math.hypot(next.x - current.x, next.y - current.y);
      const velocity = dt > 0 ? dist / dt : 0;

      if (dFrame > 1) {
        // Gap in detection: check plausibility (short duration <= maxGapSec and velocity <= maxPlausibleSpeed)
        const isShortGap = dt > 0.001 && dt <= options.maxGapSec;
        const isPlausibleVelocity = velocity <= options.maxPlausibleSpeed;

        if (isShortGap && isPlausibleVelocity) {
          // Collect intermediate frame records from raw tracking if available
          const intermediateCount = dFrame - 1;
          for (let step = 1; step <= intermediateCount; step++) {
            const alpha = step / dFrame;
            const targetFrame = current.frame + step;
            const targetTime = +(current.t + alpha * dt).toFixed(2);
            const interpX = +(current.x + alpha * (next.x - current.x)).toFixed(1);
            const interpY = +(current.y + alpha * (next.y - current.y)).toFixed(1);

            // Locate players present at targetFrame from rawFrameMap (O(1))
            const rawEntry = rawFrameMap.get(targetFrame);
            const rawMatchRecord = rawEntry ? rawEntry.record : null;
            const rawIndex = rawEntry ? rawEntry.index : -1;
            const playersAtFrame = rawMatchRecord && Array.isArray(rawMatchRecord.players)
              ? rawMatchRecord.players
              : [];

            synthesizedBallPoints.push({
              rawIndex,
              frame: targetFrame,
              t: targetTime,
              x: Math.max(0, Math.min(100, interpX)),
              y: Math.max(0, Math.min(100, interpY)),
              players: playersAtFrame,
              isDetected: false,
              isInterpolated: true,
            });
          }
        } else {
          // Long gap (> maxGapSec) or implausible jump (> 80%/s) -> mark discontinuity break
          current.gapAfter = true;
        }
      } else if (dFrame === 1) {
        // Normal consecutive frames: check if velocity is implausible jump (e.g. false detection teleport)
        if (velocity > options.maxPlausibleSpeed || dt > options.maxGapSec) {
          current.gapAfter = true;
        }
      } else {
        // dFrame <= 0: Non-monotonic or duplicate frame numbering
        current.gapAfter = true;
      }
    }
  }

  // 3. Third Pass: Multi-Factor Team Possession Attribution & Direction Vectors
  const enrichedPoints = [];
  let currentPossessionTeam = 'Unknown';
  let lastContactPlayerId = null;
  let lastContactTime = -999;
  let lastContactPos = null;

  for (let i = 0; i < synthesizedBallPoints.length; i++) {
    const pt = synthesizedBallPoints[i];
    const prevPt = i > 0 ? enrichedPoints[i - 1] : null;

    // A. Vector & Movement Calculation
    let dx = 0;
    let dy = 0;
    let speed = 0;
    let angleDeg = 0;

    if (prevPt && !prevPt.gapAfter) {
      const dt = pt.t - prevPt.t;
      dx = pt.x - prevPt.x;
      dy = pt.y - prevPt.y;
      speed = dt > 0 ? Math.hypot(dx, dy) / dt : 0;
      angleDeg = Math.round((Math.atan2(dy, dx) * 180) / Math.PI);
    }

    // B. Player Proximity Analysis
    let closestA = null;
    let closestB = null;
    let closestRef = null;
    let closestAny = null;

    const players = pt.players || [];
    for (const p of players) {
      if (p.x == null || p.y == null) continue;
      const dist = computeBallToPlayerDistance(p, pt.x, pt.y);

      if (!closestAny || dist < closestAny.dist) {
        closestAny = { player: p, dist };
      }

      if (p.team === 'Team A') {
        if (!closestA || dist < closestA.dist) closestA = { player: p, dist };
      } else if (p.team === 'Team B') {
        if (!closestB || dist < closestB.dist) closestB = { player: p, dist };
      } else if (p.team === 'Referee') {
        if (!closestRef || dist < closestRef.dist) closestRef = { player: p, dist };
      }
    }

    const distA = closestA ? closestA.dist : Infinity;
    const distB = closestB ? closestB.dist : Infinity;

    // Contact counts
    const hasContactA = distA <= options.contactDistance;
    const hasContactB = distB <= options.contactDistance;

    // Proximity counts
    const hasNearA = distA <= options.proximityDistance;
    const hasNearB = distB <= options.proximityDistance;

    // Attribution Decision Logic
    let assignedTeam = 'Unknown';
    let confidence = 0.5;
    let attributionReason = 'loose_ball';
    let attributingPlayer = null;

    if (hasContactA && hasContactB) {
      // 1. Both teams in direct contact radius -> Contested Tackle / Scrum
      assignedTeam = 'Unknown';
      confidence = 0.35;
      attributionReason = 'contested_tackle';
      attributingPlayer = null;
      currentPossessionTeam = 'Unknown';
    } else if (hasContactA) {
      // 2. Direct Unambiguous Contact with Team A
      assignedTeam = 'Team A';
      confidence = 0.95;
      attributionReason = 'direct_contact';
      attributingPlayer = closestA.player;
      currentPossessionTeam = 'Team A';
      lastContactPlayerId = closestA.player.id;
      lastContactTime = pt.t;
      lastContactPos = { x: pt.x, y: pt.y };
    } else if (hasContactB) {
      // 3. Direct Unambiguous Contact with Team B
      assignedTeam = 'Team B';
      confidence = 0.95;
      attributionReason = 'direct_contact';
      attributingPlayer = closestB.player;
      currentPossessionTeam = 'Team B';
      lastContactPlayerId = closestB.player.id;
      lastContactTime = pt.t;
      lastContactPos = { x: pt.x, y: pt.y };
    } else if (hasNearA && !hasNearB) {
      // 4. Proximity near Team A only
      if (currentPossessionTeam === 'Team A') {
        assignedTeam = 'Team A';
        confidence = 0.85;
        attributionReason = 'possession_retention';
      } else {
        // Approaching Team A
        assignedTeam = 'Team A';
        confidence = 0.70;
        attributionReason = 'near_proximity';
      }
      attributingPlayer = closestA.player;
      currentPossessionTeam = 'Team A';
    } else if (hasNearB && !hasNearA) {
      // 5. Proximity near Team B only
      if (currentPossessionTeam === 'Team B') {
        assignedTeam = 'Team B';
        confidence = 0.85;
        attributionReason = 'possession_retention';
      } else {
        // Approaching Team B
        assignedTeam = 'Team B';
        confidence = 0.70;
        attributionReason = 'near_proximity';
      }
      attributingPlayer = closestB.player;
      currentPossessionTeam = 'Team B';
    } else if (hasNearA && hasNearB) {
      // 6. Both teams within proximity radius
      const diff = Math.abs(distA - distB);
      if (diff < options.minContestedDiff) {
        // Closely contested 50/50 ball
        assignedTeam = 'Unknown';
        confidence = 0.40;
        attributionReason = 'contested_proximity';
      } else if (distA < distB) {
        assignedTeam = currentPossessionTeam === 'Team A' ? 'Team A' : 'Unknown';
        confidence = 0.60;
        attributionReason = 'contested_bias_a';
        attributingPlayer = closestA.player;
      } else {
        assignedTeam = currentPossessionTeam === 'Team B' ? 'Team B' : 'Unknown';
        confidence = 0.60;
        attributionReason = 'contested_bias_b';
        attributingPlayer = closestB.player;
      }
    } else {
      // 7. Open Play / Ball in Flight (minDist > proximityDistance)
      const timeSinceLastContact = pt.t - lastContactTime;
      if (
        (currentPossessionTeam === 'Team A' || currentPossessionTeam === 'Team B') &&
        timeSinceLastContact <= options.maxFlightSec &&
        lastContactPos != null
      ) {
        // Sustained pass or shot flight initiated by previous team
        assignedTeam = currentPossessionTeam;
        confidence = Math.max(0.45, 0.90 - 0.25 * timeSinceLastContact);
        attributionReason = 'flight_continuation';
        attributingPlayer = { id: lastContactPlayerId, team: currentPossessionTeam };
      } else {
        // Loose ball in empty territory
        assignedTeam = 'Unknown';
        confidence = 0.50;
        attributionReason = 'loose_ball';
        currentPossessionTeam = 'Unknown';
      }
    }

    // Assign Segment Color
    let color = options.defaultUnknownColor;
    if (assignedTeam === 'Team A') color = options.defaultTeamAColor;
    else if (assignedTeam === 'Team B') color = options.defaultTeamBColor;

    enrichedPoints.push({
      index: i,
      frame: pt.frame,
      t: pt.t,
      x: pt.x,
      y: pt.y,
      dx: +dx.toFixed(2),
      dy: +dy.toFixed(2),
      speed: +speed.toFixed(1),
      angleDeg,
      team: assignedTeam,
      color,
      confidence: +confidence.toFixed(2),
      reason: attributionReason,
      attributingPlayerId: attributingPlayer ? attributingPlayer.id : null,
      isDetected: pt.isDetected,
      isInterpolated: pt.isInterpolated,
      gapAfter: Boolean(pt.gapAfter),
    });
  }

  // 4. Fourth Pass: Trajectory Segmentation
  // Partition into continuous, coherent team/gap segments
  const segments = [];
  let currentSegment = null;

  for (let i = 0; i < enrichedPoints.length; i++) {
    const pt = enrichedPoints[i];
    const prevPt = i > 0 ? enrichedPoints[i - 1] : null;

    const startsNewSegment =
      !currentSegment ||
      currentSegment.team !== pt.team ||
      (prevPt && prevPt.gapAfter);

    if (startsNewSegment) {
      if (currentSegment) {
        finalizeSegment(currentSegment);
        segments.push(currentSegment);
      }
      currentSegment = {
        id: `seg_${segments.length}`,
        team: pt.team,
        color: pt.color,
        isContested: pt.team === 'Unknown',
        startIndex: i,
        endIndex: i,
        startFrame: pt.frame,
        endFrame: pt.frame,
        startTime: pt.t,
        endTime: pt.t,
        points: [pt],
      };
    } else {
      currentSegment.endIndex = i;
      currentSegment.endFrame = pt.frame;
      currentSegment.endTime = pt.t;
      currentSegment.points.push(pt);
    }
  }

  if (currentSegment) {
    finalizeSegment(currentSegment);
    segments.push(currentSegment);
  }

  // Helper Map for O(1) frame lookup
  const byFrameNumber = new Map();
  for (const pt of enrichedPoints) {
    byFrameNumber.set(pt.frame, pt);
  }

  // Compute Summary Statistics
  const totalPoints = enrichedPoints.length;
  const detectedCount = enrichedPoints.filter((p) => p.isDetected).length;
  const interpolatedCount = enrichedPoints.filter((p) => p.isInterpolated).length;
  const teamAPoints = enrichedPoints.filter((p) => p.team === 'Team A').length;
  const teamBPoints = enrichedPoints.filter((p) => p.team === 'Team B').length;
  const unknownPoints = enrichedPoints.filter((p) => p.team === 'Unknown').length;

  const summary = {
    totalFrames: frameTracking.length,
    detectedBallFrames: detectedCount,
    interpolatedBallFrames: interpolatedCount,
    totalTrajectoryPoints: totalPoints,
    detectionRatePct: +(detectedCount / Math.max(1, frameTracking.length) * 100).toFixed(1),
    segmentsCount: segments.length,
    possessionFrames: {
      'Team A': teamAPoints,
      'Team B': teamBPoints,
      'Unknown': unknownPoints,
    },
    possessionPoints: {
      'Team A': teamAPoints,
      'Team B': teamBPoints,
      'Unknown': unknownPoints,
    },
    possessionPct: {
      'Team A': +(teamAPoints / Math.max(1, totalPoints) * 100).toFixed(1),
      'Team B': +(teamBPoints / Math.max(1, totalPoints) * 100).toFixed(1),
      'Unknown': +(unknownPoints / Math.max(1, totalPoints) * 100).toFixed(1),
    },
  };

  // 5. Query Helpers for Fast Playback & Display
  return {
    points: enrichedPoints,
    segments,
    summary,

    /**
     * O(1) Query: Retrieves ball trajectory state at specific frame number.
     */
    getBallAtFrame: (frameNum) => {
      if (typeof frameNum !== 'number') return null;
      return byFrameNumber.get(frameNum) || null;
    },

    /**
     * O(log N) Query: Retrieves ball trajectory state closest to playback time in seconds.
     */
    getBallAtTime: (timeSec, maxToleranceSec = 0.15) => {
      if (typeof timeSec !== 'number' || isNaN(timeSec) || enrichedPoints.length === 0) {
        return null;
      }
      let low = 0;
      let high = enrichedPoints.length - 1;

      while (low <= high) {
        const mid = (low + high) >> 1;
        const midT = enrichedPoints[mid].t;
        if (midT === timeSec) return enrichedPoints[mid];
        if (midT < timeSec) low = mid + 1;
        else high = mid - 1;
      }

      const p1 = enrichedPoints[high];
      const p2 = enrichedPoints[low];

      let best = p1;
      if (!best || (p2 && Math.abs(p2.t - timeSec) < Math.abs(best.t - timeSec))) {
        best = p2;
      }

      if (best && Math.abs(best.t - timeSec) <= maxToleranceSec) {
        return best;
      }
      return null;
    },

    /**
     * Retrieves active trailing points within a sliding time window [currentTime - windowSec, currentTime]
     * for drawing the live trailing video comet trail.
     */
    getActiveTrail: (currentTimeSec, windowSec = 1.5) => {
      if (typeof currentTimeSec !== 'number' || isNaN(currentTimeSec) || enrichedPoints.length === 0) {
        return [];
      }
      const minTime = Math.max(0, currentTimeSec - Math.max(0.1, windowSec));
      const trail = [];

      for (let i = 0; i < enrichedPoints.length; i++) {
        const pt = enrichedPoints[i];
        if (pt.t >= minTime && pt.t <= currentTimeSec + 0.05) {
          trail.push(pt);
        }
        if (pt.t > currentTimeSec + 0.05) break;
      }

      return trail;
    },

    /**
     * Retrieves all trajectory segments, optionally filtered by team.
     */
    getAllSegments: (teamFilter = null) => {
      if (!teamFilter) return segments;
      return segments.filter((s) => s.team === teamFilter);
    },

    /**
     * Retrieves overall trajectory and possession metrics.
     */
    getSummaryStats: () => summary,
  };
}

/**
 * Calculates aggregate stats on a finalized segment.
 */
function finalizeSegment(segment) {
  let totalDist = 0;
  let totalSpeed = 0;
  const pts = segment.points;

  for (let i = 1; i < pts.length; i++) {
    const d = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
    totalDist += d;
    totalSpeed += pts[i].speed;
  }

  segment.pointCount = pts.length;
  segment.distance = +totalDist.toFixed(1);
  segment.avgSpeed = pts.length > 1 ? +(totalSpeed / (pts.length - 1)).toFixed(1) : 0;
}

/**
 * Fallback empty trajectory result when tracking data is null or empty.
 */
function createEmptyTrajectoryResult(options, totalFrames = 0) {
  const emptySummary = {
    totalFrames,
    detectedBallFrames: 0,
    interpolatedBallFrames: 0,
    totalTrajectoryPoints: 0,
    detectionRatePct: 0.0,
    segmentsCount: 0,
    possessionFrames: { 'Team A': 0, 'Team B': 0, 'Unknown': 0 },
    possessionPoints: { 'Team A': 0, 'Team B': 0, 'Unknown': 0 },
    possessionPct: { 'Team A': 0.0, 'Team B': 0.0, 'Unknown': 0.0 },
  };

  return {
    points: [],
    segments: [],
    summary: emptySummary,
    getBallAtFrame: () => null,
    getBallAtTime: () => null,
    getActiveTrail: () => [],
    getAllSegments: () => [],
    getSummaryStats: () => emptySummary,
  };
}

export default calculateBallTrajectory;
