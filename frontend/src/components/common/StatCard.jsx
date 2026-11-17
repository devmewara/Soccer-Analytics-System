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
  accentColor = 'emerald',
}) => {
  return (
    <div className="relative group bg-[#0D131F] border border-slate-800 hover:border-emerald-500/40 rounded-xl p-5 transition-all duration-200 shadow-lg shadow-black/30">
      {/* Subtle top glow line */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent group-hover:via-emerald-400 transition-all"></div>

      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400 font-mono">
              {title}
            </span>
            {isDemo && <DemoBadge size="xs" />}
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {value}
            </span>
            {unit && <span className="text-sm font-semibold text-emerald-400 font-mono">{unit}</span>}
          </div>
        </div>

        {Icon && (
          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-emerald-400 group-hover:scale-110 group-hover:border-emerald-500/40 transition-all">
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {(subtitle || trend) && (
        <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
          {subtitle && <span className="text-slate-400">{subtitle}</span>}
          {trend && (
            <span className={`font-mono font-medium ${trend.startsWith('+') ? 'text-emerald-400' : 'text-slate-400'}`}>
              {trend}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default StatCard;
