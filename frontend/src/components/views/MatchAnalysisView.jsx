import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  SkipBack,
  Sliders,
  Eye,
  Layers,
  Target,
  Clock,
  Maximize2,
  ChevronRight,
  Shield,
  Activity,
  Sparkles,
} from 'lucide-react';
import DemoBanner from '../common/DemoBanner';
import DemoBadge from '../common/DemoBadge';
import PitchCanvas from '../common/PitchCanvas';
import { api } from '../../api/client';

export const MatchAnalysisView = ({
  data,
  activeVideo,
  onSelectPlayer,
  onLoadDemoClip,
}) => {
  // View mode: 'split' | 'video' | 'pitch'
  const [viewMode, setViewMode] = useState('split');
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [currentTime, setCurrentTime] = useState(14.3); // seconds into match clip
  const [duration, setDuration] = useState(90);
  const [selectedZone, setSelectedZone] = useState('z_att_third');
  const [selectedEventId, setSelectedEventId] = useState('evt_1');
  const [selectedPlayerId, setSelectedPlayerId] = useState(17);

  // Tactical overlay toggles for the video canvas
  const [showBoundingBoxes, setShowBoundingBoxes] = useState(true);
  const [showPitchCalibration, setShowPitchCalibration] = useState(true);
  const [showBallTrail, setShowBallTrail] = useState(true);
  const [showZoneOverlay, setShowZoneOverlay] = useState(false);

  const videoRef = useRef(null);

  const players = data?.players || [];
  const events = data?.match_events || [];
  const zones = data?.pitch_zones || [];
  const activeZoneObj = zones.find((z) => z.id === selectedZone) || zones[0];
  const activeEvent = events.find((e) => e.id === selectedEventId) || events[0];
  const selectedPlayer = players.find((p) => p.id === selectedPlayerId) || players[0];

  // Playback timer simulation if using canvas demo preview
  useEffect(() => {
    let interval = null;
    if (isPlaying) {
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
  }, [isPlaying, playbackSpeed, duration]);

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
    setCurrentTime((prev) => Math.max(0, Math.min(duration, prev + deltaSeconds)));
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(
        0,
        Math.min(duration, videoRef.current.currentTime + deltaSeconds)
      );
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
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms}`;
  };

  const videoStreamUrl = activeVideo?.stream_url
    ? api.getVideoStreamUrl(activeVideo.stream_url)
    : null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <DemoBanner />

      {/* Studio Header & Layout Modes */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-[#1E2638]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">Tactical Match Analysis Studio</h2>
            <DemoBadge />
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Synchronized video playback, YOLO bounding box overlays, and 2D calibrated tactical pitch.
          </p>
        </div>

        {/* View Layout Selector */}
        <div className="flex items-center gap-1.5 p-1 bg-[#0A0E17] border border-[#1E2638] rounded-xl self-end sm:self-center">
          <button
            onClick={() => setViewMode('split')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
              viewMode === 'split'
                ? 'bg-emerald-500 text-black font-bold shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Split View (50/50)
          </button>
          <button
            onClick={() => setViewMode('video')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
              viewMode === 'video'
                ? 'bg-emerald-500 text-black font-bold shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Video Focus
          </button>
          <button
            onClick={() => setViewMode('pitch')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
              viewMode === 'pitch'
                ? 'bg-emerald-500 text-black font-bold shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Tactical Pitch
          </button>
        </div>
      </div>

      {/* Main Workspace (Split / Focus Views) */}
      <div
        className={`grid gap-6 ${
          viewMode === 'split'
            ? 'grid-cols-1 lg:grid-cols-2'
            : 'grid-cols-1'
        }`}
      >
        {/* Panel 1: Video Player with Tactical CV Overlays */}
        {(viewMode === 'split' || viewMode === 'video') && (
          <div className="bg-[#0A0E17] border border-[#1E2638] rounded-2xl p-4 sm:p-5 shadow-2xl shadow-black/60 flex flex-col justify-between">
            <div>
              {/* Video Player Header with Overlay Toggles */}
              <div className="flex items-center justify-between pb-3 border-b border-[#1E2638] mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                  <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                    Match Broadcast Cam (1080p)
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setShowBoundingBoxes(!showBoundingBoxes)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                      showBoundingBoxes
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-slate-900 text-slate-500 border border-slate-800'
                    }`}
                    title="Toggle YOLOv8 player bounding boxes"
                  >
                    Boxes: {showBoundingBoxes ? 'ON' : 'OFF'}
                  </button>

                  <button
                    onClick={() => setShowPitchCalibration(!showPitchCalibration)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                      showPitchCalibration
                        ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                        : 'bg-slate-900 text-slate-500 border border-slate-800'
                    }`}
                    title="Toggle OpenCV pitch calibration grid"
                  >
                    Grid: {showPitchCalibration ? 'ON' : 'OFF'}
                  </button>
                </div>
              </div>

              {/* Video Player Display Container */}
              <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black border border-[#1E2638] shadow-inner flex items-center justify-center group select-none">
                {videoStreamUrl ? (
                  <video
                    ref={videoRef}
                    src={videoStreamUrl}
                    className="w-full h-full object-contain"
                    onTimeUpdate={() => {
                      if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
                    }}
                    onLoadedMetadata={() => {
                      if (videoRef.current) setDuration(videoRef.current.duration || 90);
                    }}
                  />
                ) : (
                  /* Simulated Tactical Broadcast Screen with Football Pitch Graphic */
                  <div className="relative w-full h-full bg-gradient-to-b from-[#0c2415] via-[#07190e] to-[#040e08] flex items-center justify-center overflow-hidden">
                    {/* Simulated Camera Perspective lines */}
                    {showPitchCalibration && (
                      <div className="absolute inset-0 pointer-events-none opacity-40">
                        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                          <line x1="10" y1="90" x2="35" y2="20" stroke="#10B981" strokeWidth="0.3" strokeDasharray="1,1" />
                          <line x1="90" y1="90" x2="65" y2="20" stroke="#10B981" strokeWidth="0.3" strokeDasharray="1,1" />
                          <line x1="20" y1="50" x2="80" y2="50" stroke="#10B981" strokeWidth="0.3" strokeDasharray="1,1" />
                        </svg>
                      </div>
                    )}

                    {/* Simulated YOLO Detection Bounding Boxes */}
                    {showBoundingBoxes && (
                      <>
                        {/* Player 1: KDB (Man Blue) */}
                        <div className="absolute left-[54%] top-[38%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none">
                          <span className="text-[8px] font-mono font-bold bg-sky-500 text-black px-1 rounded-t">
                            #17 KDB 0.94
                          </span>
                          <div className="w-10 h-20 border-2 border-sky-400 bg-sky-500/10 rounded-sm"></div>
                        </div>

                        {/* Player 2: Haaland (Man Blue) */}
                        <div className="absolute left-[72%] top-[45%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none">
                          <span className="text-[8px] font-mono font-bold bg-sky-500 text-black px-1 rounded-t">
                            #9 Haaland 0.98
                          </span>
                          <div className="w-12 h-24 border-2 border-sky-400 bg-sky-500/10 rounded-sm"></div>
                        </div>

                        {/* Player 3: Saka (London Red) */}
                        <div className="absolute left-[42%] top-[30%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none">
                          <span className="text-[8px] font-mono font-bold bg-rose-500 text-white px-1 rounded-t">
                            #7 Saka 0.91
                          </span>
                          <div className="w-10 h-20 border-2 border-rose-500 bg-rose-500/10 rounded-sm"></div>
                        </div>

                        {/* Player 4: Rice (London Red) */}
                        <div className="absolute left-[34%] top-[52%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none">
                          <span className="text-[8px] font-mono font-bold bg-rose-500 text-white px-1 rounded-t">
                            #41 Rice 0.95
                          </span>
                          <div className="w-11 h-22 border-2 border-rose-500 bg-rose-500/10 rounded-sm"></div>
                        </div>

                        {/* Ball Reticle */}
                        {showBallTrail && (
                          <div className="absolute left-[58%] top-[50%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none">
                            <span className="text-[7px] font-mono font-bold bg-amber-400 text-black px-1 rounded-t">
                              Ball 0.88
                            </span>
                            <div className="w-5 h-5 rounded-full border-2 border-amber-300 animate-ping"></div>
                          </div>
                        )}
                      </>
                    )}

                    {/* Overlay Watermark info */}
                    <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded text-[10px] font-mono text-slate-300 border border-slate-800">
                      <span>Simulated Broadcast Stream</span>
                      <span className="mx-1.5 text-slate-600">•</span>
                      <span className="text-emerald-400">YOLO Detection Overlay</span>
                    </div>

                    <div className="absolute bottom-3 right-3 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded text-[10px] font-mono text-slate-300 border border-slate-800">
                      <span>ByteTrack: Active (4 Tracklets)</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Match Timeline Scrub Bar */}
              <div className="mt-3 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                  <span className="text-emerald-400 font-bold">{formatTimecode(currentTime)}</span>
                  <span>{formatTimecode(duration)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={duration}
                  step="0.1"
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>

              {/* Playback Controls & Frame Stepper */}
              <div className="mt-3 flex items-center justify-between gap-2 pt-2 border-t border-[#1E2638]">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleStepFrame(-1.0)}
                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-mono transition-colors"
                    title="Step 1s Backward"
                  >
                    <SkipBack className="w-4 h-4" />
                  </button>

                  <button
                    onClick={handlePlayPause}
                    className="p-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold shadow-md shadow-emerald-500/20 transition-all active:scale-95"
                    title={isPlaying ? 'Pause' : 'Play'}
                  >
                    {isPlaying ? <Pause className="w-4 h-4 fill-black" /> : <Play className="w-4 h-4 fill-black" />}
                  </button>

                  <button
                    onClick={() => handleStepFrame(1.0)}
                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-mono transition-colors"
                    title="Step 1s Forward"
                  >
                    <SkipForward className="w-4 h-4" />
                  </button>
                </div>

                {/* Playback Rate Selector */}
                <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs font-mono">
                  {[0.5, 1.0, 2.0].map((rate) => (
                    <button
                      key={rate}
                      onClick={() => setPlaybackSpeed(rate)}
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
              </div>
            </div>
          </div>
        )}

        {/* Panel 2: Interactive 2D Calibrated Pitch Canvas */}
        {(viewMode === 'split' || viewMode === 'pitch') && (
          <div className="bg-[#0A0E17] border border-[#1E2638] rounded-2xl p-4 sm:p-5 shadow-2xl shadow-black/60 flex flex-col justify-between">
            <div>
              {/* Pitch Canvas Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#1E2638] mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                    2D Homography Pitch Canvas
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setShowZoneOverlay(!showZoneOverlay)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                      showZoneOverlay
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-slate-900 text-slate-500 border border-slate-800'
                    }`}
                  >
                    Tactical Zones: {showZoneOverlay ? 'ON' : 'OFF'}
                  </button>
                </div>
              </div>

              {/* 2D Pitch Canvas Component */}
              <PitchCanvas
                showZones={showZoneOverlay}
                activeZone={selectedZone}
                onZoneClick={(zoneId) => setSelectedZone(zoneId)}
                heightClass={viewMode === 'pitch' ? 'h-[460px]' : 'h-72 sm:h-80 md:h-[340px]'}
              >
                {/* Render All 22 Player Nodes on Calibrated Pitch */}
                {players.map((p) => {
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
                        className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center font-mono font-bold text-[9px] sm:text-[10px] text-black shadow-lg transition-all ${
                          isTeamA
                            ? 'bg-sky-400 border border-white'
                            : 'bg-rose-500 text-white border border-white'
                        } ${isSelected ? 'ring-2 ring-emerald-400 scale-125' : ''}`}
                      >
                        {p.jersey_number}
                      </div>

                      {/* Tooltip on hover */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-slate-950/90 text-white text-[9px] font-mono px-2 py-0.5 rounded border border-slate-700 whitespace-nowrap z-30">
                        {p.short_name} ({p.top_speed_kmh} km/h)
                      </div>
                    </div>
                  );
                })}

                {/* Match Ball Marker on Pitch */}
                <div
                  className="absolute left-[58%] top-[50%] -translate-x-1/2 -translate-y-1/2 pointer-events-none z-30"
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400 border border-white shadow-sm shadow-amber-400 animate-pulse"></div>
                </div>
              </PitchCanvas>

              {/* Selected Tactical Zone Inspection Detail */}
              <div className="mt-4 p-3.5 rounded-xl bg-[#080C14] border border-[#1E2638] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white font-mono uppercase tracking-wide">
                      {activeZoneObj.label}
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                      {activeZoneObj.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                    {activeZoneObj.desc}
                  </p>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono shrink-0">
                  <div>
                    <span className="text-slate-400 block text-[9px]">COMPLETED PASSES</span>
                    <span className="text-emerald-400 font-bold">{activeZoneObj.passes_completed}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px]">POSSESSION TIME</span>
                    <span className="text-sky-400 font-bold">{activeZoneObj.possession_share_pct}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Match Events Timeline Panel (Clicking event seeks time) */}
      <div className="bg-[#0A0E17] border border-[#1E2638] rounded-2xl p-5 shadow-xl shadow-black/40">
        <div className="flex items-center justify-between pb-3 border-b border-[#1E2638] mb-4">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span>Match Events Log & Tactical Milestones</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Click any event milestone to inspect that tactical moment on the video timeline.
            </p>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            {events.length} Key Moments
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
                className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-emerald-500/15 border-emerald-500/40 shadow-sm shadow-emerald-500/20'
                    : 'bg-[#080C14] border-[#1E2638] hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded">
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
    </div>
  );
};

export default MatchAnalysisView;
