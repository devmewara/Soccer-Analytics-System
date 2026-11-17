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
        `Unsupported video format. Please select an MP4, AVI, MOV, or MKV recording.`
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
        'Upload failed. Ensure FastAPI backend is running on http://localhost:8000';
      setErrorMessage(detail);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-[#101722] border border-[#253244] rounded-2xl p-5 sm:p-6 shadow-panel">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-[#253244]">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white tracking-tight">Match Video Ingestion Gateway</h3>
            <span className="text-[10px] font-mono font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded">
              Storage: Operational
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Upload match broadcast or tactical camera footage (.mp4, .avi, .mov, max 500MB) directly to backend storage.
          </p>
        </div>

        <button
          onClick={onLoadDemoClip}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#17212E] hover:bg-[#1E2B3C] text-xs font-mono text-amber-300 border border-[#253244] transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Load Sample Clip</span>
        </button>
      </div>

      {/* Drag & Drop Upload Zone */}
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
            className={`border-2 border-dashed rounded-xl p-8 sm:p-10 text-center cursor-pointer transition-colors ${
              dragActive
                ? 'border-emerald-400 bg-emerald-950/20'
                : selectedFile
                ? 'border-emerald-500/60 bg-[#17212E]'
                : 'border-[#253244] hover:border-slate-600 bg-[#080B10]'
            }`}
          >
            <div className="flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#17212E] border border-[#253244] flex items-center justify-center text-emerald-400">
                <UploadCloud className="w-6 h-6" />
              </div>

              <div>
                <p className="text-sm font-semibold text-white">
                  {selectedFile ? selectedFile.name : 'Select or drag & drop football match video'}
                </p>
                <p className="text-xs text-slate-400 mt-1 font-mono">
                  {selectedFile
                    ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready to transfer to FastAPI backend`
                    : 'Supported: MP4, AVI, MOV, MKV • H.264/HEVC • Up to 500MB'}
                </p>
              </div>

              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] font-mono bg-[#17212E] border border-[#253244] text-slate-300 px-2 py-0.5 rounded">
                  Server Destination: backend/uploads/
                </span>
              </div>
            </div>
          </div>
        </form>

        {/* Selected File Review Stage */}
        {selectedFile && !uploading && (
          <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-[#17212E] border border-emerald-500/30 rounded-xl">
            <div className="flex items-center gap-3">
              <FileVideo className="w-5 h-5 text-emerald-400 shrink-0" />
              <div className="text-xs">
                <p className="font-semibold text-white">{selectedFile.name}</p>
                <p className="text-slate-400 font-mono">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready for ingestion
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
                className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs transition-all shadow-sm"
              >
                Upload to Server
              </button>
            </div>
          </div>
        )}

        {/* Upload Progress Bar */}
        {uploading && (
          <div className="mt-4 p-4 bg-[#17212E] border border-[#253244] rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-200 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                Transferring video chunks to backend storage...
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

        {/* Error message */}
        {errorMessage && (
          <div className="mt-4 p-3.5 bg-rose-950/40 border border-rose-500/30 rounded-xl flex items-start gap-3 text-xs text-rose-300">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-rose-200">Upload Failed</p>
              <p className="mt-0.5">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Upload Success State */}
        {uploadResult && (
          <div className="mt-4 p-4 bg-emerald-950/20 border border-emerald-500/30 rounded-xl space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider font-mono">
                    Footage Stored on Server
                  </h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Saved as <span className="font-mono text-emerald-400">{uploadResult.saved_filename}</span> ({uploadResult.file_size_formatted})
                  </p>
                </div>
              </div>

              {onSelectVideoForAnalysis && (
                <button
                  onClick={() => onSelectVideoForAnalysis(uploadResult)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs transition-colors shrink-0"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Open in Match Studio</span>
                </button>
              )}
            </div>

            <div className="p-3 bg-[#080B10] border border-[#253244] rounded-lg flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-amber-400" />
                <span className="text-slate-300 font-mono text-[11px]">
                  Computer Vision Pipeline: <strong className="text-amber-400">Scheduled for Phase 2 Integration</strong>
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
                YOLOv8 + ByteTrack inference queue
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Uploaded Match Videos on Server */}
      <div className="mt-6 pt-5 border-t border-[#253244]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">
              Server Video Library
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-500">
            {recentVideos.length} {recentVideos.length === 1 ? 'recording' : 'recordings'} on disk
          </span>
        </div>

        {recentVideos.length === 0 ? (
          <div className="p-4 rounded-xl bg-[#080B10] border border-dashed border-[#253244] text-center">
            <p className="text-xs text-slate-300">No match recordings currently saved in backend/uploads/.</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Upload footage above, or click "Load Sample Clip" to test the playback engine.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {recentVideos.map((video, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-xl bg-[#17212E] border border-[#253244] hover:border-slate-600 transition-colors text-xs"
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
                      className="px-2.5 py-1 rounded-lg bg-[#101722] hover:bg-slate-800 text-slate-200 border border-[#253244] text-[11px] font-mono flex items-center gap-1 transition-colors"
                      title="Load into Match Analysis Studio"
                    >
                      <Play className="w-3 h-3 text-emerald-400" />
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
