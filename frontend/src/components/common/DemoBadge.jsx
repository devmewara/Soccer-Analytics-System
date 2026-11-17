import React from 'react';

export const DemoBadge = ({ size = 'sm', label = 'DEMO DATA', className = '' }) => {
  const sizeClasses = size === 'xs'
    ? 'text-[9px] px-1.5 py-0.5'
    : 'text-[10px] px-2 py-0.5';

  return (
    <span
      className={`inline-flex items-center gap-1 font-mono font-medium tracking-wide rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 ${sizeClasses} ${className}`}
      title="This dataset contains modeled sample data for UI & tactical layout evaluation"
    >
      <span className="w-1 h-1 rounded-full bg-amber-400"></span>
      {label}
    </span>
  );
};

export default DemoBadge;
