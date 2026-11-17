import React, { useState } from 'react';
import {
  UserCheck,
  Cpu,
  Activity,
  Zap,
  ShieldCheck,
  Search,
  Filter,
  ArrowRight,
  ChevronRight,
  TrendingUp,
  Compass,
  Layers,
  Scale,
} from 'lucide-react';
import DemoBanner from '../common/DemoBanner';
import DemoBadge from '../common/DemoBadge';
import PitchCanvas from '../common/PitchCanvas';
import { Line } from 'react-chartjs-2';

export const PlayerTrackingView = ({ data, initialSelectedPlayerId = 17 }) => {
  const [selectedPlayerId, setSelectedPlayerId] = useState(initialSelectedPlayerId);
  const [comparePlayerId, setComparePlayerId] = useState(8);
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [teamFilter, setTeamFilter] = useState('all'); // 'all' | 'man_blue' | 'lon_red'
  const [searchQuery, setSearchQuery] = useState('');

  const players = data?.players || [];

  // Filter players
  const filteredPlayers = players.filter((p) => {
    const matchesTeam = teamFilter === 'all' || p.team_id === teamFilter;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.jersey_number.toString().includes(searchQuery) ||
      p.track_id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTeam && matchesSearch;
  });

  const current = players.find((p) => p.id === selectedPlayerId) || players[0];
  const compareTarget = players.find((p) => p.id === comparePlayerId) || players[1];

  // Chart data for speed profile
  const speedChartData = {
    labels: ["10'", "20'", "30'", "40'", "50'", "60'", "70'", "80'"],
    datasets: [
      {
        label: `${current.name} (${current.team_name})`,
        data: current.speed_profile || [12, 18, 24, 30, 22, 19, 25, 27],
        borderColor: current.team_id === 'man_blue' ? '#38BDF8' : '#EF4444',
        backgroundColor: current.team_id === 'man_blue' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(239, 68, 68, 0.15)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: current.team_id === 'man_blue' ? '#38BDF8' : '#EF4444',
        pointRadius: 4,
      },
      ...(isCompareMode
        ? [
            {
              label: `${compareTarget.name} (${compareTarget.team_name})`,
              data: compareTarget.speed_profile || [10, 15, 22, 28, 20, 16, 21, 23],
              borderColor: compareTarget.team_id === 'man_blue' ? '#38BDF8' : '#EF4444',
              backgroundColor: 'transparent',
              borderDash: [5, 5],
              tension: 0.4,
              pointRadius: 4,
            },
          ]
        : []),
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: '#94A3B8', font: { family: 'Inter', size: 11 } },
      },
      tooltip: {
        backgroundColor: '#0F172A',
        borderColor: '#1E2638',
        borderWidth: 1,
        titleColor: '#F8FAFC',
        bodyColor: '#94A3B8',
        callbacks: {
          label: (context) => ` Speed: ${context.parsed.y} km/h`,
        },
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(30, 38, 56, 0.4)' },
        ticks: { color: '#64748B', font: { family: 'JetBrains Mono', size: 10 } },
      },
      y: {
        grid: { color: 'rgba(30, 38, 56, 0.4)' },
        ticks: {
          color: '#64748B',
          font: { family: 'JetBrains Mono', size: 10 },
          callback: (val) => `${val} km/h`,
        },
      },
    },
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <DemoBanner />

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-[#1E2638]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">Player MOT Tracking & Telemetry</h2>
            <DemoBadge />
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Multi-Object Tracking (ByteTrack) kinematics, calibrated coordinates, speed curves, and trails.
          </p>
        </div>

        {/* Compare Mode Toggle */}
        <button
          onClick={() => setIsCompareMode(!isCompareMode)}
          className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium flex items-center gap-1.5 transition-all ${
            isCompareMode
              ? 'bg-emerald-500 text-black font-bold shadow-md shadow-emerald-500/20'
              : 'bg-slate-900 text-slate-300 border border-slate-700 hover:text-white'
          }`}
        >
          <Scale className="w-3.5 h-3.5" />
          <span>Compare Mode: {isCompareMode ? 'ON' : 'OFF'}</span>
        </button>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Player Selection & Filter List (4 cols) */}
        <div className="lg:col-span-4 bg-[#0A0E17] border border-[#1E2638] rounded-2xl p-4 sm:p-5 shadow-2xl shadow-black/60 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#1E2638]">
              <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Tracked Player Roster
              </span>
              <span className="text-[10px] font-mono text-emerald-400">
                {filteredPlayers.length} Active
              </span>
            </div>

            {/* Team Filter Pills */}
            <div className="mt-3 flex gap-1 p-1 bg-[#080C14] rounded-xl border border-[#1E2638] text-[11px] font-mono">
              <button
                onClick={() => setTeamFilter('all')}
                className={`flex-1 py-1 rounded-lg text-center transition-colors ${
                  teamFilter === 'all' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-white'
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
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#080C14] border border-[#1E2638] text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500/50"
              />
            </div>

            {/* Roster Scroll List */}
            <div className="mt-3 space-y-2 max-h-[460px] overflow-y-auto pr-1">
              {filteredPlayers.map((p) => {
                const isSelected = p.id === selectedPlayerId;
                const isTeamA = p.team_id === 'man_blue';

                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPlayerId(p.id)}
                    className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                      isSelected
                        ? 'bg-emerald-500/15 border-emerald-500/50 shadow-sm shadow-emerald-500/20'
                        : 'bg-[#0E1524]/60 border-[#1E2638] hover:border-slate-700'
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
                        <p className="text-xs font-semibold text-white truncate max-w-[140px]">{p.name}</p>
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
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Player Movement Trails Pitch & Kinematics Console (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Movement Trail on Calibrated 2D Pitch */}
          <div className="bg-[#0A0E17] border border-[#1E2638] rounded-2xl p-5 shadow-2xl shadow-black/60">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E2638] mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <h3 className="text-sm font-bold text-white tracking-tight">
                    {current.name} (#{current.jersey_number}) • Tactical Movement Trail
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mt-0.5 font-mono">
                  Track ID: <strong className="text-emerald-400">{current.track_id}</strong> • Role: {current.role}
                </p>
              </div>

              <span className="text-[10px] font-mono text-slate-300 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded">
                Calibrated Metric Coords: ({((current.pitch_x / 100) * 105).toFixed(1)}m, {((current.pitch_y / 100) * 68).toFixed(1)}m)
              </span>
            </div>

            {/* Pitch with SVG movement trail */}
            <PitchCanvas heightClass="h-72 sm:h-80 md:h-[340px]">
              {/* Movement Trail Line */}
              {current.trail && current.trail.length > 1 && (
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                  <polyline
                    points={current.trail.map((pt) => `${pt.x}%,${pt.y}%`).join(' ')}
                    fill="none"
                    stroke={current.team_id === 'man_blue' ? '#38BDF8' : '#EF4444'}
                    strokeWidth="2.5"
                    strokeDasharray="4,2"
                    strokeOpacity="0.8"
                  />
                  {current.trail.map((pt, idx) => (
                    <circle
                      key={idx}
                      cx={`${pt.x}%`}
                      cy={`${pt.y}%`}
                      r="3"
                      fill={current.team_id === 'man_blue' ? '#38BDF8' : '#EF4444'}
                      fillOpacity="0.7"
                    />
                  ))}
                </svg>
              )}

              {/* Current Player Anchor Marker */}
              <div
                className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto z-20"
                style={{ left: `${current.pitch_x}%`, top: `${current.pitch_y}%` }}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center font-mono font-bold text-xs text-black shadow-lg ring-4 ring-emerald-400/50 ${
                    current.team_id === 'man_blue' ? 'bg-sky-400' : 'bg-rose-500 text-white'
                  }`}
                >
                  {current.jersey_number}
                </div>
              </div>
            </PitchCanvas>
          </div>

          {/* Detailed Kinematics Telemetry Grid */}
          <div className="bg-[#0A0E17] border border-[#1E2638] rounded-2xl p-5 shadow-2xl shadow-black/60">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E2638] mb-4">
              <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Kinematics & Computer Vision State
              </span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Kalman State: Stable
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-[#080C14] border border-[#1E2638] rounded-xl">
                <span className="text-[9px] font-mono text-slate-400 block uppercase">Total Distance</span>
                <p className="text-xl font-extrabold text-white font-mono mt-1">
                  {current.distance_km} <span className="text-xs font-normal text-emerald-400">km</span>
                </p>
              </div>

              <div className="p-3 bg-[#080C14] border border-[#1E2638] rounded-xl">
                <span className="text-[9px] font-mono text-slate-400 block uppercase">Peak Speed</span>
                <p className="text-xl font-extrabold text-white font-mono mt-1">
                  {current.top_speed_kmh} <span className="text-xs font-normal text-emerald-400">km/h</span>
                </p>
              </div>

              <div className="p-3 bg-[#080C14] border border-[#1E2638] rounded-xl">
                <span className="text-[9px] font-mono text-slate-400 block uppercase">High Sprints</span>
                <p className="text-xl font-extrabold text-white font-mono mt-1">
                  {current.sprints} <span className="text-xs font-normal text-emerald-400">runs</span>
                </p>
              </div>

              <div className="p-3 bg-[#080C14] border border-[#1E2638] rounded-xl">
                <span className="text-[9px] font-mono text-slate-400 block uppercase">Pass Accuracy</span>
                <p className="text-xl font-extrabold text-white font-mono mt-1">
                  {current.pass_accuracy}%
                </p>
              </div>
            </div>

            {/* Speed Profile Over Match Time */}
            <div className="mt-5 pt-4 border-t border-[#1E2638]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-semibold text-slate-300">
                  Instantaneous Speed Profile (10-minute intervals)
                </span>
                <span className="text-[10px] font-mono text-slate-400">Sprint Cutoff: 25.2 km/h</span>
              </div>
              <div className="h-44">
                <Line data={speedChartData} options={chartOptions} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerTrackingView;
