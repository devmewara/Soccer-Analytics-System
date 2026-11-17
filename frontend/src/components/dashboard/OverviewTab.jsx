import React from 'react';
import {
  Gauge,
  Activity,
  Crosshair,
  Zap,
  Cpu,
  Play,
  ArrowRight,
  Shield,
  Layers,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  Clock,
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
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Feature & Demo Dataset Status Notice */}
      <DemoBanner />

      {/* Hero Welcome & Match Command Center Console */}
      <div className="rounded-2xl bg-[#101722] border border-[#253244] p-6 sm:p-7 shadow-panel">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-2.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 font-mono text-[11px] font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                AI Soccer Match Analytics
              </span>
              <span className="text-slate-400 text-xs font-mono">v0.1.0-alpha</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-snug">
              Match Analysis Command Center
            </h2>

            <p className="text-sm text-slate-300 mt-2 leading-relaxed">
              Ingest full match video or tactical clips, calibrate pitch perspective via homography, 
              and inspect team structure, player kinematics, and spatial heatmaps.
            </p>

            <div className="flex flex-wrap items-center gap-3 mt-5">
              <button
                onClick={() => onNavigateToTab('match_analysis')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs shadow-sm transition-all active:scale-95"
              >
                <Play className="w-3.5 h-3.5 fill-black" />
                <span>Launch Match Studio</span>
              </button>

              <button
                onClick={() => onNavigateToTab('player_tracking')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#17212E] hover:bg-[#1E2B3C] text-slate-200 border border-[#253244] font-medium text-xs transition-colors"
              >
                <Activity className="w-4 h-4 text-emerald-400" />
                <span>Player MOT Tracking</span>
              </button>

              <button
                onClick={onLoadDemoClip}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#17212E] hover:bg-[#1E2B3C] text-amber-300 border border-amber-500/30 font-mono text-xs transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Load Sample Match</span>
              </button>
            </div>
          </div>

          {/* Active Context Card */}
          <div className="p-4 sm:p-5 rounded-xl bg-[#080B10] border border-[#253244] shrink-0 min-w-[270px]">
            <div className="flex items-center justify-between pb-2.5 border-b border-[#253244] text-xs">
              <span className="font-mono text-slate-400 text-[10px] uppercase tracking-wider">
                Active Match Context
              </span>
              <DemoBadge size="xs" label="SAMPLE DATA" />
            </div>

            <div className="mt-3 flex items-center justify-between">
              <div>
                <p className="font-bold text-white text-sm">{teamA?.team_name || 'Man Blue'}</p>
                <p className="text-[10px] font-mono text-sky-400">{teamA?.formation || '4-3-3'}</p>
              </div>
              <div className="text-center px-3 py-1 rounded bg-[#101722] border border-[#253244]">
                <span className="text-xl font-bold text-white font-mono">2 - 1</span>
              </div>
              <div className="text-right">
                <p className="font-bold text-white text-sm">{teamB?.team_name || 'London Red'}</p>
                <p className="text-[10px] font-mono text-rose-400">{teamB?.formation || '4-2-3-1'}</p>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-[#253244] flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>Possession:</span>
              <span className="text-slate-200">
                <strong className="text-sky-400">{teamA?.possession_pct || 58.4}%</strong> vs{' '}
                <strong className="text-rose-400">{teamB?.possession_pct || 41.6}%</strong>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Prominent Video Upload & Storage Section (Core Workflow Priority) */}
      <VideoUploadSection
        onUploadSuccess={onVideoUploaded}
        onSelectVideoForAnalysis={() => onNavigateToTab('match_analysis')}
        onLoadDemoClip={onLoadDemoClip}
      />

      {/* Purposeful Performance Indicators (Clearly Badged as Demo) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Team Possession"
          value={teamA?.possession_pct ? `${teamA.possession_pct}%` : '58.4%'}
          subtitle={`${teamA?.team_name || 'Man Blue'}: 58.4% vs ${teamB?.team_name || 'London Red'}: 41.6%`}
          icon={Gauge}
          trend="+4.2% vs avg"
          isDemo={true}
        />
        <StatCard
          title="Passing Completion"
          value={teamA?.pass_accuracy_pct ? `${teamA.pass_accuracy_pct}%` : '89.1%'}
          subtitle={`${teamA?.completed_passes || 545} / ${teamA?.total_passes || 612} passes`}
          icon={Crosshair}
          trend="+1.8% vs avg"
          isDemo={true}
        />
        <StatCard
          title="Total Distance"
          value={teamA?.total_distance_km ? `${teamA.total_distance_km}` : '112.4'}
          unit="km"
          subtitle="Collective running volume"
          icon={Activity}
          trend="High work rate"
          isDemo={true}
        />
        <StatCard
          title="High-Speed Sprints"
          value={teamA?.high_intensity_runs ? `${teamA.high_intensity_runs}` : '142'}
          unit="runs"
          subtitle="Exertion events > 25.2 km/h"
          icon={Zap}
          trend="+14% intensity"
          isDemo={true}
        />
      </div>

      {/* Possession Flow Trend & Performance Benchmark */}
      <PossessionChart
        possessionTrend={possessionTrend}
        teamA={teamA}
        teamB={teamB}
      />

      {/* Key Players & Computer Vision Pipeline Stages */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Key Player Performance Roster */}
        <div className="lg:col-span-2 bg-[#101722] border border-[#253244] rounded-2xl p-5 shadow-panel">
          <div className="flex items-center justify-between pb-3.5 border-b border-[#253244]">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-tight">Key Player Tracking Roster</h3>
                <DemoBadge size="xs" label="SAMPLE DATA" />
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Simulated Multi-Object Tracking (MOT) telemetry from tactical camera footage.
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
                <tr className="text-slate-400 font-mono border-b border-[#253244] pb-2 text-[11px]">
                  <th className="pb-2 font-medium">Player & Role</th>
                  <th className="pb-2 font-medium">Team</th>
                  <th className="pb-2 font-medium">Distance</th>
                  <th className="pb-2 font-medium">Top Speed</th>
                  <th className="pb-2 font-medium">Sprints</th>
                  <th className="pb-2 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#253244]/60 font-mono">
                {topPlayers.map((player) => (
                  <tr key={player.id} className="hover:bg-[#17212E]/50 transition-colors">
                    <td className="py-3 pr-2">
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded bg-[#17212E] border border-[#253244] flex items-center justify-center font-bold text-slate-200 text-[10px]">
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
                    <td className="py-3 text-slate-300">{player.top_speed_kmh} km/h</td>
                    <td className="py-3 text-slate-300">{player.sprints}</td>
                    <td className="py-3">
                      <button
                        onClick={() => {
                          if (onSelectPlayerForTracking) onSelectPlayerForTracking(player.id);
                          onNavigateToTab('player_tracking');
                        }}
                        className="px-2.5 py-1 rounded bg-[#17212E] hover:bg-[#1E2B3C] text-slate-300 hover:text-white border border-[#253244] text-[10px] font-mono flex items-center gap-1 transition-colors"
                      >
                        <span>Inspect</span>
                        <ArrowRight className="w-2.5 h-2.5 text-emerald-400" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Compact Computer Vision Architecture Pipeline */}
        <div className="bg-[#101722] border border-[#253244] rounded-2xl p-5 shadow-panel flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#253244]">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white tracking-tight">Kinematic CV Pipeline</h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400">Spec v2</span>
            </div>

            <div className="mt-3.5 space-y-2.5">
              {pipelineStages.map((stage, idx) => (
                <div key={idx} className="p-2.5 rounded-xl bg-[#080B10] border border-[#253244] text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-emerald-400 font-bold">
                      STAGE {stage.step}
                    </span>
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${
                        stage.status.includes('Operational')
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
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

          <div className="mt-4 pt-3 border-t border-[#253244]">
            <div className="p-3 bg-[#080B10] rounded-xl border border-[#253244] text-xs">
              <p className="font-semibold text-slate-300">Phase 1 Status:</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Video upload, storage, and layout validation operational. YOLO detection and tracking will be trained/integrated in Phase 2.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewTab;
