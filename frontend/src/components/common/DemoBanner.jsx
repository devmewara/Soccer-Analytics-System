import React, { useState } from 'react';
import { Info, ChevronDown, ChevronUp, CheckCircle2, Clock, Layers } from 'lucide-react';

export const DemoBanner = () => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-[#101722] border border-[#253244] rounded-xl p-3.5 mb-5 shadow-panel">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0">
            <Info className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-semibold text-slate-200 tracking-wide font-sans">
                College Evaluation Prototype • Feature Status Notice
              </h4>
              <span className="text-[9px] font-mono font-medium bg-amber-500/15 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded">
                SAMPLE DATA ACTIVE
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Video ingestion and playback are fully operational. Tactical statistics, coordinate telemetry, and heatmaps 
              are modeled sample datasets for UI verification pending Phase 2 YOLO and ByteTrack model integration.
            </p>
          </div>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 text-xs font-mono text-slate-300 hover:text-white bg-[#17212E] border border-[#253244] hover:border-slate-600 px-3 py-1.5 rounded-lg transition-colors shrink-0 self-end sm:self-center"
        >
          <span>{expanded ? 'Hide Pipeline Status' : 'View Pipeline Status'}</span>
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {expanded && (
        <div className="mt-3.5 pt-3.5 border-t border-[#253244] grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-[#17212E] border border-[#253244] rounded-lg">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-emerald-400 font-bold uppercase">Phase 1</span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                Implemented
              </span>
            </div>
            <p className="font-semibold text-slate-200 mt-1">Foundation & Ingestion</p>
            <p className="text-slate-400 text-[11px] mt-0.5 leading-relaxed">
              FastAPI backend, video upload to disk, static stream player, responsive layout, and tactical HUD controls.
            </p>
          </div>

          <div className="p-3 bg-[#17212E] border border-amber-500/30 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-amber-400 font-bold uppercase">Phase 2</span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-amber-500/15 text-amber-400 border border-amber-500/30">
                Scheduled Next
              </span>
            </div>
            <p className="font-semibold text-slate-200 mt-1">Computer Vision Core</p>
            <p className="text-slate-400 text-[11px] mt-0.5 leading-relaxed">
              Ultralytics YOLOv8 for player/ball detection, ByteTrack for MOT, and OpenCV pitch homography keypoints.
            </p>
          </div>

          <div className="p-3 bg-[#17212E] border border-[#253244] rounded-lg">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-slate-400 font-bold uppercase">Phase 3</span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-slate-800 text-slate-400 border border-slate-700">
                Coming Soon
              </span>
            </div>
            <p className="font-semibold text-slate-200 mt-1">Authentic Kinematics</p>
            <p className="text-slate-400 text-[11px] mt-0.5 leading-relaxed">
              Real-world velocity ($km/h$) and distance ($km$) derived from homography transformed coordinates.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DemoBanner;
