import React from 'react';

const Skeleton = ({ className = '', count = 1 }) => (
  <>
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        className={`animate-pulse rounded-lg bg-[rgba(255,255,255,0.04)] ${className}`}
      />
    ))}
  </>
);

export const CardSkeleton = () => (
  <div className="glass-card space-y-3">
    <Skeleton className="h-3 w-24" />
    <Skeleton className="h-6 w-32" />
    <Skeleton className="h-2 w-20" />
  </div>
);

export const TableSkeleton = ({ rows = 5 }) => (
  <div className="glass-card space-y-3">
    <Skeleton className="h-8 w-full" />
    {Array.from({ length: rows }).map((_, i) => (
      <Skeleton key={i} className="h-10 w-full" />
    ))}
  </div>
);

export default Skeleton;
