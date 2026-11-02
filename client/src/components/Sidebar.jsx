import Icon from './Icon.jsx';

export default function Sidebar({
  items,
  activeView,
  collapsed,
  onToggle,
  onNavigate,
}) {
  return (
    <aside className="sidebar" aria-label="Navigasi utama">
      <div className="sidebar-header">
        <div className="brand">
          <span className="brand-mark">MT</span>
          {!collapsed && (
            <div className="brand-text">
              <span className="brand-title">Manajer Tugas</span>
              <span className="brand-subtitle">Pribadi</span>
            </div>
          )}
        </div>
        <button
          type="button"
          className="sidebar-toggle"
          onClick={ontoggle}
          aria-label={collapsed ? 'Buka sidebar' : 'Tutup sidebar'}
          aria-expanded={!collapsed}
          aria-controls="sidebar-nav"
        >
          <Icon name={collapsed ? 'chevron-right' : 'chevron-left'} />
        </button>
      </div>

        <nav id="sidebar-nav" className="sidebar-nav" aria-label="Navigasi utama">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`sidebar-link${activeView === item.id ? ' active' : ''}`}
            onClick={() => onNavigate(item.id)}
            aria-current={activeView === item.id ? 'page' : undefined}
          >
            <span className="sidebar-link-icon">
              <Icon name={item.icon} />
            </span>
            {!collapsed && <span className="sidebar-link-label">{item.label}</span>}
          </button>
        ))}
      </nav>

      {!collapsed && (
        <div className="sidebar-footer"> 
        </div>
      )}
    </aside>
  );
}
