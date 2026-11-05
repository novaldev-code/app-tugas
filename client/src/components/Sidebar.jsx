import Brand from './Brand.jsx';
import Icon from './Icon.jsx';

export default function Sidebar({
  items,
  activeView,
  collapsed,
  onToggle,
  onNavigate,
  user,
  onLogout,
  logoutBusy,
  logoutError,
}) {
  return (
    <aside className="sidebar" aria-label="Navigasi utama">
      <div className="sidebar-header">
        <Brand collapsed={collapsed} />
        <button
          type="button"
          className="sidebar-toggle"
          onClick={onToggle}
          aria-label={collapsed ? 'Buka sidebar' : 'Tutup sidebar'}
          aria-expanded={!collapsed}
          aria-controls="sidebar-nav"
        >
          <Icon name={collapsed ? 'chevronRight' : 'chevronLeft'} />
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

      <div className="sidebar-footer">
        {user &&
          (collapsed ? (
            <button
              type="button"
              className="button button-secondary button-small sidebar-logout-icon"
              onClick={onLogout}
              disabled={logoutBusy}
              aria-label="Keluar"
              title="Keluar"
            >
              Keluar
            </button>
          ) : (
            <div className="sidebar-user">
              <span className="sidebar-user-email" title={user.email}>
                {user.email}
              </span>
              <button
                type="button"
                className="button button-secondary button-small sidebar-logout"
                onClick={onLogout}
                disabled={logoutBusy}
              >
                {logoutBusy ? 'Keluar...' : 'Keluar'}
              </button>
              {logoutError && (
                <span className="sidebar-logout-error" role="alert">
                  {logoutError}
                </span>
              )}
            </div>
          ))}
      </div>
    </aside>
  );
}
