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
  const transientTracks = realAnalytics?.transient_tracks || [];
  const demoPlayers = data?.players || [];

  const [showTransient, setShowTransient] = useState(false);
  const [selectedRealTrackId, setSelectedRealTrackId] = useState(
    initialSelectedPlayerId || (realPlayers.length > 0 ? realPlayers[0].track_id : null)
  );
  const [selectedDemoPlayerId, setSelectedDemoPlayerId] = useState(17);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [teamFilter, setTeamFilter] = useState('all');

  // Active roster based on toggle (confirmed players vs transient noise)
  const activeRoster = showTransient ? transientTracks : realPlayers;

  // Filter real players by search and team
  const filteredRealPlayers = activeRoster.filter((p) => {
    const matchesSearch =
      p.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.track_id.toString().includes(searchQuery);
    const matchesTeam =
      teamFilter === 'all' ||
      (teamFilter === 'team_a' && p.team === 'Team A') ||
      (teamFilter === 'team_b' && p.team === 'Team B') ||
      (teamFilter === 'referee' && p.team === 'Referee') ||
      (teamFilter === 'unknown' && p.team === 'Unknown');
    return matchesSearch && matchesTeam;
  });

  const currentRealPlayer =
    activeRoster.find((p) => p.track_id === selectedRealTrackId) ||
    filteredRealPlayers[0] ||
    activeRoster[0];

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

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono px-2.5 py-1 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/25">
              Team A Track IDs: {realAnalytics?.summary_metrics?.team_a_count || 0}
            </span>
            <span className="text-xs font-mono px-2.5 py-1 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/25">
              Team B Track IDs: {realAnalytics?.summary_metrics?.team_b_count || 0}
            </span>
            {(realAnalytics?.summary_metrics?.officials_count || 0) > 0 && (
              <span className="text-xs font-mono px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/25">
                Ref IDs: {realAnalytics?.summary_metrics?.officials_count}
              </span>
            )}
            <span className="text-xs font-mono text-emerald-400 bg-[#101722] px-3 py-1 rounded-xl border border-[#253244]">
              Confirmed Track IDs: <strong>{realPlayers.length}</strong>
            </span>
          </div>
        </div>

        {/* Workspace Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Player Selection & Filter List (4 cols) */}
          <div className="lg:col-span-4 bg-[#101722] border border-[#253244] rounded-2xl p-4 sm:p-5 shadow-panel flex flex-col justify-between">
            <div>
              {/* Roster Type Selector (Confirmed vs Transient) */}
              <div className="flex items-center gap-1.5 p-1 bg-[#080B10] rounded-xl border border-[#253244] text-[11px] font-mono mb-3">
                <button
                  onClick={() => setShowTransient(false)}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-center transition-colors font-medium ${
                    !showTransient
                      ? 'bg-emerald-500 text-black font-bold shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Confirmed IDs ({realPlayers.length})
                </button>
                <button
                  onClick={() => setShowTransient(true)}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-center transition-colors font-medium ${
                    showTransient
                      ? 'bg-amber-500 text-black font-bold shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Transient ({transientTracks.length})
                </button>
              </div>

              {/* Team Filter Pills (when looking at confirmed roster) */}
              {!showTransient && (
                <div className="flex items-center gap-1 overflow-x-auto pb-1 mb-3 scrollbar-none text-[10px] font-mono">
                  <button
                    onClick={() => setTeamFilter('all')}
                    className={`px-2.5 py-1 rounded-lg border transition-colors ${
                      teamFilter === 'all'
                        ? 'bg-[#17212E] text-white border-emerald-500/50 font-bold'
                        : 'bg-[#080B10] text-slate-400 border-[#253244] hover:text-white'
                    }`}
                  >
                    All ({realPlayers.length})
                  </button>
                  <button
                    onClick={() => setTeamFilter('team_a')}
                    className={`px-2.5 py-1 rounded-lg border transition-colors flex items-center gap-1.5 ${
                      teamFilter === 'team_a'
                        ? 'bg-sky-500/20 text-sky-400 border-sky-500/50 font-bold'
                        : 'bg-[#080B10] text-slate-400 border-[#253244] hover:text-sky-300'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-[#38BDF8]"></span>
                    Team A
                  </button>
                  <button
                    onClick={() => setTeamFilter('team_b')}
                    className={`px-2.5 py-1 rounded-lg border transition-colors flex items-center gap-1.5 ${
                      teamFilter === 'team_b'
                        ? 'bg-rose-500/20 text-rose-400 border-rose-500/50 font-bold'
                        : 'bg-[#080B10] text-slate-400 border-[#253244] hover:text-rose-300'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-[#F43F5E]"></span>
                    Team B
                  </button>
                  <button
                    onClick={() => setTeamFilter('referee')}
                    className={`px-2.5 py-1 rounded-lg border transition-colors flex items-center gap-1.5 ${
                      teamFilter === 'referee'
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/50 font-bold'
                        : 'bg-[#080B10] text-slate-400 border-[#253244] hover:text-amber-300'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-[#FACC15]"></span>
                    Refs
                  </button>
                  <button
                    onClick={() => setTeamFilter('unknown')}
                    className={`px-2.5 py-1 rounded-lg border transition-colors flex items-center gap-1.5 ${
                      teamFilter === 'unknown'
                        ? 'bg-slate-500/20 text-slate-300 border-slate-500/50 font-bold'
                        : 'bg-[#080B10] text-slate-400 border-[#253244] hover:text-slate-200'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-[#94A3B8]"></span>
                    Unk
                  </button>
                </div>
              )}

              {/* Search Input */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by track ID (e.g. 1, 2)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#080B10] border border-[#253244] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 font-mono"
                />
              </div>

              {/* Roster Scroll List */}
              <div className="mt-3 space-y-2 max-h-[460px] overflow-y-auto pr-1">
                {filteredRealPlayers.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400 bg-[#080B10] rounded-xl border border-[#253244]">
                    No tracked player found matching query.
                  </div>
                ) : (
                  filteredRealPlayers.map((p) => {
                    const isSelected = p.track_id === currentRealPlayer?.track_id;
                    const pTeamColor = p.team_color || '#10B981';

                    return (
                      <button
                        key={p.track_id}
                        onClick={() => setSelectedRealTrackId(p.track_id)}
                        className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-colors ${
                          isSelected
                            ? 'bg-[#17212E] border-emerald-500/60 shadow-sm'
                            : 'bg-[#17212E]/40 border-[#253244] hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className="w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-xs"
                            style={{
                              backgroundColor: `${pTeamColor}20`,
                              color: pTeamColor,
                              border: `1px solid ${pTeamColor}40`,
                            }}
                          >
                            #{p.track_id}
                          </span>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="text-xs font-semibold text-white truncate max-w-[110px]">{p.label}</p>
                              {p.team && (
                                <span
                                  className="text-[9px] font-mono px-1.5 py-0.2 rounded font-semibold"
                                  style={{
                                    backgroundColor: `${pTeamColor}18`,
                                    color: pTeamColor,
                                  }}
                                >
                                  {p.team}
                                </span>
                              )}
                            </div>
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
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-[#253244] gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center font-mono font-bold text-lg"
                      style={{
                        backgroundColor: `${currentRealPlayer.team_color || '#10B981'}25`,
                        color: currentRealPlayer.team_color || '#10B981',
                        border: `1.5px solid ${currentRealPlayer.team_color || '#10B981'}50`,
                      }}
                    >
                      #{currentRealPlayer.track_id}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-white tracking-tight">
                          {currentRealPlayer.label}
                        </h3>
                        {currentRealPlayer.team && (
                          <span
                            className="text-xs font-mono font-bold px-2 py-0.5 rounded-lg border"
                            style={{
                              backgroundColor: `${currentRealPlayer.team_color || '#10B981'}15`,
                              color: currentRealPlayer.team_color || '#10B981',
                              borderColor: `${currentRealPlayer.team_color || '#10B981'}40`,
                            }}
                          >
                            {currentRealPlayer.team}
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-mono text-slate-400 mt-0.5">
                        ByteTrack ID: #{currentRealPlayer.track_id} • Object Class: Person (COCO 0)
                      </p>
                    </div>
                  </div>

                  <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-xl">
                    Active Duration: <strong>{currentRealPlayer.visibility_duration_seconds}s</strong>
                  </span>
                </div>

                {/* Team & Jersey Color Classification Card */}
                {currentRealPlayer.team && (
                  <div className="p-4 bg-[#080B10] border border-[#253244] rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {/* Jersey Swatch */}
                      <div
                        className="w-10 h-10 rounded-xl border border-white/20 shadow-md flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor: currentRealPlayer.jersey_color_rgb
                            ? `rgb(${currentRealPlayer.jersey_color_rgb.join(',')})`
                            : currentRealPlayer.team_color || '#38BDF8',
                        }}
                        title={currentRealPlayer.jersey_color_rgb ? `RGB: ${currentRealPlayer.jersey_color_rgb.join(', ')}` : currentRealPlayer.team}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-slate-400 uppercase">Jersey Classification</span>
                          <span
                            className="text-[10px] font-mono px-1.5 py-0.2 rounded font-bold"
                            style={{
                              backgroundColor: `${currentRealPlayer.team_color || '#38BDF8'}20`,
                              color: currentRealPlayer.team_color || '#38BDF8',
                            }}
                          >
                            {currentRealPlayer.team}
                          </span>
                        </div>
                        <p className="text-xs font-mono text-white font-semibold mt-0.5">
                          {currentRealPlayer.jersey_color_rgb ? (
                            <>
                              RGB({currentRealPlayer.jersey_color_rgb.join(', ')})
                              <span className="text-slate-500 ml-2 font-normal">
                                • Hex: #{currentRealPlayer.jersey_color_rgb.map(x => x.toString(16).padStart(2, '0')).join('').toUpperCase()}
                              </span>
                            </>
                          ) : (
                            'Kit Assigned'
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="text-[11px] font-mono text-slate-400 sm:text-right">
                      <span className="block text-slate-500 text-[10px]">Method</span>
                      <span>K-Means Torso Clustering (HSV Masked)</span>
                    </div>
                  </div>
                )}

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
