import React from 'react';
import {
  Gauge,
  Activity,
  Crosshair,
  Zap,
  Cpu,
  Video,
  Play,
  ArrowRight,
  Shield,
  Layers,
  Sparkles,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import DemoBanner from '../common/DemoBanner';
import DemoBadge from '../common/DemoBadge';
import StatCard from '../common/StatCard';
import VideoUploadSection from './VideoUploadSection';
import PossessionChart from './PossessionChart';

export const OverviewTab = ({
  data,
  onVideoUploaded,
  onNavigateToTab,
  onSelectPlayerForTracking,
  onLoadDemoClip,
  activeVideoName,
}) => {
  const teamA = data?.team_a;
  const teamB = data?.team_b;
  const topPlayers = data?.players?.slice(0, 5) || [];
  const possessionTrend = data?.possession_trend || [];
  const pipelineStages = data?.pipeline_stages || [];

  return (
    <div className="space-y-7 max-w-7xl mx-auto">
      {/* Sticky / Expandable Demo Notice */}
      <DemoBanner />

      {/* Hero Welcome & Product Introduction Console */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0E1524] via-[#0A0E17] to-[#070A0F] border border-[#1E2638] p-6 sm:p-8 shadow-2xl shadow-black/80">
        {/* Subtle pitch turf glow */}
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-80 h-80 rounded-full bg-emerald-500/10 filter blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 font-mono text-[11px] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                AI Tactical Football Analytics Platform
              </span>
              <span className="text-slate-400 text-xs font-mono hidden sm:inline">v0.1.0-alpha</span>
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Tactical Football Intelligence via Computer Vision
            </h2>

            <p className="text-sm text-slate-300 mt-2.5 leading-relaxed">
              Designed for performance analysts and tactical coaches. Ingest broadcast or tactical match footage, 
              track multi-player kinematics with ByteTrack, calibrate pitch perspective via homography, 
              and extract team spatial density in real time.
            </p>

            <div className="flex flex-wrap items-center gap-3 mt-5">
              <button
                onClick={() => onNavigateToTab('match_analysis')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
              >
                <Play className="w-4 h-4 fill-black" />
                <span>Launch Match Studio</span>
              </button>

              <button
                onClick={() => onNavigateToTab('player_tracking')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#141D2E] hover:bg-[#1C283F] text-slate-200 border border-[#1E2638] font-medium text-xs transition-colors"
              >
                <Activity className="w-4 h-4 text-sky-400" />
                <span>Player MOT Roster</span>
              </button>

              <button
                onClick={onLoadDemoClip}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-amber-300 border border-amber-500/30 font-mono text-xs transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Load Sample Match</span>
              </button>
            </div>
          </div>

          {/* Quick Match Overview Badge */}
          <div className="p-4 sm:p-5 rounded-xl bg-[#080C14]/90 border border-[#1E2638] shrink-0 min-w-[280px]">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E2638] text-xs">
              <span className="font-mono text-slate-400 text-[10px] uppercase tracking-wider">
                Active Match Analysis
              </span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Full Time (90')
              </span>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <div>
                <p className="font-bold text-white text-sm">{teamA?.team_name || 'Man Blue'}</p>
                <p className="text-[10px] font-mono text-sky-400">{teamA?.formation || '4-3-3'}</p>
              </div>
              <div className="text-center px-3 py-1 rounded bg-[#0A0E17] border border-slate-800">
                <span className="text-xl font-extrabold text-white font-mono">2 - 1</span>
                <span className="block text-[9px] font-mono text-slate-400">DEMO</span>
              </div>
              <div className="text-right">
                <p className="font-bold text-white text-sm">{teamB?.team_name || 'London Red'}</p>
                <p className="text-[10px] font-mono text-rose-400">{teamB?.formation || '4-2-3-1'}</p>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-[#1E2638] flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>Possession:</span>
              <span className="text-slate-200">
                <strong className="text-sky-400">{teamA?.possession_pct || 58.4}%</strong> vs{' '}
                <strong className="text-rose-400">{teamB?.possession_pct || 41.6}%</strong>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Video Upload Gateway (Priority Action) */}
      <VideoUploadSection
        onUploadSuccess={onVideoUploaded}
        onSelectVideoForAnalysis={() => onNavigateToTab('match_analysis')}
        onLoadDemoClip={onLoadDemoClip}
      />

      {/* Primary Performance Indicators (Restrained, high-impact) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Team Possession"
          value={teamA?.possession_pct ? `${teamA.possession_pct}%` : '58.4%'}
          subtitle={`${teamA?.team_name || 'Man Blue'}: 58.4% vs ${teamB?.team_name || 'London Red'}: 41.6%`}
          icon={Gauge}
          trend="+4.2% vs avg"
          accent="cyan"
          isDemo={true}
        />
        <StatCard
          title="Passing Completion"
          value={teamA?.pass_accuracy_pct ? `${teamA.pass_accuracy_pct}%` : '89.1%'}
          subtitle={`${teamA?.completed_passes || 545} of ${teamA?.total_passes || 612} passes completed`}
          icon={Crosshair}
          trend="+1.8% vs avg"
          accent="emerald"
          isDemo={true}
        />
        <StatCard
          title="Collective Distance"
          value={teamA?.total_distance_km ? `${teamA.total_distance_km}` : '112.4'}
          unit="km"
          subtitle="Team cumulative running load"
          icon={Activity}
          trend="High work rate"
          accent="amber"
          isDemo={true}
        />
        <StatCard
          title="High-Speed Sprints"
          value={teamA?.high_intensity_runs ? `${teamA.high_intensity_runs}` : '142'}
          unit="runs"
          subtitle="Exertion events > 25.2 km/h"
          icon={Zap}
          trend="+14% intensity"
          accent="rose"
          isDemo={true}
        />
      </div>

      {/* Possession Flow & Team Performance Benchmark */}
      <PossessionChart
        possessionTrend={possessionTrend}
        teamA={teamA}
        teamB={teamB}
      />

      {/* Key Players & Vision Pipeline Architecture */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Key Player Performance Roster */}
        <div className="lg:col-span-2 bg-[#0A0E17] border border-[#1E2638] rounded-2xl p-5 shadow-xl shadow-black/40">
          <div className="flex items-center justify-between pb-4 border-b border-[#1E2638]">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-tight">Key Player Tracking Roster</h3>
                <DemoBadge size="xs" />
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Multi-Object Tracking (MOT) telemetry from tactical camera footage.
              </p>
            </div>

            <button
              onClick={() => onNavigateToTab('player_tracking')}
              className="text-xs font-mono text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
            >
              <span>Full Roster</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto mt-4">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 font-mono border-b border-[#1E2638] pb-2 text-[11px]">
                  <th className="pb-2 font-medium">Player & Role</th>
                  <th className="pb-2 font-medium">Team</th>
                  <th className="pb-2 font-medium">Distance</th>
                  <th className="pb-2 font-medium">Top Speed</th>
                  <th className="pb-2 font-medium">Sprints</th>
                  <th className="pb-2 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E2638]/50 font-mono">
                {topPlayers.map((player) => (
                  <tr key={player.id} className="hover:bg-[#0E1524]/60 transition-colors">
                    <td className="py-3 pr-2">
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center font-bold text-slate-200 text-[10px]">
                          {player.jersey_number}
                        </span>
                        <div>
                          <p className="font-sans font-semibold text-white text-xs">{player.name}</p>
                          <p className="text-[10px] text-slate-400">{player.role || player.position}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 text-slate-300 font-sans text-xs">{player.team_name}</td>
                    <td className="py-3 font-semibold text-emerald-400">{player.distance_km} km</td>
                    <td className="py-3 text-slate-200">{player.top_speed_kmh} km/h</td>
                    <td className="py-3 text-slate-300">{player.sprints}</td>
                    <td className="py-3">
                      <button
                        onClick={() => {
                          if (onSelectPlayerForTracking) onSelectPlayerForTracking(player.id);
                          onNavigateToTab('player_tracking');
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-300 border border-slate-700 hover:border-emerald-500/40 text-[10px] font-mono flex items-center gap-1 transition-all"
                      >
                        <span>Inspect</span>
                        <ArrowRight className="w-2.5 h-2.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* End-to-End Pipeline Architecture (Inspired by VisionDrive Screenshot 4) */}
        <div className="bg-[#0A0E17] border border-[#1E2638] rounded-2xl p-5 shadow-xl shadow-black/40 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#1E2638]">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white tracking-tight">Kinematic CV Pipeline</h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400">Spec v2</span>
            </div>

            <div className="mt-4 space-y-3">
              {pipelineStages.map((stage, idx) => (
                <div key={idx} className="p-2.5 rounded-xl bg-[#080C14] border border-[#1E2638] text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-emerald-400 font-bold">
                      STAGE {stage.step}
                    </span>
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.2 rounded ${
                        stage.status.includes('Operational')
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-amber-500/15 text-amber-300'
                      }`}
                    >
                      {stage.status}
                    </span>
                  </div>
                  <p className="font-semibold text-white mt-1 text-xs">{stage.name}</p>
                  <p className="text-[10px] font-mono text-slate-400 mt-0.5">{stage.engine}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#1E2638]">
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs">
              <p className="font-semibold text-slate-200">Phase 1 Boundary Notice:</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Full video ingestion, responsive studios, and layout validation active. YOLOv8 weights and ByteTrack tracking hooks run in Phase 2.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewTab;
