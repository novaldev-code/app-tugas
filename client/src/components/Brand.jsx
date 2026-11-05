export default function Brand({ collapsed = false, className = '' }) {
  return (
    <div className={`brand ${className}`.trim()}>
      <span className="brand-mark" aria-hidden="true">
        MT
      </span>
      {!collapsed && (
        <div className="brand-text">
          <span className="brand-title">Manajer Tugas</span>
          <span className="brand-subtitle">Pribadi</span>
        </div>
      )}
    </div>
  );
}
