import React, { useState } from 'react';
import {
  UserCheck,
  Cpu,
  Activity,
  Zap,
  Search,
  Scale,
  ArrowRight,
  Info,
  Clock,
  Crosshair,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import DemoBanner from '../common/DemoBanner';
import DemoBadge from '../common/DemoBadge';
import PitchCanvas from '../common/PitchCanvas';
import { Line } from 'react-chartjs-2';

export const PlayerTrackingView = ({
  data,
  realAnalytics,
  isUserUploaded = false,
  initialSelectedPlayerId = null,
}) => {
  const hasRealAnalytics = Boolean(realAnalytics && realAnalytics.players && realAnalytics.players.length > 0);

  // If real analytics is available, use real tracked players; otherwise use mock demo players
  const realPlayers = realAnalytics?.players || [];
  const demoPlayers = data?.players || [];

  const [selectedRealTrackId, setSelectedRealTrackId] = useState(
    initialSelectedPlayerId || (realPlayers.length > 0 ? realPlayers[0].track_id : null)
  );
  const [selectedDemoPlayerId, setSelectedDemoPlayerId] = useState(17);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [teamFilter, setTeamFilter] = useState('all');

  // Filter real players
  const filteredRealPlayers = realPlayers.filter((p) => {
    return (
      p.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.track_id.toString().includes(searchQuery)
    );
  });

  const currentRealPlayer =
    realPlayers.find((p) => p.track_id === selectedRealTrackId) || realPlayers[0];

  // Demo player handling
  const filteredDemoPlayers = demoPlayers.filter((p) => {
    const matchesTeam = teamFilter === 'all' || p.team_id === teamFilter;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.jersey_number.toString().includes(searchQuery) ||
      p.track_id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTeam && matchesSearch;
  });

  const currentDemoPlayer =
    demoPlayers.find((p) => p.id === selectedDemoPlayerId) || demoPlayers[0];
  const compareDemoTarget =
    demoPlayers.find((p) => p.id === 8) || demoPlayers[1];

  // Chart data for speed profile over match time (Demo mode only)
  const speedChartData = currentDemoPlayer
    ? {
        labels: ["10'", "20'", "30'", "40'", "50'", "60'", "70'", "80'"],
        datasets: [
          {
            label: `${currentDemoPlayer.name} (${currentDemoPlayer.team_name}) [Sample]`,
            data: currentDemoPlayer.speed_profile || [12, 18, 24, 30, 22, 19, 25, 27],
            borderColor: currentDemoPlayer.team_id === 'man_blue' ? '#38BDF8' : '#EF4444',
            backgroundColor:
              currentDemoPlayer.team_id === 'man_blue'
                ? 'rgba(56, 189, 248, 0.1)'
                : 'rgba(239, 68, 68, 0.1)',
            tension: 0.35,
            fill: true,
            pointBackgroundColor:
              currentDemoPlayer.team_id === 'man_blue' ? '#38BDF8' : '#EF4444',
            pointRadius: 4,
          },
        ],
      }
    : null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: '#94A3B8', font: { family: 'Inter', size: 11 } },
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(37, 50, 68, 0.4)' },
        ticks: { color: '#64748B', font: { family: 'JetBrains Mono', size: 10 } },
      },
      y: {
        grid: { color: 'rgba(37, 50, 68, 0.4)' },
        ticks: {
          color: '#64748B',
          font: { family: 'JetBrains Mono', size: 10 },
          callback: (val) => `${val} km/h`,
        },
      },
    },
  };

  // Case 1: Real tracking data from user video
  if (hasRealAnalytics) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-[#253244]">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white tracking-tight">Player Tracking Studio</h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>BYTETRACK MULTI-OBJECT TRACKING</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Verified tracking telemetry extracted from video frames using Ultralytics YOLO11 and ByteTrack association.
            </p>
          </div>

          <span className="text-xs font-mono text-slate-400 bg-[#101722] px-3 py-1.5 rounded-xl border border-[#253244]">
            Total Tracked: <strong className="text-emerald-400">{realPlayers.length} Players</strong>
          </span>
        </div>

        {/* Workspace Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Player Selection & Filter List (4 cols) */}
          <div className="lg:col-span-4 bg-[#101722] border border-[#253244] rounded-2xl p-4 sm:p-5 shadow-panel flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#253244]">
                <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Tracked Player Roster
                </span>
                <span className="text-[10px] font-mono text-emerald-400">
                  {filteredRealPlayers.length} Detected
                </span>
              </div>

              {/* Search Input */}
              <div className="mt-3 relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by track ID (e.g. 1, 2)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#080B10] border border-[#253244] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              {/* Roster Scroll List */}
              <div className="mt-3 space-y-2 max-h-[460px] overflow-y-auto pr-1">
                {filteredRealPlayers.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400 bg-[#080B10] rounded-xl border border-[#253244]">
                    No tracked player found matching "{searchQuery}"
                  </div>
                ) : (
                  filteredRealPlayers.map((p) => {
                    const isSelected = p.track_id === currentRealPlayer?.track_id;

                    return (
                      <button
                        key={p.track_id}
                        onClick={() => setSelectedRealTrackId(p.track_id)}
                        className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-colors ${
                          isSelected
                            ? 'bg-[#17212E] border-emerald-500/50'
                            : 'bg-[#17212E]/40 border-[#253244] hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-mono font-bold text-xs">
                            #{p.track_id}
                          </span>
                          <div>
                            <p className="text-xs font-semibold text-white truncate max-w-[130px]">{p.label}</p>
                            <span className="text-[10px] font-mono text-slate-400 block -mt-0.5">
                              Frame {p.first_frame} → {p.last_frame}
                            </span>
                          </div>
                        </div>

                        <div className="text-right font-mono text-xs shrink-0">
                          <span className="text-emerald-400 font-bold block">{p.visibility_duration_seconds}s</span>
                          <span className="text-[10px] text-slate-400">{(p.avg_confidence * 100).toFixed(0)}% conf</span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Player Telemetry Console (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {currentRealPlayer && (
              <div className="bg-[#101722] border border-[#253244] rounded-2xl p-5 shadow-panel space-y-6">
                {/* Player Profile Header */}
                <div className="flex items-center justify-between pb-3 border-b border-[#253244]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-mono font-bold text-base">
                      #{currentRealPlayer.track_id}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white tracking-tight">
                        {currentRealPlayer.label}
                      </h3>
                      <p className="text-xs font-mono text-slate-400">
                        ByteTrack ID: #{currentRealPlayer.track_id} • Target Class: Person (COCO 0)
                      </p>
                    </div>
                  </div>

                  <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-lg">
                    Active on Screen: {currentRealPlayer.visibility_duration_seconds}s
                  </span>
                </div>

                {/* Metric Cards Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 bg-[#080B10] border border-[#253244] rounded-xl">
                    <span className="text-[10px] font-mono text-slate-400 uppercase block">Frames Observed</span>
                    <p className="text-2xl font-bold text-white font-mono mt-1">
                      {currentRealPlayer.detections_count}
                      <span className="text-xs text-slate-500 font-normal ml-1">frames</span>
                    </p>
                  </div>

                  <div className="p-3.5 bg-[#080B10] border border-[#253244] rounded-xl">
                    <span className="text-[10px] font-mono text-slate-400 uppercase block">First Seen</span>
                    <p className="text-2xl font-bold text-emerald-400 font-mono mt-1">
                      F#{currentRealPlayer.first_frame}
                    </p>
                  </div>

                  <div className="p-3.5 bg-[#080B10] border border-[#253244] rounded-xl">
                    <span className="text-[10px] font-mono text-slate-400 uppercase block">Last Seen</span>
                    <p className="text-2xl font-bold text-sky-400 font-mono mt-1">
                      F#{currentRealPlayer.last_frame}
                    </p>
                  </div>

                  <div className="p-3.5 bg-[#080B10] border border-[#253244] rounded-xl">
                    <span className="text-[10px] font-mono text-slate-400 uppercase block">Mean Confidence</span>
                    <p className="text-2xl font-bold text-amber-400 font-mono mt-1">
                      {(currentRealPlayer.avg_confidence * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>

                {/* Tracking Bounding Box Telemetry */}
                <div className="p-4 bg-[#080B10] border border-[#253244] rounded-xl space-y-2 text-xs font-mono">
                  <div className="flex items-center justify-between text-slate-300 font-semibold pb-2 border-b border-[#17212E]">
                    <span className="flex items-center gap-1.5">
                      <Crosshair className="w-4 h-4 text-emerald-400" />
                      <span>Bounding Box Pixel Coordinates</span>
                    </span>
                    <span className="text-[10px] text-slate-500">Last frame coordinates</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
                    <div>
                      <span className="text-slate-500 block">X1, Y1 (Top-Left):</span>
                      <span className="text-white font-bold">
                        ({currentRealPlayer.last_known_bbox[0]}, {currentRealPlayer.last_known_bbox[1]})
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">X2, Y2 (Bottom-Right):</span>
                      <span className="text-white font-bold">
                        ({currentRealPlayer.last_known_bbox[2]}, {currentRealPlayer.last_known_bbox[3]})
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Avg Bbox Width:</span>
                      <span className="text-emerald-400 font-bold">{currentRealPlayer.avg_bbox_width} px</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Avg Bbox Height:</span>
                      <span className="text-emerald-400 font-bold">{currentRealPlayer.avg_bbox_height} px</span>
                    </div>
                  </div>
                </div>

                {/* Honest Engineering Notice on Speed & Homography */}
                <div className="p-4 bg-emerald-950/20 border border-emerald-500/30 rounded-xl text-xs space-y-1.5 text-slate-300">
                  <div className="flex items-center gap-2 font-bold text-emerald-400">
                    <Info className="w-4 h-4 shrink-0" />
                    <span>Scientific Integrity Note: Physical Speed & Distance</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-400">
                    Calculating physical speeds in km/h or travel distances in meters from a 2D broadcast camera requires a 4-point homography transformation matrix that maps pixel perspective to metric pitch geometry (105m × 68m). In accordance with engineering standards, uncalibrated speed metrics are not fabricated without pitch calibration.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Case 2: Demo mode with simulated players
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <DemoBanner />

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-[#253244]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">Player MOT Tracking Studio</h2>
            <DemoBadge label="SAMPLE TELEMETRY" />
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Simulated Multi-Object Tracking (ByteTrack) kinematics, calibrated coordinate trails, and velocity profiles.
          </p>
        </div>

        {/* Compare Mode Toggle */}
        <button
          onClick={() => setIsCompareMode(!isCompareMode)}
          className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium flex items-center gap-1.5 transition-colors ${
            isCompareMode
              ? 'bg-emerald-500 text-black font-bold shadow-sm'
              : 'bg-[#17212E] text-slate-300 border border-[#253244] hover:text-white'
          }`}
        >
          <Scale className="w-3.5 h-3.5" />
          <span>Compare Mode: {isCompareMode ? 'ACTIVE' : 'OFF'}</span>
        </button>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Player Selection & Filter List (4 cols) */}
        <div className="lg:col-span-4 bg-[#101722] border border-[#253244] rounded-2xl p-4 sm:p-5 shadow-panel flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#253244]">
              <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Tracked Player Roster
              </span>
              <span className="text-[10px] font-mono text-emerald-400">
                {filteredDemoPlayers.length} Records
              </span>
            </div>

            {/* Team Filter */}
            <div className="mt-3 flex gap-1 p-1 bg-[#080B10] rounded-xl border border-[#253244] text-[11px] font-mono">
              <button
                onClick={() => setTeamFilter('all')}
                className={`flex-1 py-1 rounded-lg text-center transition-colors ${
                  teamFilter === 'all' ? 'bg-[#17212E] text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setTeamFilter('man_blue')}
                className={`flex-1 py-1 rounded-lg text-center transition-colors ${
                  teamFilter === 'man_blue' ? 'bg-sky-500/20 text-sky-300 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Man Blue
              </button>
              <button
                onClick={() => setTeamFilter('lon_red')}
                className={`flex-1 py-1 rounded-lg text-center transition-colors ${
                  teamFilter === 'lon_red' ? 'bg-rose-500/20 text-rose-300 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                London Red
              </button>
            </div>

            {/* Search Input */}
            <div className="mt-3 relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by name, jersey, or TRK ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#080B10] border border-[#253244] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
              />
            </div>

            {/* Roster Scroll List */}
            <div className="mt-3 space-y-2 max-h-[460px] overflow-y-auto pr-1">
              {filteredDemoPlayers.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 bg-[#080B10] rounded-xl border border-[#253244]">
                  No player found matching "{searchQuery}"
                </div>
              ) : (
                filteredDemoPlayers.map((p) => {
                  const isSelected = p.id === selectedDemoPlayerId;
                  const isTeamA = p.team_id === 'man_blue';

                  return (
                    <button
                      key={p.id}
                      onClick={() => setSelectedDemoPlayerId(p.id)}
                      className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-colors ${
                        isSelected
                          ? 'bg-[#17212E] border-emerald-500/50'
                          : 'bg-[#17212E]/40 border-[#253244] hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono font-bold text-xs text-black ${
                            isTeamA ? 'bg-sky-400' : 'bg-rose-500 text-white'
                          }`}
                        >
                          {p.jersey_number}
                        </span>
                        <div>
                          <p className="text-xs font-semibold text-white truncate max-w-[130px]">{p.name}</p>
                          <span className="text-[10px] font-mono text-slate-400 block -mt-0.5">
                            {p.track_id} • {p.position}
                          </span>
                        </div>
                      </div>

                      <div className="text-right font-mono text-xs shrink-0">
                        <span className="text-emerald-400 font-bold block">{p.distance_km} km</span>
                        <span className="text-[10px] text-slate-400">{p.top_speed_kmh} km/h</span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Player Movement Trail Pitch & Telemetry Console (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Movement Trail on Calibrated 2D Pitch */}
          {currentDemoPlayer && (
            <div className="bg-[#101722] border border-[#253244] rounded-2xl p-5 shadow-panel">
              <div className="flex items-center justify-between pb-3 border-b border-[#253244] mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    <h3 className="text-sm font-bold text-white tracking-tight">
                      {currentDemoPlayer.name} (#{currentDemoPlayer.jersey_number}) • Tactical Movement Trail
                    </h3>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 font-mono">
                    Track ID: <strong className="text-emerald-400">{currentDemoPlayer.track_id}</strong> • Role: {currentDemoPlayer.role}
                  </p>
                </div>

                <span className="text-[10px] font-mono text-slate-300 bg-[#080B10] border border-[#253244] px-2.5 py-1 rounded">
                  Pitch Coords: ({((currentDemoPlayer.pitch_x / 100) * 105).toFixed(1)}m, {((currentDemoPlayer.pitch_y / 100) * 68).toFixed(1)}m)
                </span>
              </div>

              {/* Pitch with SVG movement trail */}
              <PitchCanvas heightClass="h-72 sm:h-80 md:h-[340px]">
                {currentDemoPlayer.trail && currentDemoPlayer.trail.length > 1 && (
                  <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                    <polyline
                      points={currentDemoPlayer.trail.map((pt) => `${pt.x}%,${pt.y}%`).join(' ')}
                      fill="none"
                      stroke={currentDemoPlayer.team_id === 'man_blue' ? '#38BDF8' : '#EF4444'}
                      strokeWidth="2"
                      strokeDasharray="4,2"
                      strokeOpacity="0.8"
                    />
                    {currentDemoPlayer.trail.map((pt, idx) => (
                      <circle
                        key={idx}
                        cx={`${pt.x}%`}
                        cy={`${pt.y}%`}
                        r="3"
                        fill={currentDemoPlayer.team_id === 'man_blue' ? '#38BDF8' : '#EF4444'}
                        fillOpacity="0.8"
                      />
                    ))}
                  </svg>
                )}

                <div
                  className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto z-20"
                  style={{ left: `${currentDemoPlayer.pitch_x}%`, top: `${currentDemoPlayer.pitch_y}%` }}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-mono font-bold text-xs text-black shadow-lg ring-2 ring-emerald-400 ${
                      currentDemoPlayer.team_id === 'man_blue' ? 'bg-sky-400' : 'bg-rose-500 text-white'
                    }`}
                  >
                    {currentDemoPlayer.jersey_number}
                  </div>
                </div>
              </PitchCanvas>
            </div>
          )}

          {/* Kinematics Telemetry Grid */}
          {currentDemoPlayer && (
            <div className="bg-[#101722] border border-[#253244] rounded-2xl p-5 shadow-panel">
              <div className="flex items-center justify-between pb-3 border-b border-[#253244] mb-3.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                    Kinematic Indicators (Sample Dataset)
                  </span>
                  <DemoBadge size="xs" label="SAMPLE DATA" />
                </div>
                <span className="text-[10px] font-mono text-slate-400 bg-[#080B10] px-2 py-0.5 rounded border border-[#253244]">
                  Kalman State: Stable (Demo)
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-[#080B10] border border-[#253244] rounded-xl">
                  <span className="text-[9px] font-mono text-slate-400 block uppercase">Total Distance</span>
                  <p className="text-xl font-bold text-white font-mono mt-1">
                    {currentDemoPlayer.distance_km} <span className="text-xs font-normal text-emerald-400">km</span>
                  </p>
                </div>

                <div className="p-3 bg-[#080B10] border border-[#253244] rounded-xl">
                  <span className="text-[9px] font-mono text-slate-400 block uppercase">Peak Speed</span>
                  <p className="text-xl font-bold text-white font-mono mt-1">
                    {currentDemoPlayer.top_speed_kmh} <span className="text-xs font-normal text-emerald-400">km/h</span>
                  </p>
                </div>

                <div className="p-3 bg-[#080B10] border border-[#253244] rounded-xl">
                  <span className="text-[9px] font-mono text-slate-400 block uppercase">High Sprints</span>
                  <p className="text-xl font-bold text-white font-mono mt-1">
                    {currentDemoPlayer.sprints} <span className="text-xs font-normal text-emerald-400">runs</span>
                  </p>
                </div>

                <div className="p-3 bg-[#080B10] border border-[#253244] rounded-xl">
                  <span className="text-[9px] font-mono text-slate-400 block uppercase">Pass Accuracy</span>
                  <p className="text-xl font-bold text-white font-mono mt-1">
                    {currentDemoPlayer.pass_accuracy}%
                  </p>
                </div>
              </div>

              {speedChartData && (
                <div className="mt-5 pt-3.5 border-t border-[#253244]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-semibold text-slate-300">
                      Instantaneous Velocity Profile (10-minute intervals)
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">Sprint Threshold: 25.2 km/h</span>
                  </div>
                  <div className="h-44">
                    <Line data={speedChartData} options={chartOptions} />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlayerTrackingView;
