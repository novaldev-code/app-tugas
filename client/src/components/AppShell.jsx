import { useEffect, useState } from 'react';
import { NAV_ITEMS } from '../navigation.js';
import { getSidebarCollapsed, setSidebarCollapsed } from '../utils/storage.js';
import Icon from './Icon.jsx';
import MobileDrawer from './MobileDrawer.jsx';
import Sidebar from './Sidebar.jsx';

export default function AppShell({
  view,
  onViewChange,
  header,
  actions,
  children,
}) {
  const [collapsed, setCollapsed] = useState(() => getSidebarCollapsed());
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setSidebarCollapsed(collapsed);
  }, [collapsed]);

  useEffect(() => {
    if (drawerOpen) {
      document.body.classList.add('drawer-open');
    } else {
      document.body.classList.remove('drawer-open');
    }

    return () => {
      document.body.classList.remove('drawer-open');
    };
  }, [drawerOpen]);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setDrawerOpen(false);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  function handleViewChange(nextView) {
    onViewChange(nextView);
    setDrawerOpen(false);
  }

  return (
    <div className={`app-shell ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <a className="skip-link" href="#main-content">
        Lewati ke konten utama
      </a>

      <Sidebar
        items={NAV_ITEMS}
        activeView={view}
        collapsed={collapsed}
        onToggle={() => setCollapsed((current) => !current)}
        onNavigate={handleViewChange}
      />

      <header className="app-header">
        <div className="header-group">
          <button
            type="button"
            className="button button-ghost button-icon mobile-menu-button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Buka navigasi"
            aria-expanded={drawerOpen}
            aria-controls="mobile-drawer"
          >
            <Icon name="menu" />
          </button>
          <div className="header-title-group">
            {header}
          </div>
        </div>
        <div className="header-group">{actions}</div>
      </header>

      <main id="main-content" className="app-main">
        {children}
      </main>

      <MobileDrawer
        open={drawerOpen}
        items={NAV_ITEMS}
        activeView={view}
        onClose={() => setDrawerOpen(false)}
        onNavigate={handleViewChange}
      />
    </div>
  );
}
