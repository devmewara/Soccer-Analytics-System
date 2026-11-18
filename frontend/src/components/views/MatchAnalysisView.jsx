import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Sliders,
  Eye,
  Layers,
  Clock,
  Sparkles,
  Info,
  Film,
  Cpu,
  UserCheck,
  Activity,
  CheckCircle2,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  ShieldCheck,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import DemoBanner from '../common/DemoBanner';
import DemoBadge from '../common/DemoBadge';
import PitchCanvas from '../common/PitchCanvas';
import { api, SERVER_BASE_URL } from '../../api/client';

export const MatchAnalysisView = ({
  data,
  activeVideo,
  realAnalytics,
  analysisStatus,
  onStartAnalysis,
  isStartingAnalysis,
  onSelectPlayer,
  onLoadDemoClip,
}) => {
  // Layout mode: 'split' | 'video' | 'pitch'
  const [viewMode, setViewMode] = useState('split');
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(90);
  const [selectedZone, setSelectedZone] = useState('z_att_third');
  const [selectedEventId, setSelectedEventId] = useState('evt_1');
  const [selectedPlayerId, setSelectedPlayerId] = useState(17);

  // Toggle between Annotated AI Video and Raw Video
  const [showAnnotated, setShowAnnotated] = useState(true);

  // Overlay visibility toggles for DEMO mode
  const [showBoundingBoxes, setShowBoundingBoxes] = useState(true);
  const [showPitchCalibration, setShowPitchCalibration] = useState(true);
  const [showBallTrail, setShowBallTrail] = useState(true);
  const [showZoneOverlay, setShowZoneOverlay] = useState(false);

  const videoRef = useRef(null);
  const playerContainerRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Helper to query active fullscreen element across browser implementations
  const getFullscreenElement = () => {
    if (typeof document === 'undefined') return null;
    return (
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement ||
      null
    );
  };

  // Cross-browser request fullscreen helper
  const enterFullscreen = async (element) => {
    if (!element) return;
    if (element.requestFullscreen) {
      await element.requestFullscreen();
    } else if (element.webkitRequestFullscreen) {
      await element.webkitRequestFullscreen();
    } else if (element.mozRequestFullScreen) {
      await element.mozRequestFullScreen();
    } else if (element.msRequestFullscreen) {
      await element.msRequestFullscreen();
    }
  };

  // Cross-browser exit fullscreen helper
  const exitFullscreen = async () => {
    if (typeof document === 'undefined') return;
    if (document.exitFullscreen) {
      await document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      await document.webkitExitFullscreen();
    } else if (document.mozCancelFullScreen) {
      await document.mozCancelFullScreen();
    } else if (document.msExitFullscreen) {
      await document.msExitFullscreen();
    }
  };

  // Handler for toggling fullscreen mode
  const handleToggleFullscreen = async () => {
    try {
      if (isFullscreen) {
        if (getFullscreenElement()) {
          await exitFullscreen();
        } else {
          setIsFullscreen(false);
        }
      } else if (playerContainerRef.current) {
        const el = playerContainerRef.current;
        if (
          el.requestFullscreen ||
          el.webkitRequestFullscreen ||
          el.mozRequestFullScreen ||
          el.msRequestFullscreen
        ) {
          try {
            await enterFullscreen(el);
          } catch (err) {
            console.warn('Native fullscreen request rejected, using viewport fallback:', err);
            setIsFullscreen(true);
          }
        } else {
          setIsFullscreen(true);
        }
      }
    } catch (err) {
      console.warn('Fullscreen toggle error:', err);
    }
  };

  // Synchronize fullscreen state with browser events and listen for Escape key
  useEffect(() => {
    const handleFullscreenChange = () => {
      const currentFullscreenElem = getFullscreenElement();
      const isNowFullscreen = Boolean(
        currentFullscreenElem &&
          playerContainerRef.current &&
          (currentFullscreenElem === playerContainerRef.current ||
            playerContainerRef.current.contains(currentFullscreenElem))
      );
      setIsFullscreen(isNowFullscreen);
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isFullscreen && !getFullscreenElement()) {
        setIsFullscreen(false);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullscreen]);

  const isUserUploadedVideo = Boolean(activeVideo?.stream_url || activeVideo?.saved_filename);
  const hasRealAnalytics = Boolean(realAnalytics && realAnalytics.summary_metrics);

  // Determine active video URL
  let videoStreamUrl = null;
  if (isUserUploadedVideo) {
    if (showAnnotated && realAnalytics?.video_metadata?.stream_url) {
      videoStreamUrl = api.getVideoStreamUrl(realAnalytics.video_metadata.stream_url);
    } else if (activeVideo.annotated_stream_url && showAnnotated) {
      videoStreamUrl = api.getVideoStreamUrl(activeVideo.annotated_stream_url);
    } else if (activeVideo.stream_url) {
      videoStreamUrl = api.getVideoStreamUrl(activeVideo.stream_url);
    }
  }

  // Playback timer for demo mode when no actual video file is streaming
  useEffect(() => {
    let interval = null;
    if (isPlaying && !videoStreamUrl) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= duration) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 0.1 * playbackSpeed;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, duration, videoStreamUrl]);

  // Reset current time when stream URL changes
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      setCurrentTime(0);
      setIsPlaying(false);
    }
  }, [videoStreamUrl]);

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(() => {});
      }
    }
    setIsPlaying(!isPlaying);
  };

  const handleStepFrame = (deltaSeconds) => {
    const nextTime = Math.max(0, Math.min(duration, currentTime + deltaSeconds));
    setCurrentTime(nextTime);
    if (videoRef.current) {
      videoRef.current.currentTime = nextTime;
    }
  };

  const handleSeek = (e) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
  };

  const formatTimecode = (seconds) => {
    if (isNaN(seconds) || seconds < 0) return '00:00.0';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms}`;
  };

  const players = data?.players || [];
  const events = data?.match_events || [];
  const zones = data?.pitch_zones || [];
  const activeZoneObj = zones.find((z) => z.id === selectedZone) || zones[0];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {!isUserUploadedVideo && <DemoBanner />}

      {/* Studio Header & Layout Modes */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-[#253244]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">Match Analysis Studio</h2>
            {isUserUploadedVideo ? (
              hasRealAnalytics ? (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>YOLO + BYTETRACK ANALYZED</span>
                </span>
              ) : (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  RAW FOOTAGE • READY FOR CV
                </span>
              )
            ) : (
              <DemoBadge label="DEMO SHOWCASE" />
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {isUserUploadedVideo
              ? hasRealAnalytics
                ? `Processed with Ultralytics YOLO11n & ByteTrack: ${realAnalytics.summary_metrics.unique_players_count} players tracked across ${realAnalytics.summary_metrics.total_frames_analyzed} frames.`
                : `Uploaded match video: ${activeVideo.original_filename || activeVideo.filename}`
              : 'Synchronized tactical video player, simulated detection overlays, and 2D calibrated pitch.'}
          </p>
        </div>

        {/* View Layout Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-[#101722] border border-[#253244] rounded-xl self-end sm:self-center">
          <button
            onClick={() => setViewMode('split')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors ${
              viewMode === 'split'
                ? 'bg-[#17212E] text-white border border-[#253244]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Split View
          </button>
          <button
            onClick={() => setViewMode('video')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors ${
              viewMode === 'video'
                ? 'bg-[#17212E] text-white border border-[#253244]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Video Focus
          </button>
          <button
            onClick={() => setViewMode('pitch')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors ${
              viewMode === 'pitch'
                ? 'bg-[#17212E] text-white border border-[#253244]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Tactical Pitch
          </button>
        </div>
      </div>

      {/* Real Computer Vision Summary Cards (Visible when real analytics is present) */}
      {hasRealAnalytics && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3.5 bg-[#101722] border border-[#253244] rounded-xl">
            <span className="text-[10px] font-mono text-slate-400 uppercase block">Confirmed Players</span>
            <p className="text-xl font-bold text-emerald-400 font-mono mt-1">
              {realAnalytics.summary_metrics.confirmed_players_count || realAnalytics.summary_metrics.unique_players_count}
              <span className="text-[10px] text-slate-500 font-normal ml-1">
                ({realAnalytics.summary_metrics.total_unique_track_ids || realAnalytics.summary_metrics.unique_players_count} IDs)
              </span>
            </p>
          </div>

          <div className="p-3.5 bg-[#101722] border border-[#253244] rounded-xl">
            <span className="text-[10px] font-mono text-slate-400 uppercase block">Team Breakdown</span>
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              <span className="text-xs font-mono font-bold text-sky-400">
                T-A: {realAnalytics.summary_metrics.team_a_count || 0}
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-xs font-mono font-bold text-rose-400">
                T-B: {realAnalytics.summary_metrics.team_b_count || 0}
              </span>
              {realAnalytics.summary_metrics.officials_count > 0 && (
                <>
                  <span className="text-slate-600">•</span>
                  <span className="text-xs font-mono font-bold text-amber-400">
                    Ref: {realAnalytics.summary_metrics.officials_count}
                  </span>
                </>
              )}
              {realAnalytics.summary_metrics.unknown_count > 0 && (
                <>
                  <span className="text-slate-600">•</span>
                  <span className="text-xs font-mono font-bold text-slate-400">
                    Unk: {realAnalytics.summary_metrics.unknown_count}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="p-3.5 bg-[#101722] border border-[#253244] rounded-xl">
            <span className="text-[10px] font-mono text-slate-400 uppercase block">Ball Sightings</span>
            <p className="text-xl font-bold text-amber-400 font-mono mt-1">
              {realAnalytics.summary_metrics.total_ball_detections}
              <span className="text-xs text-slate-500 font-normal ml-1">
                ({realAnalytics.summary_metrics.ball_detection_rate_pct}%)
              </span>
            </p>
          </div>

          <div className="p-3.5 bg-[#101722] border border-[#253244] rounded-xl">
            <span className="text-[10px] font-mono text-slate-400 uppercase block">Player Detections</span>
            <p className="text-xl font-bold text-white font-mono mt-1">
              {realAnalytics.summary_metrics.total_player_detections || 0}
              <span className="text-[10px] text-slate-500 font-normal ml-1">
                ({realAnalytics.summary_metrics.avg_players_per_frame}/f)
              </span>
            </p>
          </div>

          <div className="p-3.5 bg-[#101722] border border-[#253244] rounded-xl">
            <span className="text-[10px] font-mono text-slate-400 uppercase block">Inference Speed</span>
            <p className="text-xl font-bold text-emerald-400 font-mono mt-1">
              {realAnalytics.summary_metrics.avg_inference_fps}
              <span className="text-xs text-slate-500 font-normal ml-1">FPS</span>
            </p>
          </div>

          <div className="p-3.5 bg-[#101722] border border-[#253244] rounded-xl">
            <span className="text-[10px] font-mono text-slate-400 uppercase block">Frames / Duration</span>
            <p className="text-xl font-bold text-white font-mono mt-1">
              {realAnalytics.summary_metrics.total_frames_analyzed}
              <span className="text-xs text-slate-500 font-normal ml-1">
                ({realAnalytics.video_metadata?.duration_seconds ?? '0.0'}s)
              </span>
            </p>
          </div>
        </div>
      )}

      {/* Main Workspace (Split / Focus Views) */}
      <div
        className={`grid gap-6 ${
          viewMode === 'split'
            ? 'grid-cols-1 lg:grid-cols-2'
            : 'grid-cols-1'
        }`}
      >
        {/* Panel 1: Video Player */}
        {(viewMode === 'split' || viewMode === 'video') && (
          <div
            ref={playerContainerRef}
            className={`${
              isFullscreen
                ? 'fixed inset-0 z-50 w-screen h-screen bg-black p-4 sm:p-6 flex flex-col justify-between select-none'
                : 'bg-[#101722] border border-[#253244] rounded-2xl p-4 sm:p-5 shadow-panel flex flex-col justify-between'
            } transition-colors`}
          >
            {/* Video Player Header with Status */}
            <div className="flex items-center justify-between pb-3 border-b border-[#253244] mb-3 shrink-0">
              <div className="flex items-center gap-2">
                <Film className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  {isUserUploadedVideo
                    ? showAnnotated && hasRealAnalytics
                      ? 'YOLO & ByteTrack Annotated Stream'
                      : 'Raw Match Recording'
                    : 'Tactical Cam Preview (Demo)'}
                </span>
                {isFullscreen && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hidden sm:inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    FULLSCREEN
                  </span>
                )}
              </div>

              {/* Overlays / Stream View Switcher & Fullscreen Button */}
              <div className="flex items-center gap-2">
                {isUserUploadedVideo && hasRealAnalytics ? (
                  <div className="flex items-center gap-1 bg-[#080B10] p-1 rounded-lg border border-[#253244] text-[10px] font-mono">
                    <button
                      onClick={() => setShowAnnotated(true)}
                      className={`px-2 py-0.5 rounded transition-colors ${
                        showAnnotated
                          ? 'bg-emerald-500 text-black font-bold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Annotated AI
                    </button>
                    <button
                      onClick={() => setShowAnnotated(false)}
                      className={`px-2 py-0.5 rounded transition-colors ${
                        !showAnnotated
                          ? 'bg-[#17212E] text-white font-bold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Raw
                    </button>
                  </div>
                ) : !isUserUploadedVideo ? (
                  <>
                    <button
                      onClick={() => setShowBoundingBoxes(!showBoundingBoxes)}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                        showBoundingBoxes
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : 'bg-[#17212E] text-slate-500 border border-[#253244]'
                      }`}
                      title="Toggle simulated YOLO bounding boxes"
                    >
                      Boxes: {showBoundingBoxes ? 'ON' : 'OFF'}
                    </button>

                    <button
                      onClick={() => setShowPitchCalibration(!showPitchCalibration)}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                        showPitchCalibration
                          ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                          : 'bg-[#17212E] text-slate-500 border border-[#253244]'
                      }`}
                      title="Toggle simulated pitch perspective lines"
                    >
                      Grid: {showPitchCalibration ? 'ON' : 'OFF'}
                    </button>
                  </>
                ) : (
                  <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    Analysis Pending
                  </span>
                )}

                {/* Fullscreen Icon Button */}
                <button
                  onClick={handleToggleFullscreen}
                  className="p-1.5 rounded-lg bg-[#080B10] hover:bg-[#17212E] text-slate-300 hover:text-white border border-[#253244] text-xs font-mono transition-colors flex items-center gap-1 active:scale-95"
                  title={isFullscreen ? 'Exit Fullscreen (Esc)' : 'Enter Fullscreen'}
                  aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                >
                  {isFullscreen ? (
                    <>
                      <Minimize2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-[10px] font-mono text-slate-300 hidden sm:inline">Exit</span>
                    </>
                  ) : (
                    <>
                      <Maximize2 className="w-3.5 h-3.5 text-slate-300 hover:text-emerald-400" />
                      <span className="text-[10px] font-mono text-slate-300 hidden sm:inline">Fullscreen</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Video Player Display Container */}
            <div
              className={`relative w-full ${
                isFullscreen
                  ? 'flex-1 min-h-0 my-3 rounded-xl'
                  : 'aspect-video rounded-xl'
              } overflow-hidden bg-black border border-[#253244] flex items-center justify-center select-none`}
            >
              {videoStreamUrl ? (
                /* Real HTML5 Video Player playing user uploaded video or annotated video */
                <video
                  key={videoStreamUrl}
                  ref={videoRef}
                  src={videoStreamUrl}
                  className="w-full h-full object-contain"
                  onTimeUpdate={() => {
                    if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
                  }}
                  onLoadedMetadata={() => {
                    if (videoRef.current && videoRef.current.duration) {
                      setDuration(videoRef.current.duration);
                    }
                  }}
                  onEnded={() => setIsPlaying(false)}
                  controls={false}
                />
              ) : (
                /* Simulated Tactical Broadcast Screen with football pitch canvas (Demo) */
                <div className="relative w-full h-full bg-[#07150E] flex items-center justify-center overflow-hidden">
                  {showPitchCalibration && (
                    <div className="absolute inset-0 pointer-events-none opacity-30">
                      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <line x1="8" y1="92" x2="36" y2="18" stroke="#10B981" strokeWidth="0.4" strokeDasharray="1,1" />
                        <line x1="92" y1="92" x2="64" y2="18" stroke="#10B981" strokeWidth="0.4" strokeDasharray="1,1" />
                        <line x1="18" y1="50" x2="82" y2="50" stroke="#10B981" strokeWidth="0.4" strokeDasharray="1,1" />
                      </svg>
                    </div>
                  )}

                  {showBoundingBoxes && (
                    <>
                      <div className="absolute left-[54%] top-[38%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none">
                        <span className="text-[8px] font-mono bg-sky-500 text-black px-1 font-semibold rounded-t">
                          #17 KDB (Demo)
                        </span>
                        <div className="w-10 h-20 border-2 border-sky-400 bg-sky-500/10 rounded-sm"></div>
                      </div>

                      <div className="absolute left-[72%] top-[45%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none">
                        <span className="text-[8px] font-mono bg-sky-500 text-black px-1 font-semibold rounded-t">
                          #9 Haaland (Demo)
                        </span>
                        <div className="w-12 h-24 border-2 border-sky-400 bg-sky-500/10 rounded-sm"></div>
                      </div>

                      <div className="absolute left-[42%] top-[30%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none">
                        <span className="text-[8px] font-mono bg-rose-500 text-white px-1 font-semibold rounded-t">
                          #7 Saka (Demo)
                        </span>
                        <div className="w-10 h-20 border-2 border-rose-500 bg-rose-500/10 rounded-sm"></div>
                      </div>

                      {showBallTrail && (
                        <div className="absolute left-[58%] top-[50%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none">
                          <span className="text-[7px] font-mono bg-amber-400 text-black px-1 font-semibold rounded-t">
                            Ball (Demo)
                          </span>
                          <div className="w-4 h-4 rounded-full border-2 border-amber-300"></div>
                        </div>
                      )}
                    </>
                  )}

                  <div className="absolute top-3 left-3 bg-[#080B10]/90 px-2.5 py-1 rounded text-[10px] font-mono text-slate-300 border border-[#253244]">
                    <span>Tactical Demonstration Preview</span>
                  </div>

                  <div className="absolute bottom-3 right-3 bg-[#080B10]/90 px-2.5 py-1 rounded text-[10px] font-mono text-amber-400 border border-amber-500/30">
                    <span>Simulated Detections</span>
                  </div>
                </div>
              )}
            </div>

            {/* Controls Section (Timeline + Playback Bar) */}
            <div className="shrink-0 w-full">
              {/* Match Timeline Scrub Bar */}
              <div className="mt-3.5 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                  <span className="text-emerald-400 font-medium">{formatTimecode(currentTime)}</span>
                  <span>{formatTimecode(duration)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={duration || 1}
                  step="0.05"
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-1.5 bg-[#080B10] rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>

              {/* Playback Controls & Frame Steppers */}
              <div className="mt-3 flex items-center justify-between gap-2 pt-2.5 border-t border-[#253244]">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleStepFrame(-1.0)}
                    className="p-1.5 rounded-lg bg-[#17212E] hover:bg-slate-800 text-slate-300 text-xs font-mono transition-colors"
                    title="Step 1s Backward"
                  >
                    <SkipBack className="w-4 h-4" />
                  </button>

                  <button
                    onClick={handlePlayPause}
                    className="p-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold shadow-sm transition-all active:scale-95"
                    title={isPlaying ? 'Pause' : 'Play'}
                  >
                    {isPlaying ? <Pause className="w-4 h-4 fill-black" /> : <Play className="w-4 h-4 fill-black" />}
                  </button>

                  <button
                    onClick={() => handleStepFrame(1.0)}
                    className="p-1.5 rounded-lg bg-[#17212E] hover:bg-slate-800 text-slate-300 text-xs font-mono transition-colors"
                    title="Step 1s Forward"
                  >
                    <SkipForward className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {/* Playback Speed Multiplier */}
                  <div className="flex items-center gap-1 bg-[#080B10] p-1 rounded-lg border border-[#253244] text-xs font-mono">
                    {[0.5, 1.0, 2.0].map((rate) => (
                      <button
                        key={rate}
                        onClick={() => {
                          setPlaybackSpeed(rate);
                          if (videoRef.current) videoRef.current.playbackRate = rate;
                        }}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                          playbackSpeed === rate
                            ? 'bg-emerald-500 text-black'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {rate}x
                      </button>
                    ))}
                  </div>

                  {/* Additional Exit Fullscreen button in bottom bar when in fullscreen mode */}
                  {isFullscreen && (
                    <button
                      onClick={handleToggleFullscreen}
                      className="px-2.5 py-1 rounded-lg bg-[#17212E] hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-mono border border-[#253244] transition-colors flex items-center gap-1"
                      title="Exit Fullscreen (Esc)"
                    >
                      <Minimize2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-[10px] hidden sm:inline">Exit Fullscreen</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Panel 2: Interactive 2D Pitch / Telemetry Overview */}
        {(viewMode === 'split' || viewMode === 'pitch') && (
          <div className="bg-[#101722] border border-[#253244] rounded-2xl p-4 sm:p-5 shadow-panel flex flex-col justify-between">
            <div>
              {/* Pitch Canvas Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#253244] mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                    2D Pitch Map (FIFA 105m × 68m)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {isUserUploadedVideo ? (
                    <span className="text-[10px] font-mono text-slate-400 bg-[#080B10] px-2 py-0.5 rounded border border-[#253244]">
                      Homography: Pending Calibration
                    </span>
                  ) : (
                    <button
                      onClick={() => setShowZoneOverlay(!showZoneOverlay)}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                        showZoneOverlay
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : 'bg-[#17212E] text-slate-400 border border-[#253244]'
                      }`}
                    >
                      Tactical Thirds: {showZoneOverlay ? 'ON' : 'OFF'}
                    </button>
                  )}
                </div>
              </div>

              {/* 2D Pitch Canvas */}
              <PitchCanvas
                showZones={showZoneOverlay}
                activeZone={selectedZone}
                onZoneClick={(zoneId) => setSelectedZone(zoneId)}
                heightClass={viewMode === 'pitch' ? 'h-[460px]' : 'h-72 sm:h-80 md:h-[340px]'}
              >
                {!isUserUploadedVideo ? (
                  /* 22 Player Nodes on Calibrated Pitch (Modeled Sample Data) */
                  players.map((p) => {
                    const isSelected = p.id === selectedPlayerId;
                    const isTeamA = p.team_id === 'man_blue';

                    return (
                      <div
                        key={p.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPlayerId(p.id);
                          if (onSelectPlayer) onSelectPlayer(p.id);
                        }}
                        className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer pointer-events-auto transition-transform hover:scale-125 group z-20"
                        style={{ left: `${p.pitch_x}%`, top: `${p.pitch_y}%` }}
                      >
                        <div
                          className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center font-mono font-bold text-[9px] sm:text-[10px] text-black shadow transition-all ${
                            isTeamA
                              ? 'bg-sky-400 border border-white'
                              : 'bg-rose-500 text-white border border-white'
                          } ${isSelected ? 'ring-2 ring-emerald-400 scale-125' : ''}`}
                        >
                          {p.jersey_number}
                        </div>

                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-[#080B10] text-white text-[9px] font-mono px-2 py-0.5 rounded border border-[#253244] whitespace-nowrap z-30">
                          {p.short_name} (Sample)
                        </div>
                      </div>
                    );
                  })
                ) : (
                  /* User uploaded footage overlay note on pitch */
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-4">
                    <div className="bg-[#080B10]/90 border border-[#253244] rounded-xl p-4 max-w-sm text-center">
                      <p className="text-xs font-semibold text-white">2D Pitch Projection Awaiting Homography</p>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                        Player pixel coordinates from YOLO & ByteTrack will be mapped onto this 2D FIFA coordinate system once 4-point pitch corner homography calibration is computed.
                      </p>
                    </div>
                  </div>
                )}

                {/* Match Ball Marker (Demo mode) */}
                {!isUserUploadedVideo && (
                  <div className="absolute left-[58%] top-[50%] -translate-x-1/2 -translate-y-1/2 pointer-events-none z-30">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400 border border-white shadow-sm shadow-amber-400"></div>
                  </div>
                )}
              </PitchCanvas>

              {/* Selected Zone Analysis Summary or Real Tracking Note */}
              <div className="mt-4 p-3.5 rounded-xl bg-[#080B10] border border-[#253244] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white font-mono uppercase tracking-wide">
                      {isUserUploadedVideo ? 'Computer Vision Telemetry' : activeZoneObj.label}
                    </span>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {isUserUploadedVideo ? 'ACTIVE ENGINE' : 'SAMPLE DATA'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                    {isUserUploadedVideo
                      ? 'YOLO11n object detection detects players (COCO 0) and the football (COCO 32). ByteTrack assigns persistent tracking IDs across consecutive frames.'
                      : activeZoneObj.desc}
                  </p>
                </div>

                {!isUserUploadedVideo && (
                  <div className="flex items-center gap-4 text-xs font-mono shrink-0">
                    <div>
                      <span className="text-slate-500 block text-[9px]">PASS VOLUME</span>
                      <span className="text-emerald-400 font-bold">{activeZoneObj.passes_completed}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px]">TIME IN ZONE</span>
                      <span className="text-sky-400 font-bold">{activeZoneObj.possession_share_pct}%</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Real Tracked Players Quick Roster (If real analytics available) */}
      {hasRealAnalytics && realAnalytics.players && realAnalytics.players.length > 0 && (
        <div className="bg-[#101722] border border-[#253244] rounded-2xl p-5 shadow-panel">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#253244] mb-3.5 gap-2">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-400" />
                <span>Tracked Player Instances (ByteTrack IDs & Teams)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Confirmed player tracklets with jersey-color team assignments.
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                Team A: {realAnalytics.summary_metrics.team_a_count || 0}
              </span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                Team B: {realAnalytics.summary_metrics.team_b_count || 0}
              </span>
              {realAnalytics.summary_metrics.officials_count > 0 && (
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Refs: {realAnalytics.summary_metrics.officials_count}
                </span>
              )}
              {realAnalytics.summary_metrics.unknown_count > 0 && (
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-500/10 text-slate-300 border border-slate-500/20">
                  Unk: {realAnalytics.summary_metrics.unknown_count}
                </span>
              )}
              <span className="text-xs font-mono text-emerald-400 font-bold ml-1">
                {realAnalytics.players.length} Confirmed Players
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
            {realAnalytics.players.map((p) => {
              const teamCol = p.team_color || '#10B981';
              return (
                <div
                  key={p.track_id}
                  onClick={() => onSelectPlayer && onSelectPlayer(p.track_id)}
                  className="p-3 bg-[#080B10] border border-[#253244] hover:border-emerald-500/50 rounded-xl cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className="text-xs font-mono font-bold px-1.5 py-0.2 rounded"
                      style={{ backgroundColor: `${teamCol}20`, color: teamCol }}
                    >
                      #{p.track_id}
                    </span>
                    <span
                      className="text-[9px] font-mono px-1.5 py-0.2 rounded font-medium"
                      style={{ backgroundColor: `${teamCol}15`, color: teamCol }}
                    >
                      {p.team || 'Player'}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-white truncate">{p.label}</p>
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mt-1.5 pt-1.5 border-t border-[#17212E]">
                    <span>{p.detections_count} frames</span>
                    <span className="text-emerald-400">{(p.avg_confidence * 100).toFixed(0)}%</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Transient Tracks audit summary (if present) */}
          {realAnalytics.transient_tracks && realAnalytics.transient_tracks.length > 0 && (
            <div className="mt-4 pt-3 border-t border-[#17212E] flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span className="flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>Transient noise tracklets (&lt; {realAnalytics.summary_metrics.min_frames_threshold || 25} frames): {realAnalytics.transient_tracks.length} tracklets isolated from main roster</span>
              </span>
              <span className="text-slate-500">
                Total IDs: {realAnalytics.summary_metrics.total_unique_track_ids}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Match Events Timeline Panel (For Demo Mode) */}
      {!isUserUploadedVideo && (
        <div className="bg-[#101722] border border-[#253244] rounded-2xl p-5 shadow-panel">
          <div className="flex items-center justify-between pb-3 border-b border-[#253244] mb-3.5">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400" />
                <span>Match Events Log (Demonstration Timeline)</span>
                <DemoBadge size="xs" label="SAMPLE EVENTS" />
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Simulated match moments illustrating tactical event timeline scrubbing.
              </p>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              {events.length} Milestones
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {events.map((evt) => {
              const isSelected = evt.id === selectedEventId;
              return (
                <div
                  key={evt.id}
                  onClick={() => {
                    setSelectedEventId(evt.id);
                    setCurrentTime(evt.minute);
                    if (videoRef.current) videoRef.current.currentTime = evt.minute;
                  }}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-[#17212E] border-emerald-500/50'
                      : 'bg-[#080B10] border-[#253244] hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                      {evt.minute}' MIN
                    </span>
                    <span className="text-[9px] font-mono uppercase text-slate-400">
                      {evt.type}
                    </span>
                  </div>
                  <p className="font-semibold text-white text-xs">{evt.player}</p>
                  <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {evt.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchAnalysisView;
