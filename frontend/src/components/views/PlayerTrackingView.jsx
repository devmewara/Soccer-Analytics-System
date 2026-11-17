import React, { useState } from 'react';
import { UserCheck, Cpu, GitBranch, ArrowUpRight, ShieldCheck, Zap } from 'lucide-react';
import DemoBanner from '../common/DemoBanner';
import DemoBadge from '../common/DemoBadge';

export const PlayerTrackingView = () => {
  const [selectedPlayer, setSelectedPlayer] = useState(17);

  const players = [
    {
      id: 17,
      name: "Kevin De Bruyne",
      jersey: 17,
      position: "Attacking Midfielder",
      team: "Manchester Blue",
      distanceKm: 11.8,
      topSpeedKmh: 32.4,
      currentSpeedKmh: 24.1,
      sprints: 24,
      trackletConfidence: "98.4%",
      activeFrames: "5,400 / 5,400",
    },
    {
      id: 7,
      name: "Bukayo Saka",
      jersey: 7,
      position: "Right Winger",
      team: "London Red",
      distanceKm: 10.9,
      topSpeedKmh: 33.8,
      currentSpeedKmh: 18.2,
      sprints: 28,
      trackletConfidence: "97.1%",
      activeFrames: "5,280 / 5,400",
    },
    {
      id: 9,
      name: "Erling Haaland",
      jersey: 9,
      position: "Center Forward",
      team: "Manchester Blue",
      distanceKm: 9.4,
      topSpeedKmh: 34.2,
      currentSpeedKmh: 29.5,
      sprints: 19,
      trackletConfidence: "99.0%",
      activeFrames: "5,400 / 5,400",
    },
    {
      id: 8,
      name: "Martin Odegaard",
      jersey: 8,
      position: "Central Midfielder",
      team: "London Red",
      distanceKm: 11.6,
      topSpeedKmh: 31.9,
      currentSpeedKmh: 21.0,
      sprints: 21,
      trackletConfidence: "96.8%",
      activeFrames: "5,350 / 5,400",
    },
  ];

  const current = players.find((p) => p.id === selectedPlayer) || players[0];

  return (
    <div className="space-y-6">
      <DemoBanner />

      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white tracking-tight">Player Tracking & Telemetry</h2>
            <DemoBadge />
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Multi-Object Tracking (MOT) metrics calculated across match footage. Integrates YOLOv8 + ByteTrack in Phase 2.
          </p>
        </div>

        <span className="text-xs font-mono bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
          <Cpu className="w-3.5 h-3.5" />
          Tracker: ByteTrack Module (Awaiting Phase 2)
        </span>
      </div>

      {/* CV Tracking Architecture Pipeline Preview */}
      <div className="bg-[#0D131F] border border-slate-800 rounded-2xl p-5 shadow-lg shadow-black/30">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono mb-4">
          Tracking Architecture Workflow (Planned Phase 2 Engine)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
            <span className="text-[10px] font-mono text-emerald-400 block mb-1">Step 01</span>
            <p className="font-semibold text-white">YOLOv8 Detection</p>
            <p className="text-[11px] text-slate-400 mt-1">Bounding boxes for players, ref & ball per frame.</p>
          </div>

          <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
            <span className="text-[10px] font-mono text-sky-400 block mb-1">Step 02</span>
            <p className="font-semibold text-white">ByteTrack MOT</p>
            <p className="text-[11px] text-slate-400 mt-1">Kalman filter state prediction & IoU association.</p>
          </div>

          <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
            <span className="text-[10px] font-mono text-amber-400 block mb-1">Step 03</span>
            <p className="font-semibold text-white">Pitch Homography</p>
            <p className="text-[11px] text-slate-400 mt-1">Perspective transform to metric 2D coordinate pitch.</p>
          </div>

          <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
            <span className="text-[10px] font-mono text-purple-400 block mb-1">Step 04</span>
            <p className="font-semibold text-white">Kinematics Engine</p>
            <p className="text-[11px] text-slate-400 mt-1">Velocity, acceleration, sprints & heat density.</p>
          </div>
        </div>
      </div>

      {/* Player Telemetry Cards & Selected Player Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Player Selector List */}
        <div className="bg-[#0D131F] border border-slate-800 rounded-2xl p-5 shadow-lg shadow-black/30">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono mb-3">
            Tracked Tracklets
          </h3>
          <div className="space-y-2">
            {players.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedPlayer(p.id)}
                className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                  p.id === selectedPlayer
                    ? 'bg-emerald-500/15 border-emerald-500/40 shadow-sm shadow-emerald-500/20'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 font-mono font-bold text-xs flex items-center justify-center">
                    {p.jersey}
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-white">{p.name}</p>
                    <p className="text-[10px] text-slate-400">{p.position}</p>
                  </div>
                </div>
                <div className="text-right font-mono text-xs">
                  <span className="text-emerald-400 font-bold">{p.distanceKm} km</span>
                  <span className="block text-[10px] text-slate-400">{p.topSpeedKmh} km/h</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Selected Player Deep Telemetry */}
        <div className="lg:col-span-2 bg-[#0D131F] border border-slate-800 rounded-2xl p-6 shadow-lg shadow-black/30">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                  #{current.jersey}
                </span>
                <h3 className="text-base font-bold text-white">{current.name}</h3>
                <DemoBadge size="xs" />
              </div>
              <p className="text-xs text-slate-400 mt-1">{current.position} • {current.team}</p>
            </div>

            <span className="text-xs font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2.5 py-1 rounded">
              Tracklet #{current.id}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6">
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
              <span className="text-[10px] font-mono uppercase text-slate-400">Total Distance</span>
              <p className="text-xl font-extrabold text-white font-mono mt-1">{current.distanceKm} <span className="text-xs font-normal text-emerald-400">km</span></p>
            </div>

            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
              <span className="text-[10px] font-mono uppercase text-slate-400">Peak Velocity</span>
              <p className="text-xl font-extrabold text-white font-mono mt-1">{current.topSpeedKmh} <span className="text-xs font-normal text-emerald-400">km/h</span></p>
            </div>

            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
              <span className="text-[10px] font-mono uppercase text-slate-400">Sprint Counts</span>
              <p className="text-xl font-extrabold text-white font-mono mt-1">{current.sprints} <span className="text-xs font-normal text-emerald-400">runs</span></p>
            </div>

            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
              <span className="text-[10px] font-mono uppercase text-slate-400">Instant Speed</span>
              <p className="text-xl font-extrabold text-emerald-400 font-mono mt-1">{current.currentSpeedKmh} <span className="text-xs font-normal text-slate-400">km/h</span></p>
            </div>

            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
              <span className="text-[10px] font-mono uppercase text-slate-400">Tracking Confidence</span>
              <p className="text-xl font-extrabold text-sky-400 font-mono mt-1">{current.trackletConfidence}</p>
            </div>

            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
              <span className="text-[10px] font-mono uppercase text-slate-400">Frame Continuity</span>
              <p className="text-xl font-extrabold text-amber-400 font-mono mt-1">{current.activeFrames}</p>
            </div>
          </div>

          <div className="mt-6 p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300">
            <span className="font-semibold text-slate-200">Kinematic Computation Notice:</span>
            <p className="text-[11px] text-slate-400 mt-1">
              In Phase 2, speeds will be derived via Euclidean distances across homography-calibrated pitch meters divided by video frame delta time (dt = 1/FPS).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerTrackingView;
