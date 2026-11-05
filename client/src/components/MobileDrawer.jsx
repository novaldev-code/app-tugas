import { useEffect, useRef } from 'react';
import Brand from './Brand.jsx';
import Icon from './Icon.jsx';

const FOCUSABLE_SELECTORS = [
  'a[href]',
  'button:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export default function MobileDrawer({
  open,
  items,
  activeView,
  onClose,
  onNavigate,
  user,
  onLogout,
  logoutBusy,
  logoutError,
}) {
  const drawerRef = useRef(null);
  const previouslyFocusedRef = useRef(null);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    previouslyFocusedRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    const drawer = drawerRef.current;
    if (!drawer) {
      return undefined;
    }

    const focusable = Array.from(drawer.querySelectorAll(FOCUSABLE_SELECTORS)).filter(
      (element) => element instanceof HTMLElement,
    );

    if (focusable.length > 0) {
      focusable[0].focus({ preventScroll: true });
    } else {
      drawer.focus({ preventScroll: true });
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== 'Tab') {
        return;
      }

      const elements = Array.from(drawer.querySelectorAll(FOCUSABLE_SELECTORS)).filter(
        (element) => element instanceof HTMLElement,
      );

      if (elements.length === 0) {
        event.preventDefault();
        return;
      }

      const first = elements[0];
      const last = elements[elements.length - 1];
      const activeElement = document.activeElement;

      if (event.shiftKey) {
        if (activeElement === first || !drawer.contains(activeElement)) {
          event.preventDefault();
          last.focus();
        }
        return;
      }

      if (activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      const previous = previouslyFocusedRef.current;
      if (previous && typeof previous.focus === 'function') {
        previous.focus({ preventScroll: true });
      }
    };
  }, [open, onClose]);

  return (
    <>
      <div
        className={`drawer-backdrop${open ? ' open' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        id="mobile-drawer"
        ref={drawerRef}
        className={`mobile-drawer${open ? ' open' : ''}`}
        aria-label="Navigasi utama"
        aria-modal="true"
        role="dialog"
        tabIndex={-1}
      >
        <div className="sidebar-header">
          <Brand />
          <button
            type="button"
            className="sidebar-toggle"
            onClick={onClose}
            aria-label="Tutup navigasi"
          >
            <Icon name="close" />
          </button>
        </div>

        <nav className="sidebar-nav">
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
              <span className="sidebar-link-label">{item.label}</span>
            </button>
          ))}
        </nav>

        {user && (
          <div className="sidebar-footer">
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
          </div>
        )}
      </aside>
    </>
  );
}
