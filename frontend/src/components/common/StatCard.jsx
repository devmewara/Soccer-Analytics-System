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
  badgeText,
}) => {
  return (
    <div className="bg-[#101722] border border-[#253244] hover:border-slate-600 rounded-xl p-4 sm:p-5 transition-colors shadow-panel">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-mono font-medium uppercase tracking-wider text-slate-400">
              {title}
            </span>
            {badgeText && (
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#17212E] text-slate-300 border border-[#253244]">
                {badgeText}
              </span>
            )}
            {isDemo && <DemoBadge size="xs" />}
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-sans">
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
          <div className="p-2.5 rounded-xl bg-[#17212E] border border-[#253244] text-slate-300 shrink-0">
            <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
          </div>
        )}
      </div>

      {(subtitle || trend) && (
        <div className="mt-3 pt-3 border-t border-[#1C2634] flex items-center justify-between text-[11px] gap-2">
          {subtitle && <span className="text-slate-400 truncate">{subtitle}</span>}
          {trend && (
            <span className="font-mono font-medium text-emerald-400 shrink-0">
              {trend}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default StatCard;
