import Brand from '../Brand.jsx';
import Link from '../ui/Link.jsx';

const PRODUCT_LINKS = [
  { href: '#preview', label: 'Preview' },
  { href: '#fitur', label: 'Fitur' },
  { href: '#cara-kerja', label: 'Cara Kerja' },
];

const EXPLORE_LINKS = [
  { href: '#keunggulan', label: 'Keunggulan' },
  { href: '#pricing', label: 'Harga' },
  { href: '#faq', label: 'FAQ' },
];

const ACCOUNT_LINKS = [
  { href: '/login', label: 'Masuk' },
  { href: '/register', label: 'Daftar gratis' },
];

export default function PublicFooter() {
  return (
    <footer className="landing-footer">
      <div className="landing-footer-inner">
        <div className="landing-footer-brand">
          <Link href="/" className="landing-brand" aria-label="Manajer Tugas Pribadi">
            <Brand />
          </Link>
          <p>
            Ruang kerja pribadi untuk merapikan tugas, memantau progres, dan
            menjaga prioritas tetap terlihat.
          </p>
          <div className="landing-footer-auth">
            <Link href="/register" className="button button-primary button-small">
              Daftar gratis
            </Link>
            <Link href="/login" className="landing-footer-login">
              Masuk
            </Link>
          </div>
        </div>

        <div className="landing-footer-columns">
          <nav className="landing-footer-nav" aria-label="Navigasi produk">
            <span className="landing-footer-heading">Produk</span>
            {PRODUCT_LINKS.map((item) => (
              <Link key={item.href} href={item.href} className="landing-footer-link">
                {item.label}
              </Link>
            ))}
          </nav>

          <nav className="landing-footer-nav" aria-label="Navigasi informasi">
            <span className="landing-footer-heading">Jelajahi</span>
            {EXPLORE_LINKS.map((item) => (
              <Link key={item.href} href={item.href} className="landing-footer-link">
                {item.label}
              </Link>
            ))}
          </nav>

          <nav className="landing-footer-nav" aria-label="Navigasi akun">
            <span className="landing-footer-heading">Akun</span>
            {ACCOUNT_LINKS.map((item) => (
              <Link key={item.href} href={item.href} className="landing-footer-link">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      <div className="landing-footer-bottom">
        <p>© {new Date().getFullYear()} Manajer Tugas Pribadi</p>
        <p>Landing page publik. Workspace tersedia setelah masuk atau daftar.</p>
      </div>
    </footer>
  );
}
