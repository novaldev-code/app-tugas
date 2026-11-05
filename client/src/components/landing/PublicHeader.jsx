import { useEffect, useRef, useState } from 'react';
import Brand from '../Brand.jsx';
import Icon from '../Icon.jsx';
import Link from '../ui/Link.jsx';
import { LANDING_NAV_ITEMS } from './navigation.js';
import PublicMobileNav from './PublicMobileNav.jsx';

export default function PublicHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef(null);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (!menuOpen) {
      if (!wasOpenRef.current) {
        return undefined;
      }

      wasOpenRef.current = false;
      const timer = window.setTimeout(() => {
        menuButtonRef.current?.focus({ preventScroll: true });
      }, 0);

      return () => window.clearTimeout(timer);
    }

    wasOpenRef.current = true;

    function handleKeyDown(event) {
      if (event.key !== 'Escape') {
        return;
      }

      event.preventDefault();
      setMenuOpen(false);
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [menuOpen]);

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <header className="landing-header">
      <div className="landing-header-inner">
        <Link href="/" className="landing-brand" aria-label="Manajer Tugas Pribadi">
          <Brand />
        </Link>

        <nav className="landing-nav" aria-label="Navigasi landing">
          {LANDING_NAV_ITEMS.map((item) => (
            <Link key={item.id} href={`#${item.id}`} className="landing-nav-link">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="landing-header-actions">
          <Link href="/login" className="landing-login-link">
            Masuk
          </Link>
          <Link href="/register" className="button button-primary button-small landing-nav-cta">
            Daftar gratis
          </Link>
          <button
            ref={menuButtonRef}
            type="button"
            className="button button-secondary button-small landing-menu-button"
            onClick={() => setMenuOpen((current) => !current)}
            aria-expanded={menuOpen}
            aria-controls="landing-mobile-nav"
          >
            <Icon name={menuOpen ? 'close' : 'menu'} size={18} />
            Menu
          </button>
        </div>
      </div>

      <PublicMobileNav
        open={menuOpen}
        items={LANDING_NAV_ITEMS}
        onClose={closeMenu}
        onNavigate={closeMenu}
      />
    </header>
  );
}
