export function SkeletonLine({ className = '' }) {
  return <div className={`skeleton skeleton-line ${className}`.trim()} />;
}

export function SkeletonCard({ className = '' }) {
  return <div className={`skeleton skeleton-card ${className}`.trim()} />;
}

export function SkeletonKPI({ className = '' }) {
  return <div className={`skeleton skeleton-kpi ${className}`.trim()} />;
}
