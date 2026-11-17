import React from 'react';
import { AlertTriangle, Cpu } from 'lucide-react';

export const DemoBanner = () => {
  return (
    <div className="bg-gradient-to-r from-amber-950/40 via-amber-900/20 to-slate-900/60 border border-amber-500/30 rounded-xl p-3.5 mb-6 shadow-lg shadow-black/40">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-amber-200 uppercase tracking-wider font-mono">
                Foundation Phase Notice
              </h4>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-mono">
                MOCK / DEMO DATA
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              All tactical numbers and match metrics shown are simulated placeholders for dashboard structure validation.
              Computer Vision tracking (Ultralytics YOLOv8 & ByteTrack) will calculate authentic values in Phase 2.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          <span className="inline-flex items-center gap-1.5 text-xs font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2.5 py-1 rounded-lg">
            <Cpu className="w-3.5 h-3.5" />
            CV Models: Idle (Awaiting Phase 2)
          </span>
        </div>
      </div>
    </div>
  );
};

export default DemoBanner;
