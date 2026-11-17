import React, { useState, useRef, useEffect } from 'react';
import {
  UploadCloud,
  FileVideo,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
  HardDrive,
  Cpu,
  Layers,
} from 'lucide-react';
import { api } from '../../api/client';

export const VideoUploadSection = ({ onUploadSuccess }) => {
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
      // Backend may be offline during initial boot
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
        `Unsupported format. Please select a valid video file (${validExtensions.join(', ')}).`
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
    <div className="bg-[#0D131F] border border-slate-800 rounded-2xl p-6 shadow-xl shadow-black/40">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white tracking-tight">Match Video Ingestion</h3>
            <span className="text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded">
              Phase 1 Video Gateway
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Upload match broadcast or tactical camera recordings (.mp4, .avi, .mov, max 500MB) for CV analysis pipeline.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <HardDrive className="w-4 h-4 text-emerald-400" />
          <span>Storage: backend/uploads/</span>
        </div>
      </div>

      {/* Drag & Drop Zone */}
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
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
              dragActive
                ? 'border-emerald-400 bg-emerald-950/20'
                : selectedFile
                ? 'border-emerald-500/50 bg-slate-900/60'
                : 'border-slate-800 hover:border-slate-700 bg-slate-900/30'
            }`}
          >
            <div className="flex flex-col items-center justify-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <UploadCloud className="w-7 h-7" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">
                  {selectedFile ? selectedFile.name : 'Click to select or drag and drop match video'}
                </p>
                <p className="text-xs text-slate-400 mt-1 font-mono">
                  {selectedFile
                    ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready to transfer`
                    : 'Supported codecs: H.264, MP4, AVI, MOV • Max 500MB'}
                </p>
              </div>
            </div>
          </div>
        </form>

        {/* Action Button & Upload Progress */}
        {selectedFile && !uploading && (
          <div className="mt-4 flex items-center justify-between gap-4 p-3 bg-slate-900 border border-slate-800 rounded-xl">
            <div className="flex items-center gap-3">
              <FileVideo className="w-5 h-5 text-emerald-400" />
              <div className="text-xs">
                <p className="font-semibold text-slate-200">{selectedFile.name}</p>
                <p className="text-slate-400 font-mono">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
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
                className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs shadow-md shadow-emerald-500/20 transition-all"
              >
                Upload to Backend
              </button>
            </div>
          </div>
        )}

        {/* Active Progress Bar */}
        {uploading && (
          <div className="mt-4 p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-300 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                Uploading to FastAPI backend...
              </span>
              <span className="text-emerald-400 font-bold">{uploadProgress}%</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
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
              <p className="font-semibold text-rose-200">Upload Error</p>
              <p className="mt-0.5">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Upload Success & Future CV Phase Notice */}
        {uploadResult && (
          <div className="mt-4 p-4 bg-emerald-950/30 border border-emerald-500/40 rounded-xl space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider font-mono">
                  File Ingested Successfully
                </h4>
                <p className="text-xs text-slate-300 mt-1">
                  Stored as <span className="font-mono text-emerald-400">{uploadResult.saved_filename}</span> ({uploadResult.file_size_formatted})
                </p>
              </div>
            </div>

            {/* Crucial Phase 2 Notice */}
            <div className="p-3 bg-[#070A0F] border border-slate-800 rounded-lg flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-amber-400" />
                <span className="text-slate-300 font-mono text-[11px]">
                  Computer Vision Status: <strong className="text-amber-400">Queue Ready (Phase 2)</strong>
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                Awaiting YOLO & ByteTrack activation
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Recent Uploads on Server */}
      <div className="mt-6 pt-5 border-t border-slate-800/80">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">
            Uploaded Match Footage On Server
          </span>
          <span className="text-[11px] font-mono text-slate-300">
            {recentVideos.length} {recentVideos.length === 1 ? 'file' : 'files'}
          </span>
        </div>

        {recentVideos.length === 0 ? (
          <div className="p-4 rounded-xl bg-slate-900/40 border border-dashed border-slate-800 text-center">
            <p className="text-xs text-slate-300">No match videos currently uploaded.</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Upload a match snippet above to test backend file ingestion.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentVideos.slice(0, 3).map((video, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/70 border border-slate-800 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <FileVideo className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="font-mono text-slate-200 truncate max-w-xs">{video.filename}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-slate-400 font-mono text-[11px]">{video.file_size_formatted}</span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-amber-300 font-mono">
                    Ready for CV
                  </span>
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
