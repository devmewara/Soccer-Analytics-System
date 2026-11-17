import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Loader2,
  Crosshair,
} from 'lucide-react';
import DemoBadge from '../common/DemoBadge';
import MatchAnalysisView from '../views/MatchAnalysisView';
import PlayerTrackingView from '../views/PlayerTrackingView';
import TeamAnalyticsView from '../views/TeamAnalyticsView';
import HeatmapsView from '../views/HeatmapsView';
import PossessionChart from '../dashboard/PossessionChart';
import { api } from '../../api/client';

export const AnalysisWorkspace = ({
  activeVideo,
  isDemoMode,
  data,
  onBackToHome,
  onLaunchDemo,
}) => {
  // Active horizontal tab
  const [activeTab, setActiveTab] = useState('video_analysis');

  // Video analysis job state
  const [jobStatus, setJobStatus] = useState(null); // 'ready_for_analysis' | 'queued' | 'processing' | 'completed' | 'failed'
  const [jobProgress, setJobProgress] = useState(0);
  const [jobDetails, setJobDetails] = useState(null);
  const [realAnalytics, setRealAnalytics] = useState(null);
  const [isTriggering, setIsTriggering] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [selectedPlayerTrackId, setSelectedPlayerTrackId] = useState(null);

  const pollIntervalRef = useRef(null);

  const tabs = [
    { id: 'video_analysis', label: 'Video Analysis', icon: Film },
    { id: 'player_tracking', label: 'Player Tracking', icon: UserCheck },
    { id: 'team_analytics', label: 'Team Analytics', icon: BarChart3 },
    { id: 'heatmaps', label: 'Heatmaps', icon: Flame },
    { id: 'overview', label: 'Match Overview', icon: LayoutDashboard },
  ];

  const isUserUploadedVideo = Boolean(activeVideo?.stream_url || activeVideo?.saved_filename);
  const videoId =
    activeVideo?.video_id ||
    (activeVideo?.saved_filename ? activeVideo.saved_filename.replace(/\.[^/.]+$/, '') : null) ||
    (activeVideo?.filename ? activeVideo.filename.replace(/\.[^/.]+$/, '') : null);

  // Stop polling helper
  const stopPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  };

  // Fetch real analytics for completed video
  const fetchRealAnalytics = useCallback(async (vId) => {
    try {
      const analytics = await api.getRealVideoAnalytics(vId);
      setRealAnalytics(analytics);
    } catch (err) {
      console.warn('Could not load real analytics:', err.message);
    }
  }, []);

  // Poll video processing status
  const checkStatus = useCallback(async () => {
    if (!videoId || isDemoMode) return;

    try {
      const statusRes = await api.getVideoStatus(videoId);
      setJobStatus(statusRes.status);
      setJobProgress(statusRes.progress || 0);
      setJobDetails(statusRes);

      if (statusRes.status === 'completed') {
        stopPolling();
        fetchRealAnalytics(videoId);
      } else if (statusRes.status === 'failed') {
        stopPolling();
        setErrorMessage(statusRes.error_message || 'Computer vision pipeline failed.');
      }
    } catch (err) {
      // If 404, file is not yet recognized or ready
      if (err.response?.status === 404) {
        setJobStatus('ready_for_analysis');
      }
    }
  }, [videoId, isDemoMode, fetchRealAnalytics]);

  // Initialize status on video load
  useEffect(() => {
    stopPolling();
    setRealAnalytics(null);
    setErrorMessage(null);
    setJobStatus(null);
    setJobProgress(0);

    if (videoId && !isDemoMode) {
      checkStatus();
    }

    return () => stopPolling();
  }, [videoId, isDemoMode, checkStatus]);

  // Polling loop when status is 'queued' or 'processing'
  useEffect(() => {
    if (jobStatus === 'queued' || jobStatus === 'processing') {
      if (!pollIntervalRef.current) {
        pollIntervalRef.current = setInterval(checkStatus, 1200);
      }
    } else {
      stopPolling();
    }
    return () => stopPolling();
  }, [jobStatus, checkStatus]);

  // Handler to trigger CV analysis
  const handleStartAnalysis = async () => {
    if (!videoId || isTriggering) return;
    setIsTriggering(true);
    setErrorMessage(null);

    try {
      const res = await api.startVideoAnalysis(videoId);
      setJobStatus(res.status || 'processing');
      setJobProgress(res.progress || 0);
      setJobDetails(res);
      // Start polling
      if (!pollIntervalRef.current) {
        pollIntervalRef.current = setInterval(checkStatus, 1200);
      }
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Failed to start video analysis.';
      setErrorMessage(msg);
      setJobStatus('failed');
    } finally {
      setIsTriggering(false);
    }
  };

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
                ) : jobStatus === 'completed' ? (
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>AI ANALYZED</span>
                  </span>
                ) : (
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">
                    RAW FOOTAGE
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

      {/* AI Pipeline Execution Control Card (For User-Uploaded Videos) */}
      {isUserUploadedVideo && (
        <div className="bg-[#101722] border border-[#253244] rounded-2xl p-4 sm:p-5 shadow-panel">
          {/* State A: Ready to analyze */}
          {(jobStatus === 'ready_for_analysis' || (!jobStatus && !realAnalytics)) && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white tracking-tight">
                      Computer Vision Inference Engine Ready
                    </h3>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      Ultralytics YOLO11n + ByteTrack
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                    Trigger object detection to detect players (COCO 0) and the football (COCO 32), assign persistent tracking IDs across consecutive video frames, and compile authentic match telemetry.
                  </p>
                </div>
              </div>

              <button
                onClick={handleStartAnalysis}
                disabled={isTriggering}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs shadow-sm transition-all active:scale-95 shrink-0 self-end sm:self-center disabled:opacity-50"
              >
                {isTriggering ? (
                  <Loader2 className="w-4 h-4 animate-spin fill-black" />
                ) : (
                  <Play className="w-4 h-4 fill-black" />
                )}
                <span>{isTriggering ? 'Initializing...' : 'Start AI Video Analysis'}</span>
              </button>
            </div>
          )}

          {/* State B: Processing in Progress */}
          {(jobStatus === 'queued' || jobStatus === 'processing') && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
                  <span className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                    {jobStatus === 'queued' ? 'Queued for Inference' : 'Analyzing Match Footage...'}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    (Ultralytics YOLO11n & ByteTrack)
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs font-mono">
                  {jobDetails?.processed_frames !== undefined && jobDetails?.total_frames > 0 && (
                    <span className="text-slate-400">
                      Frame {jobDetails.processed_frames} / {jobDetails.total_frames}
                    </span>
                  )}
                  {jobDetails?.current_fps && (
                    <span className="text-slate-400 bg-[#080B10] px-2 py-0.5 rounded border border-[#253244]">
                      {jobDetails.current_fps} FPS
                    </span>
                  )}
                  <span className="text-emerald-400 font-bold">{jobProgress}%</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-[#080B10] h-2.5 rounded-full overflow-hidden border border-[#253244]">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${jobProgress}%` }}
                ></div>
              </div>

              <p className="text-[11px] font-mono text-slate-400">
                {jobDetails?.message || 'Processing sequential video frames...'}
              </p>
            </div>
          )}

          {/* State C: Completed */}
          {jobStatus === 'completed' && realAnalytics && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white tracking-tight">
                      Computer Vision Analysis Complete
                    </h3>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      {realAnalytics.summary_metrics.unique_players_count} Unique Players Tracked
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 font-mono">
                    {realAnalytics.summary_metrics.total_frames_analyzed} frames analyzed in{' '}
                    {realAnalytics.summary_metrics.processing_time_seconds}s (
                    {realAnalytics.summary_metrics.avg_inference_fps} FPS).
                  </p>
                </div>
              </div>

              <button
                onClick={handleStartAnalysis}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#17212E] hover:bg-[#1E2B3C] text-slate-300 hover:text-white border border-[#253244] text-xs font-mono transition-colors shrink-0 self-end sm:self-center"
                title="Re-run inference"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Re-run Analysis</span>
              </button>
            </div>
          )}

          {/* State D: Failed */}
          {jobStatus === 'failed' && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-rose-300">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                <div>
                  <h3 className="text-sm font-bold text-rose-200">Analysis Failed</h3>
                  <p className="text-xs text-rose-300 mt-0.5">
                    {errorMessage || 'An error occurred during inference.'}
                  </p>
                </div>
              </div>

              <button
                onClick={handleStartAnalysis}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/40 text-xs font-mono transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retry Analysis</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Main Tab Content */}
      <div className="transition-opacity duration-200">
        {/* TAB 1: Video Analysis */}
        {activeTab === 'video_analysis' && (
          <MatchAnalysisView
            data={data}
            activeVideo={activeVideo}
            realAnalytics={realAnalytics}
            analysisStatus={jobStatus}
            onStartAnalysis={handleStartAnalysis}
            isStartingAnalysis={isTriggering}
            onSelectPlayer={(trackId) => {
              setSelectedPlayerTrackId(trackId);
              setActiveTab('player_tracking');
            }}
            onLoadDemoClip={onLaunchDemo}
          />
        )}

        {/* TAB 2: Player Tracking */}
        {activeTab === 'player_tracking' && (
          isUserUploadedVideo && !realAnalytics ? (
            <div className="bg-[#101722] border border-[#253244] rounded-2xl p-8 sm:p-12 text-center shadow-panel">
              <div className="w-14 h-14 rounded-2xl bg-[#17212E] border border-[#253244] flex items-center justify-center text-slate-400 mx-auto mb-4">
                <UserCheck className="w-7 h-7 text-emerald-400" />
              </div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Player Tracking Requires Video Analysis
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-lg mx-auto leading-relaxed">
                Click <strong>"Start AI Video Analysis"</strong> in the control banner above to run YOLO11 detection and ByteTrack tracking on this video. 
                Once complete, each identified player's persistent track ID, frame duration, and bounding coordinates will appear here.
              </p>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={handleStartAnalysis}
                  disabled={isTriggering}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs shadow-sm transition-all"
                >
                  <Play className="w-3.5 h-3.5 fill-black" />
                  <span>Start AI Video Analysis</span>
                </button>
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
            <PlayerTrackingView
              data={data}
              realAnalytics={realAnalytics}
              isUserUploaded={isUserUploadedVideo}
              initialSelectedPlayerId={selectedPlayerTrackId}
            />
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
                Team Tactical Analytics Pending Clustering
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-lg mx-auto leading-relaxed">
                Team formation shapes, average compact defensive blocks, and possession shares 
                require automated jersey color clustering to distinguish Team A from Team B. 
                Basic player detection and tracking are active in the Video Analysis and Player Tracking tabs.
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
                Continuous 2D Gaussian Kernel Density Estimation (KDE) pitch heatmaps require 4-point homography calibration 
                to project player video coordinates onto standard FIFA pitch dimensions (105m × 68m).
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
                  <h3 className="text-sm font-bold text-white tracking-tight">
                    {realAnalytics ? 'Authentic Match Video Report' : 'Footage & Pipeline Summary'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {realAnalytics
                      ? 'Verified statistics computed by YOLO11n detection and ByteTrack tracking.'
                      : 'Ingested match video details and computer vision pipeline status.'}
                  </p>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  {realAnalytics ? 'Analysis Complete' : 'Ready for CV Execution'}
                </span>
              </div>

              {/* Real Analytics Summary Cards */}
              {realAnalytics ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
                  <div className="p-3.5 bg-[#080B10] border border-[#253244] rounded-xl">
                    <span className="text-slate-400 block text-[10px] uppercase">Unique Players Tracked</span>
                    <span className="text-emerald-400 font-bold text-xl block mt-1">
                      {realAnalytics.summary_metrics.unique_players_count} players
                    </span>
                  </div>

                  <div className="p-3.5 bg-[#080B10] border border-[#253244] rounded-xl">
                    <span className="text-slate-400 block text-[10px] uppercase">Frames Analyzed</span>
                    <span className="text-white font-bold text-xl block mt-1">
                      {realAnalytics.summary_metrics.total_frames_analyzed} frames
                    </span>
                  </div>

                  <div className="p-3.5 bg-[#080B10] border border-[#253244] rounded-xl">
                    <span className="text-slate-400 block text-[10px] uppercase">Ball Sightings</span>
                    <span className="text-amber-400 font-bold text-xl block mt-1">
                      {realAnalytics.summary_metrics.total_ball_detections} ({realAnalytics.summary_metrics.ball_detection_rate_pct}%)
                    </span>
                  </div>

                  <div className="p-3.5 bg-[#080B10] border border-[#253244] rounded-xl">
                    <span className="text-slate-400 block text-[10px] uppercase">Inference Speed</span>
                    <span className="text-sky-400 font-bold text-xl block mt-1">
                      {realAnalytics.summary_metrics.avg_inference_fps} FPS
                    </span>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
                  <div className="p-3.5 bg-[#080B10] border border-[#253244] rounded-xl">
                    <span className="text-slate-400 block text-[10px] uppercase">Original File</span>
                    <span className="text-white font-bold truncate block mt-1">
                      {activeVideo.original_filename || activeVideo.filename}
                    </span>
                  </div>

                  <div className="p-3.5 bg-[#080B10] border border-[#253244] rounded-xl">
                    <span className="text-slate-400 block text-[10px] uppercase">Storage File</span>
                    <span className="text-emerald-400 font-bold truncate block mt-1">
                      {activeVideo.saved_filename || activeVideo.filename}
                    </span>
                  </div>

                  <div className="p-3.5 bg-[#080B10] border border-[#253244] rounded-xl">
                    <span className="text-slate-400 block text-[10px] uppercase">File Size</span>
                    <span className="text-white font-bold block mt-1">
                      {activeVideo.file_size_formatted || 'Unknown'}
                    </span>
                  </div>

                  <div className="p-3.5 bg-[#080B10] border border-[#253244] rounded-xl">
                    <span className="text-slate-400 block text-[10px] uppercase">CV Engine</span>
                    <span className="text-emerald-400 font-bold block mt-1">YOLO11n + ByteTrack</span>
                  </div>
                </div>
              )}

              <div className="p-4 bg-[#080B10] border border-[#253244] rounded-xl text-xs space-y-2">
                <h4 className="font-semibold text-white">Pipeline Execution Summary:</h4>
                <ul className="list-disc pl-5 space-y-1 text-slate-400 text-[11px]">
                  <li>
                    <strong>Ultralytics YOLO11n</strong> detects persons (Class 0) and match football (Class 32).
                  </li>
                  <li>
                    <strong>ByteTrack</strong> maintains persistent tracklet IDs across consecutive frames using Kalman filter state predictions.
                  </li>
                  <li>
                    <strong>OpenCV</strong> renders tactical bounding boxes, track labels, and high-tech telemetry HUD overlay onto the output video.
                  </li>
                  <li>
                    Metrics are saved to authentic JSON records on disk, avoiding fabricated speed and distance numbers.
                  </li>
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
