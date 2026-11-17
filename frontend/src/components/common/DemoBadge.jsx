import React from 'react';

export const DemoBadge = ({ size = 'sm', className = '' }) => {
  const sizeClasses = size === 'xs' 
    ? 'text-[9px] px-1.5 py-0.5' 
    : 'text-[10px] px-2 py-0.5';

  return (
    <span 
      className={`inline-flex items-center gap-1 font-mono font-semibold uppercase tracking-wider rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/30 ${sizeClasses} ${className}`}
      title="This metric contains simulated sample data for UI layout and workflow verification"
    >
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
      Demo Data
    </span>
  );
};

export default DemoBadge;
