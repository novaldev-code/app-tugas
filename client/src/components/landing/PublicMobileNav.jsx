import { useEffect, useRef } from 'react';
import Link from '../ui/Link.jsx';

export default function PublicMobileNav({ open, items, onClose, onNavigate }) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const firstTarget = panelRef.current?.querySelector('a, button');
    firstTarget?.focus({ preventScroll: true });

    return undefined;
  }, [open]);

  return (
    <nav
      id="landing-mobile-nav"
      ref={panelRef}
      className={`landing-mobile-nav${open ? ' open' : ''}`}
      aria-label="Navigasi landing mobile"
      hidden={!open}
    >
      <ul className="landing-mobile-nav-list">
        {items.map((item) => (
          <li key={item.id}>
            <Link
              href={`#${item.id}`}
              className="landing-mobile-link"
              onClick={onNavigate}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>

      <div className="landing-mobile-actions">
        <Link
          href="/login"
          className="button button-secondary"
          onClick={onNavigate}
        >
          Masuk
        </Link>
        <Link
          href="/register"
          className="button button-primary"
          onClick={onNavigate}
        >
          Daftar gratis
        </Link>
      </div>

      <button
        type="button"
        className="landing-mobile-close"
        onClick={onClose}
      >
        Tutup menu
      </button>
    </nav>
  );
}
