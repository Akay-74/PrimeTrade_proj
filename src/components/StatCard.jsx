import React from 'react';

const StatCard = ({ title, value, subtitle, colorClass, glow, icon }) => {
  return (
    <div
      className={`glass-card glass-hover flex flex-col justify-between border transform transition-transform duration-150 hover:scale-[1.01] ${
        glow || ''
      }`}
    >
      <div className="flex items-start justify-between mb-1">
        <div className="label-xs text-text-secondary">{title}</div>
        {icon && <div className="text-text-secondary">{icon}</div>}
      </div>
      <div className={`mono text-xl font-semibold ${colorClass}`}>{value}</div>
      {subtitle && (
        <div className="text-[11px] text-text-secondary mt-1">{subtitle}</div>
      )}
    </div>
  );
};

export default StatCard;

