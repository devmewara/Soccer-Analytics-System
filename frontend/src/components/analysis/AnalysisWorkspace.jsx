import React, { useState } from 'react';
import {
  Film,
  UserCheck,
  BarChart3,
  Flame,
  LayoutDashboard,
  Sparkles,
  ArrowLeft,
  HardDrive,
  Cpu,
  Info,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
} from 'lucide-react';
import DemoBadge from '../common/DemoBadge';
import MatchAnalysisView from '../views/MatchAnalysisView';
import PlayerTrackingView from '../views/PlayerTrackingView';
import TeamAnalyticsView from '../views/TeamAnalyticsView';
import HeatmapsView from '../views/HeatmapsView';
import PossessionChart from '../dashboard/PossessionChart';

export const AnalysisWorkspace = ({
  activeVideo,
  isDemoMode,
  data,
  onBackToHome,
  onLaunchDemo,
}) => {
  // Horizontal tab within Analysis Workspace
  const [activeTab, setActiveTab] = useState('video_analysis');

  const tabs = [
    { id: 'video_analysis', label: 'Video Analysis', icon: Film },
    { id: 'player_tracking', label: 'Player Tracking', icon: UserCheck },
    { id: 'team_analytics', label: 'Team Analytics', icon: BarChart3 },
    { id: 'heatmaps', label: 'Heatmaps', icon: Flame },
    { id: 'overview', label: 'Match Overview', icon: LayoutDashboard },
  ];

  // 1. Empty State if no video is loaded and not in demo mode
  if (!activeVideo && !isDemoMode) {
    return (
      <div className="max-w-3xl mx-auto py-16 px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#101722] border border-[#253244] flex items-center justify-center text-slate-400 mx-auto mb-5 shadow-panel">
          <Film className="w-8 h-8 text-emerald-400" />
        </div>

        <h2 className="text-2xl font-bold text-white tracking-tight">No Match Video Selected</h2>
        <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto leading-relaxed">
          Upload a football match recording to begin analysis, or launch the demonstration showcase to explore the tactical interface.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
          <button
            onClick={onBackToHome}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs shadow-sm transition-all"
          >
            <span>Upload Match Video</span>
          </button>

          <button
            onClick={onLaunchDemo}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#17212E] hover:bg-[#1E2B3C] text-amber-300 border border-amber-500/30 text-xs font-mono font-medium transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Launch Sample Demo</span>
          </button>
        </div>
      </div>
    );
  }

  const isUserUploadedVideo = Boolean(activeVideo?.stream_url || activeVideo?.saved_filename);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Workspace Context Top Bar */}
      <div className="bg-[#101722] border border-[#253244] rounded-2xl p-4 sm:p-5 shadow-panel">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToHome}
              className="p-2 rounded-lg bg-[#17212E] hover:bg-[#1E2B3C] text-slate-400 hover:text-white border border-[#253244] transition-colors"
              title="Return to Home / Uploads"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                  Analysis Workspace
                </span>
                <span className="text-slate-600">/</span>
                <span className="text-xs font-mono text-emerald-400 font-semibold">
                  {isDemoMode ? 'Sample Demo Sandbox' : 'User Footage'}
                </span>
                {isDemoMode ? (
                  <DemoBadge size="xs" label="DEMO SANDBOX" />
                ) : (
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    RAW VIDEO ACTIVE
                  </span>
                )}
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight mt-0.5">
                {isDemoMode
                  ? 'Manchester Blue vs London Red (Exhibition Showcase)'
                  : activeVideo?.original_filename || activeVideo?.filename}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            {isUserUploadedVideo && (
              <span className="text-[11px] font-mono text-slate-400 bg-[#080B10] px-3 py-1.5 rounded-lg border border-[#253244]">
                Size: {activeVideo.file_size_formatted || 'Raw footage'}
              </span>
            )}
            {isDemoMode && (
              <button
                onClick={onBackToHome}
                className="text-xs font-mono text-slate-400 hover:text-white bg-[#17212E] px-3 py-1.5 rounded-lg border border-[#253244] transition-colors"
              >
                Exit Demo
              </button>
            )}
          </div>
        </div>

        {/* Horizontal Navigation Tabs */}
        <div className="mt-5 pt-4 border-t border-[#253244] flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-[#17212E] text-white font-semibold border border-[#253244] shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#17212E]/50 border border-transparent'
                }`}
              >
                <Icon
                  className={`w-3.5 h-3.5 ${
                    isActive ? 'text-emerald-400' : 'text-slate-500'
                  }`}
                />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="transition-opacity duration-200">
        {/* TAB 1: Video Analysis */}
        {activeTab === 'video_analysis' && (
          <MatchAnalysisView
            data={data}
            activeVideo={activeVideo}
            onSelectPlayer={() => setActiveTab('player_tracking')}
            onLoadDemoClip={onLaunchDemo}
          />
        )}

        {/* TAB 2: Player Tracking */}
        {activeTab === 'player_tracking' && (
          isUserUploadedVideo ? (
            <div className="bg-[#101722] border border-[#253244] rounded-2xl p-8 sm:p-12 text-center shadow-panel">
              <div className="w-14 h-14 rounded-2xl bg-[#17212E] border border-[#253244] flex items-center justify-center text-slate-400 mx-auto mb-4">
                <UserCheck className="w-7 h-7 text-emerald-400" />
              </div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Player Tracking Awaiting Phase 2 Model Execution
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-lg mx-auto leading-relaxed">
                Ultralytics YOLOv8 player detection and ByteTrack multi-object tracking are scheduled for Phase 2 integration. 
                Once processed, individual player tracklets (#TRK-xxx), movement trails, and instantaneous velocity meters will appear here.
              </p>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={onLaunchDemo}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#17212E] hover:bg-[#1E2B3C] text-amber-300 border border-amber-500/30 text-xs font-mono transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Preview in Demo Sandbox</span>
                </button>
              </div>
            </div>
          ) : (
            <PlayerTrackingView data={data} initialSelectedPlayerId={17} />
          )
        )}

        {/* TAB 3: Team Analytics */}
        {activeTab === 'team_analytics' && (
          isUserUploadedVideo ? (
            <div className="bg-[#101722] border border-[#253244] rounded-2xl p-8 sm:p-12 text-center shadow-panel">
              <div className="w-14 h-14 rounded-2xl bg-[#17212E] border border-[#253244] flex items-center justify-center text-slate-400 mx-auto mb-4">
                <BarChart3 className="w-7 h-7 text-sky-400" />
              </div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Team Tactical Analytics Pending Detection
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-lg mx-auto leading-relaxed">
                Team positioning, average formation shapes, defensive line height, and pressing intensity (PPDA) 
                will be calculated once player bounding boxes and jersey color clustering are computed in Phase 2.
              </p>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={onLaunchDemo}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#17212E] hover:bg-[#1E2B3C] text-amber-300 border border-amber-500/30 text-xs font-mono transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Preview in Demo Sandbox</span>
                </button>
              </div>
            </div>
          ) : (
            <TeamAnalyticsView data={data} />
          )
        )}

        {/* TAB 4: Heatmaps */}
        {activeTab === 'heatmaps' && (
          isUserUploadedVideo ? (
            <div className="bg-[#101722] border border-[#253244] rounded-2xl p-8 sm:p-12 text-center shadow-panel">
              <div className="w-14 h-14 rounded-2xl bg-[#17212E] border border-[#253244] flex items-center justify-center text-slate-400 mx-auto mb-4">
                <Flame className="w-7 h-7 text-rose-500" />
              </div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Pitch Spatial Heatmaps Pending Homography
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-lg mx-auto leading-relaxed">
                Continuous 2D Gaussian Kernel Density Estimation (KDE) pitch heatmaps will be generated from real player tracking coordinates 
                following homography perspective calibration in Phase 2.
              </p>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={onLaunchDemo}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#17212E] hover:bg-[#1E2B3C] text-amber-300 border border-amber-500/30 text-xs font-mono transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Preview in Demo Sandbox</span>
                </button>
              </div>
            </div>
          ) : (
            <HeatmapsView data={data} />
          )
        )}

        {/* TAB 5: Match Overview */}
        {activeTab === 'overview' && (
          isUserUploadedVideo ? (
            <div className="bg-[#101722] border border-[#253244] rounded-2xl p-6 shadow-panel space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-[#253244]">
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight">Footage & Pipeline Summary</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Ingested match video details and computer vision readiness.</p>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  Ready for CV Execution
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
                <div className="p-3.5 bg-[#080B10] border border-[#253244] rounded-xl">
                  <span className="text-slate-400 block text-[10px] uppercase">Original File</span>
                  <span className="text-white font-bold truncate block mt-1">{activeVideo.original_filename || activeVideo.filename}</span>
                </div>

                <div className="p-3.5 bg-[#080B10] border border-[#253244] rounded-xl">
                  <span className="text-slate-400 block text-[10px] uppercase">Storage File</span>
                  <span className="text-emerald-400 font-bold truncate block mt-1">{activeVideo.saved_filename || activeVideo.filename}</span>
                </div>

                <div className="p-3.5 bg-[#080B10] border border-[#253244] rounded-xl">
                  <span className="text-slate-400 block text-[10px] uppercase">File Size</span>
                  <span className="text-white font-bold block mt-1">{activeVideo.file_size_formatted || 'Unknown'}</span>
                </div>

                <div className="p-3.5 bg-[#080B10] border border-[#253244] rounded-xl">
                  <span className="text-slate-400 block text-[10px] uppercase">Pipeline Queue</span>
                  <span className="text-amber-400 font-bold block mt-1">Phase 2 Scheduled</span>
                </div>
              </div>

              <div className="p-4 bg-[#080B10] border border-[#253244] rounded-xl text-xs space-y-2">
                <h4 className="font-semibold text-white">Next Operational Steps:</h4>
                <ul className="list-disc pl-5 space-y-1 text-slate-400 text-[11px]">
                  <li>Execute YOLOv8 detection pass to identify players, goalkeeper, referee, and match ball.</li>
                  <li>Run ByteTrack multi-object tracker to generate persistent player trajectories across video frames.</li>
                  <li>Perform OpenCV 4-point homography calibration to map pixel coordinates to metric pitch meters (105m × 68m).</li>
                  <li>Compute authentic kinematics (speeds in km/h, distance in km, sprint events, and spatial heatmaps).</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <PossessionChart
                possessionTrend={data?.possession_trend || []}
                teamA={data?.team_a}
                teamB={data?.team_b}
              />
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default AnalysisWorkspace;
