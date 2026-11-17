import React, { useState, useRef, useEffect } from 'react';
import {
  UploadCloud,
  FileVideo,
  CheckCircle2,
  AlertCircle,
  Loader2,
  HardDrive,
  Cpu,
  Play,
  ArrowRight,
  Clock,
  Sparkles,
} from 'lucide-react';
import { api } from '../../api/client';

export const VideoUploadSection = ({ onUploadSuccess, onSelectVideoForAnalysis, onLoadDemoClip }) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState(null);
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
      console.warn('Could not fetch recent videos:', err.message);
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
    setUploadResult(null);
    const validExtensions = ['.mp4', '.avi', '.mov', '.mkv'];
    const hasValidExt = validExtensions.some((ext) =>
      file.name.toLowerCase().endsWith(ext)
    );

    if (!hasValidExt) {
      setErrorMessage(
        `Unsupported format. Please select a valid match recording (${validExtensions.join(', ')}).`
      );
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadProgress(0);
    setErrorMessage(null);

    try {
      const response = await api.uploadVideo(selectedFile, (progress) => {
        setUploadProgress(progress);
      });

      setUploadResult(response);
      setSelectedFile(null);
      fetchRecent();
      if (onUploadSuccess) onUploadSuccess(response);
    } catch (err) {
      const detail =
        err.response?.data?.detail ||
        err.message ||
        'Upload failed. Please verify that the FastAPI backend is running on http://localhost:8000';
      setErrorMessage(detail);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-[#0A0E17] border border-[#1E2638] rounded-2xl p-5 sm:p-6 shadow-2xl shadow-black/60">
      {/* Header with Technical Badges */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-[#1E2638]">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white tracking-tight">Match Video Ingestion Gateway</h3>
            <span className="text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded">
              Active Pipeline
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Upload match broadcast or tactical camera recordings (.mp4, .avi, .mov, max 500MB) for CV analysis pipeline.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onLoadDemoClip}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs font-mono text-amber-300 border border-amber-500/30 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Load Sample Clip</span>
          </button>
        </div>
      </div>

      {/* Main Drag & Drop Zone */}
      <div className="mt-5">
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
            className={`border-2 border-dashed rounded-xl p-8 sm:p-10 text-center cursor-pointer transition-all ${
              dragActive
                ? 'border-emerald-400 bg-emerald-950/20'
                : selectedFile
                ? 'border-emerald-500/60 bg-[#0E1524]'
                : 'border-[#1E2638] hover:border-slate-700 bg-[#080C14]/60'
            }`}
          >
            <div className="flex flex-col items-center justify-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
                <UploadCloud className="w-7 h-7" />
              </div>

              <div>
                <p className="text-sm font-semibold text-white">
                  {selectedFile ? selectedFile.name : 'Click to select or drag & drop football match video'}
                </p>
                <p className="text-xs text-slate-400 mt-1 font-mono">
                  {selectedFile
                    ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready for transfer to FastAPI`
                    : 'Supported: MP4, AVI, MOV, MKV • H.264/HEVC • Up to 500MB'}
                </p>
              </div>

              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] font-mono bg-slate-900 border border-slate-800 text-slate-300 px-2 py-0.5 rounded">
                  Destination: backend/uploads/
                </span>
              </div>
            </div>
          </div>
        </form>

        {/* Selected File Stage & Upload Action */}
        {selectedFile && !uploading && (
          <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-[#0E1524] border border-emerald-500/30 rounded-xl">
            <div className="flex items-center gap-3">
              <FileVideo className="w-6 h-6 text-emerald-400 shrink-0" />
              <div className="text-xs">
                <p className="font-semibold text-white">{selectedFile.name}</p>
                <p className="text-slate-400 font-mono">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Tactical Stream Ready
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                type="button"
                onClick={() => setSelectedFile(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-mono text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpload}
                className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs shadow-md shadow-emerald-500/25 transition-all"
              >
                Upload to Server
              </button>
            </div>
          </div>
        )}

        {/* Upload Progress Bar */}
        {uploading && (
          <div className="mt-4 p-4 bg-[#0E1524] border border-[#1E2638] rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-200 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                Streaming footage to backend storage...
              </span>
              <span className="text-emerald-400 font-bold">{uploadProgress}%</span>
            </div>
            <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full transition-all duration-150 rounded-full"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Error message */}
        {errorMessage && (
          <div className="mt-4 p-3.5 bg-rose-950/40 border border-rose-500/30 rounded-xl flex items-start gap-3 text-xs text-rose-300">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-rose-200">Ingestion Error</p>
              <p className="mt-0.5">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Upload Success State */}
        {uploadResult && (
          <div className="mt-4 p-4 bg-emerald-950/30 border border-emerald-500/40 rounded-xl space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider font-mono">
                    Footage Ingested Successfully
                  </h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Saved as <span className="font-mono text-emerald-400">{uploadResult.saved_filename}</span> ({uploadResult.file_size_formatted})
                  </p>
                </div>
              </div>

              {onSelectVideoForAnalysis && (
                <button
                  onClick={() => onSelectVideoForAnalysis(uploadResult)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs transition-colors shrink-0"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Open in Match Studio</span>
                </button>
              )}
            </div>

            <div className="p-3 bg-[#05070B] border border-[#1E2638] rounded-lg flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-amber-400" />
                <span className="text-slate-300 font-mono text-[11px]">
                  Processing Pipeline: <strong className="text-amber-400">Queued for Phase 2 CV Inference</strong>
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                Awaiting YOLO & ByteTrack activation
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Uploaded Videos Library */}
      <div className="mt-6 pt-5 border-t border-[#1E2638]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">
              Server Footage Storage
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            {recentVideos.length} {recentVideos.length === 1 ? 'recording' : 'recordings'} found
          </span>
        </div>

        {recentVideos.length === 0 ? (
          <div className="p-4 rounded-xl bg-[#080C14] border border-dashed border-[#1E2638] text-center">
            <p className="text-xs text-slate-300">No match videos currently stored on server.</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Drag and drop a match clip above, or click "Load Sample Clip" to test tactical playback.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {recentVideos.map((video, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-xl bg-[#0E1524] border border-[#1E2638] hover:border-slate-700 transition-colors text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileVideo className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div className="truncate">
                    <p className="font-mono text-slate-200 truncate">{video.filename}</p>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {video.file_size_formatted}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {onSelectVideoForAnalysis && (
                    <button
                      onClick={() => onSelectVideoForAnalysis(video)}
                      className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-mono flex items-center gap-1 transition-colors"
                      title="Load this recording into the Match Analysis Studio"
                    >
                      <Play className="w-3 h-3" />
                      <span>Analyze</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoUploadSection;
