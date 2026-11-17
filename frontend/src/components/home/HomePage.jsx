import React, { useState, useRef, useEffect } from 'react';
import {
  UploadCloud,
  FileVideo,
  CheckCircle2,
  AlertCircle,
  Loader2,
  HardDrive,
  Play,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Cpu,
  Layers,
  Compass,
} from 'lucide-react';
import { api } from '../../api/client';

export const HomePage = ({
  onStartAnalysis,
  onLaunchDemo,
  isBackendOnline,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [recentVideos, setRecentVideos] = useState([]);
  const [loadingRecent, setLoadingRecent] = useState(false);

  const fileInputRef = useRef(null);

  const fetchRecent = async () => {
    try {
      setLoadingRecent(true);
      const data = await api.getRecentVideos();
      setRecentVideos(data);
    } catch (err) {
      console.warn('Could not query recent videos:', err.message);
    } finally {
      setLoadingRecent(false);
    }
  };

  useEffect(() => {
    fetchRecent();
  }, []);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = (file) => {
    setErrorMessage(null);
    setUploadSuccess(null);
    const validExtensions = ['.mp4', '.avi', '.mov', '.mkv'];
    const hasValidExt = validExtensions.some((ext) =>
      file.name.toLowerCase().endsWith(ext)
    );

    if (!hasValidExt) {
      setErrorMessage(
        `Unsupported video format. Please select an MP4, AVI, MOV, or MKV recording.`
      );
      return;
    }

    if (file.size > 500 * 1024 * 1024) {
      setErrorMessage('File size exceeds the 500MB server upload limit.');
      return;
    }

    setSelectedFile(file);
  };

  const handleUploadAndAnalyze = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadProgress(0);
    setErrorMessage(null);

    try {
      const response = await api.uploadVideo(selectedFile, (progress) => {
        setUploadProgress(progress);
      });

      setUploadSuccess(response);
      setSelectedFile(null);
      fetchRecent();
      // Automatically launch analysis workspace with the uploaded video!
      onStartAnalysis(response);
    } catch (err) {
      const detail =
        err.response?.data?.detail ||
        err.message ||
        'Upload failed. Ensure the FastAPI backend is running on http://localhost:8000';
      setErrorMessage(detail);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-16 max-w-5xl mx-auto py-6 sm:py-10 px-4">
      {/* 1. Hero Title & Supporting Text */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Computer Vision & Deep Learning Platform</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight max-w-4xl mx-auto">
          Understand Every Move. <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-sky-400">
            Analyze Every Moment.
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Turn football footage into meaningful match insights using computer vision, 
          player tracking, and intelligent spatial analytics.
        </p>
      </div>

      {/* 2. Prominent Video Upload Hero Console */}
      <div className="bg-[#101722] border border-[#253244] rounded-2xl p-6 sm:p-8 shadow-panel relative">
        <div className="flex items-center justify-between pb-4 border-b border-[#253244] mb-6">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">Upload Match Footage</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Select or drop your video to begin automated pipeline analysis.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <HardDrive className="w-4 h-4 text-emerald-400" />
            <span>Max Size: 500 MB</span>
          </div>
        </div>

        {/* Dropzone Container */}
        <form
          onDragEnter={handleDrag}
          onSubmit={(e) => e.preventDefault()}
          className="relative"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".mp4,.avi,.mov,.mkv"
            onChange={handleChange}
            className="hidden"
          />

          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 sm:p-14 text-center cursor-pointer transition-colors ${
              dragActive
                ? 'border-emerald-400 bg-emerald-950/20'
                : selectedFile
                ? 'border-emerald-500/60 bg-[#17212E]'
                : 'border-[#253244] hover:border-slate-600 bg-[#080B10]'
            }`}
          >
            <div className="flex flex-col items-center justify-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-[#17212E] border border-[#253244] flex items-center justify-center text-emerald-400">
                <UploadCloud className="w-7 h-7" />
              </div>

              <div>
                <p className="text-base font-semibold text-white">
                  {selectedFile ? selectedFile.name : 'Drag & drop football match video here'}
                </p>
                <p className="text-xs text-slate-400 mt-1 font-mono">
                  {selectedFile
                    ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready for analysis`
                    : 'Supported codecs: MP4, AVI, MOV, MKV • H.264 / HEVC • Up to 500MB'}
                </p>
              </div>

              {!selectedFile && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="mt-2 px-4 py-2 rounded-lg bg-[#17212E] hover:bg-[#1E2B3C] text-slate-200 border border-[#253244] text-xs font-medium transition-colors"
                >
                  Browse Video Files
                </button>
              )}
            </div>
          </div>
        </form>

        {/* Selected File Stage & Start Analysis Action */}
        {selectedFile && !uploading && (
          <div className="mt-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-[#17212E] border border-emerald-500/40 rounded-xl">
            <div className="flex items-center gap-3">
              <FileVideo className="w-6 h-6 text-emerald-400 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-white">{selectedFile.name}</p>
                <p className="text-xs text-slate-400 font-mono">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Validation passed
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                type="button"
                onClick={() => setSelectedFile(null)}
                className="px-3 py-2 rounded-lg text-xs font-mono text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUploadAndAnalyze}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs shadow-sm transition-all active:scale-95"
              >
                <Play className="w-4 h-4 fill-black" />
                <span>Upload & Start Analysis</span>
              </button>
            </div>
          </div>
        )}

        {/* Upload Progress Bar */}
        {uploading && (
          <div className="mt-5 p-4 bg-[#17212E] border border-[#253244] rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-200 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                Transferring video to backend and initializing analysis workspace...
              </span>
              <span className="text-emerald-400 font-bold">{uploadProgress}%</span>
            </div>
            <div className="w-full bg-[#080B10] h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full transition-all duration-150 rounded-full"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Error Notification */}
        {errorMessage && (
          <div className="mt-4 p-3.5 bg-rose-950/40 border border-rose-500/30 rounded-xl flex items-start gap-3 text-xs text-rose-300">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-rose-200">Upload Issue</p>
              <p className="mt-0.5">{errorMessage}</p>
            </div>
          </div>
        )}
      </div>

      {/* 3. Server Video Library & Separate Sample Demo Sandbox */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Server Uploads */}
        <div className="bg-[#101722] border border-[#253244] rounded-2xl p-5 shadow-panel flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#253244] mb-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Recent Server Recordings
              </h3>
              <span className="text-[10px] font-mono text-slate-500">
                {recentVideos.length} on disk
              </span>
            </div>

            {recentVideos.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                No previous match recordings found on the server.
              </p>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {recentVideos.slice(0, 4).map((video, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-[#17212E] border border-[#253244] hover:border-slate-600 transition-colors text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileVideo className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div className="truncate">
                        <p className="font-mono text-slate-200 truncate">{video.filename}</p>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {video.file_size_formatted}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => onStartAnalysis(video)}
                      className="px-2.5 py-1 rounded bg-[#101722] hover:bg-slate-800 text-slate-200 border border-[#253244] text-[11px] font-mono flex items-center gap-1 transition-colors shrink-0"
                    >
                      <Play className="w-3 h-3 text-emerald-400" />
                      <span>Analyze</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Distinct Sample Demo Sandbox */}
        <div className="bg-[#101722] border border-[#253244] rounded-2xl p-5 shadow-panel flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#253244] mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Sample Demonstration Showcase
                </h3>
              </div>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                SANDBOX
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Want to preview the full analytics interface without uploading your own video? 
              Launch the sample showcase featuring an exhibition match with simulated player tracking, 
              formation boards, and spatial heatmaps.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-[#253244] flex items-center justify-between">
            <span className="text-[10px] font-mono text-slate-400">
              Simulated 22-Player Roster
            </span>
            <button
              onClick={onLaunchDemo}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#17212E] hover:bg-[#1E2B3C] text-amber-300 border border-amber-500/30 text-xs font-mono font-medium transition-colors"
            >
              <span>Launch Demo Showcase</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 4. Core Workflow Architecture (Honest Breakdown) */}
      <div className="pt-4 border-t border-[#253244]">
        <h3 className="text-center text-xs font-mono font-semibold uppercase tracking-wider text-slate-400 mb-8">
          End-to-End Analytics Workflow
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-5 rounded-2xl bg-[#101722] border border-[#253244] text-xs">
            <span className="font-mono text-emerald-400 font-bold text-xs block mb-1">01 • Ingestion</span>
            <h4 className="text-sm font-semibold text-white">Upload & Decode</h4>
            <p className="text-slate-400 text-xs mt-1 leading-relaxed">
              FastAPI streams high-definition match footage (.mp4/.avi/.mov) directly to server storage and prepares frame pipelines.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#101722] border border-[#253244] text-xs">
            <span className="font-mono text-sky-400 font-bold text-xs block mb-1">02 • Vision Core</span>
            <h4 className="text-sm font-semibold text-white">Detection & ByteTrack (Phase 2)</h4>
            <p className="text-slate-400 text-xs mt-1 leading-relaxed">
              YOLOv8 detects players, referee, and the ball, while ByteTrack preserves continuous player tracklet identities across frames.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#101722] border border-[#253244] text-xs">
            <span className="font-mono text-purple-400 font-bold text-xs block mb-1">03 • Intelligence</span>
            <h4 className="text-sm font-semibold text-white">Homography & Analytics</h4>
            <p className="text-slate-400 text-xs mt-1 leading-relaxed">
              Camera pixel coordinates map onto 2D metric pitch geometry (105m × 68m) to calculate speeds, distances, and spatial heatmaps.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
