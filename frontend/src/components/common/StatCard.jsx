import React from 'react';
import DemoBadge from './DemoBadge';

export const StatCard = ({
  title,
  value,
  unit = '',
  subtitle,
  icon: Icon,
  trend,
  isDemo = true,
  accent = 'emerald',
  badgeText,
}) => {
  const accentGlow = {
    emerald: 'from-emerald-500/30 to-transparent group-hover:from-emerald-400/50',
    cyan: 'from-sky-500/30 to-transparent group-hover:from-sky-400/50',
    amber: 'from-amber-500/30 to-transparent group-hover:from-amber-400/50',
    rose: 'from-rose-500/30 to-transparent group-hover:from-rose-400/50',
  }[accent] || 'from-emerald-500/30 to-transparent';

  const iconAccent = {
    emerald: 'text-emerald-400 group-hover:border-emerald-500/40',
    cyan: 'text-sky-400 group-hover:border-sky-500/40',
    amber: 'text-amber-400 group-hover:border-amber-500/40',
    rose: 'text-rose-400 group-hover:border-rose-500/40',
  }[accent] || 'text-emerald-400';

  return (
    <div className="relative group bg-[#0A0E17] border border-[#1E2638] hover:border-slate-700/80 rounded-xl p-4 sm:p-5 transition-all duration-200 shadow-xl shadow-black/40">
      {/* Top subtle accent gradient border line */}
      <div className={`absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r ${accentGlow} transition-all rounded-t-xl`}></div>

      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-mono font-medium uppercase tracking-wider text-slate-400">
              {title}
            </span>
            {badgeText && (
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                {badgeText}
              </span>
            )}
            {isDemo && <DemoBadge size="xs" />}
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans">
              {value}
            </span>
            {unit && (
              <span className="text-xs sm:text-sm font-semibold text-emerald-400 font-mono">
                {unit}
              </span>
            )}
          </div>
        </div>

        {Icon && (
          <div className={`p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 shrink-0 transition-transform group-hover:scale-105 ${iconAccent}`}>
            <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        )}
      </div>

      {(subtitle || trend) && (
        <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] gap-2">
          {subtitle && <span className="text-slate-400 truncate">{subtitle}</span>}
          {trend && (
            <span className={`font-mono font-semibold shrink-0 ${trend.startsWith('+') ? 'text-emerald-400' : 'text-slate-300'}`}>
              {trend}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default StatCard;
