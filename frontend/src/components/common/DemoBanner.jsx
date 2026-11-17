import React, { useState } from 'react';
import { AlertTriangle, Cpu, ChevronDown, ChevronUp, CheckCircle2, Clock } from 'lucide-react';

export const DemoBanner = () => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-gradient-to-r from-amber-950/30 via-slate-900/80 to-slate-900/90 border border-amber-500/30 rounded-xl p-3.5 mb-6 shadow-lg shadow-black/50 transition-all">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-semibold text-amber-200 uppercase tracking-wider font-mono">
                Foundation Phase • Demo Dataset Active
              </h4>
              <span className="text-[9px] bg-amber-500/20 text-amber-300 font-mono px-1.5 py-0.5 rounded">
                SIMULATED DATA
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Metrics and tactical numbers below are simulated demo values for UI layout verification. 
              Authentic vision inference (YOLOv8 + ByteTrack) will calculate live values upon Phase 2 integration.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1.5 text-xs font-mono text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 px-2.5 py-1 rounded-lg transition-colors"
          >
            <span>{expanded ? 'Hide Architecture' : 'View CV Architecture'}</span>
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-lg">
            <div className="flex items-center gap-2 text-emerald-400 font-mono text-[11px] font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Phase 1 (Operational)</span>
            </div>
            <p className="text-slate-200 font-medium mt-1">Foundation & Video Gateway</p>
            <p className="text-slate-400 text-[11px] mt-0.5">
              FastAPI backend, React dashboard, video upload pipeline, and interactive tactical studios.
            </p>
          </div>

          <div className="p-3 bg-slate-900/90 border border-amber-500/30 rounded-lg">
            <div className="flex items-center gap-2 text-amber-400 font-mono text-[11px] font-semibold">
              <Clock className="w-3.5 h-3.5" />
              <span>Phase 2 (Awaiting Approval)</span>
            </div>
            <p className="text-slate-200 font-medium mt-1">Computer Vision Core</p>
            <p className="text-slate-400 text-[11px] mt-0.5">
              Ultralytics YOLOv8 player/ball detection, ByteTrack MOT, and OpenCV pitch homography keypoints.
            </p>
          </div>

          <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-lg">
            <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px] font-semibold">
              <Cpu className="w-3.5 h-3.5" />
              <span>Phase 3 (Upcoming)</span>
            </div>
            <p className="text-slate-200 font-medium mt-1">Advanced Tactical Analytics</p>
            <p className="text-slate-400 text-[11px] mt-0.5">
              Continuous 2D Gaussian heatmaps, passing network matrices, Voronoi pitch control, and xG/xT models.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DemoBanner;
