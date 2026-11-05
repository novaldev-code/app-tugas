import Icon from '../Icon.jsx';
import Link from '../ui/Link.jsx';
import {
  ADVANTAGES,
  FAQS,
  FEATURES,
  HERO_POINTS,
  STEPS,
} from './content.js';
import { FeatureVisual } from './FeatureVisuals.jsx';
import ProductPreview from './ProductPreview.jsx';
import PublicFooter from './PublicFooter.jsx';
import PublicHeader from './PublicHeader.jsx';

function CheckIcon() {
  return (
    <svg
      className="landing-check-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m20 6-11 11-5-5" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

export default function LandingPage() {
  return (
    <div className="landing-page">
      <a className="skip-link" href="#landing-main">
        Lewati ke konten utama
      </a>

      <PublicHeader />

      <main id="landing-main" className="landing-main" tabIndex={-1}>
        <section className="landing-hero" aria-labelledby="landing-hero-title">
          <div className="landing-hero-glow" aria-hidden="true" />
          <div className="landing-hero-grid" aria-hidden="true" />

          <div className="landing-hero-content">
            <p className="landing-pill">
              <span className="landing-pill-dot" aria-hidden="true" />
              Personal Task Manager
            </p>
            <h1 id="landing-hero-title">
              Rapikan hari Anda.
              <span className="landing-gradient-text">
                Fokus pada yang penting.
              </span>
            </h1>
            <p className="landing-lead">
              Satu ruang tenang untuk tugas, kategori, prioritas, dan progres.
              Dirancang agar Anda tahu apa yang perlu dikerjakan berikutnya.
            </p>

            <div className="landing-actions">
              <Link href="#preview" className="button button-primary landing-button-lg">
                Lihat preview
                <ArrowIcon />
              </Link>
              <Link href="/register" className="button button-secondary landing-button-lg">
                Daftar gratis
              </Link>
            </div>

            <p className="landing-auth-line">
              Sudah punya akun? <Link href="/login">Masuk ke workspace</Link>
            </p>

            <ul className="landing-trust">
              {HERO_POINTS.map((point) => (
                <li key={point}>
                  <CheckIcon />
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section
          id="preview"
          className="landing-section landing-preview-section"
          aria-labelledby="landing-preview-title"
        >
          <div className="landing-section-heading landing-section-heading-center">
            <p className="landing-eyebrow">Product preview</p>
            <h2 id="landing-preview-title">
              Ketahui ritme kerja Anda dalam satu pandang.
            </h2>
            <p>
              Dashboard, daftar tugas, Kanban, dan kategori bekerja bersama
              tanpa membuat layar terasa penuh.
            </p>
          </div>
          <ProductPreview />
        </section>

        <section
          id="fitur"
          className="landing-section"
          aria-labelledby="landing-features-title"
        >
          <div className="landing-section-heading landing-section-heading-split">
            <div>
              <p className="landing-eyebrow">Fitur</p>
              <h2 id="landing-features-title">Alat inti yang saling terhubung.</h2>
            </div>
            <p>
              Setiap tampilan dibuat untuk satu tujuan: membuat pekerjaan
              pribadi terasa lebih ringan dan terarah.
            </p>
          </div>

          <div className="landing-bento">
            {FEATURES.map((feature, index) => (
              <article
                className={`landing-feature landing-feature-${index + 1} landing-tone-${feature.accent}`}
                key={feature.title}
              >
                <div className="landing-feature-top">
                  <span className="landing-feature-icon">
                    <Icon name={feature.icon} size={20} />
                  </span>
                  <span className="landing-feature-label">{feature.label}</span>
                </div>
                <div className="landing-feature-copy">
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </div>
                {feature.visual && <FeatureVisual type={feature.visual} />}
              </article>
            ))}
          </div>
        </section>

        <section
          id="cara-kerja"
          className="landing-section"
          aria-labelledby="landing-how-title"
        >
          <div className="landing-section-heading landing-section-heading-center">
            <p className="landing-eyebrow">Cara kerja</p>
            <h2 id="landing-how-title">Dari daftar menjadi ritme yang jelas.</h2>
            <p>
              Tiga langkah sederhana untuk mengubah tugas yang berserakan
              menjadi rencana yang bisa dijalankan.
            </p>
          </div>

          <ol className="landing-steps">
            {STEPS.map((step) => (
              <li className="landing-step" key={step.number}>
                <div className="landing-step-top">
                  <span className="landing-step-number" aria-hidden="true">
                    {step.number}
                  </span>
                  <span className="landing-step-label">{step.label}</span>
                </div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </li>
            ))}
          </ol>
        </section>

        <section
          id="keunggulan"
          className="landing-section"
          aria-labelledby="landing-advantage-title"
        >
          <div className="landing-advantage-shell">
            <div className="landing-advantage-copy">
              <p className="landing-eyebrow">Keunggulan</p>
              <h2 id="landing-advantage-title">
                Dibangun untuk fokus, bukan untuk keramaian.
              </h2>
              <p>
                Pengalaman yang konsisten untuk setiap akun, dengan ruang yang
                cukup untuk hal-hal yang benar-benar penting.
              </p>
              <Link href="/register" className="button button-primary">
                Mulai gratis
                <ArrowIcon />
              </Link>
            </div>

            <div className="landing-advantage-list">
              {ADVANTAGES.map((advantage) => (
                <article className="landing-advantage-item" key={advantage.title}>
                  <span className="landing-advantage-icon">
                    <Icon name={advantage.icon} size={20} />
                  </span>
                  <div>
                    <span className="landing-advantage-label">
                      {advantage.label}
                    </span>
                    <h3>{advantage.title}</h3>
                    <p>{advantage.description}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          id="pricing"
          className="landing-section"
          aria-labelledby="landing-pricing-title"
        >
          <div className="landing-section-heading landing-section-heading-center">
            <p className="landing-eyebrow">Harga</p>
            <h2 id="landing-pricing-title">Satu paket. Tanpa pembayaran.</h2>
            <p>
              Semua fitur yang tersedia saat ini dapat digunakan tanpa biaya.
            </p>
          </div>

          <div className="landing-price-card">
            <div className="landing-price-copy">
              <span className="landing-price-badge">Gratis selamanya</span>
              <p className="landing-price">Rp0</p>
              <p>
                Satu paket untuk mengelola tugas pribadi. Tidak ada tingkatan
                harga atau alur pembayaran.
              </p>
              <Link href="/register" className="button button-primary">
                Daftar gratis
              </Link>
              <span className="landing-price-note">Tanpa kartu kredit</span>
            </div>

            <ul className="landing-checklist">
              {[
                'Dashboard ringkasan pribadi',
                'Daftar tugas dengan pencarian dan filter',
                'Kanban dengan seret dan letakkan',
                'Kategori yang dapat dikelola',
                'Data terpisah untuk setiap akun',
              ].map((item) => (
                <li key={item}>
                  <CheckIcon />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section
          id="faq"
          className="landing-section"
          aria-labelledby="landing-faq-title"
        >
          <div className="landing-faq-layout">
            <div className="landing-section-heading">
              <p className="landing-eyebrow">FAQ</p>
              <h2 id="landing-faq-title">Pertanyaan yang sering muncul.</h2>
              <p>
                Status produk disampaikan apa adanya, termasuk batas akses saat
                ini.
              </p>
              <Link href="/register" className="landing-inline-link">
                Mulai sekarang
                <ArrowIcon />
              </Link>
            </div>

            <div className="landing-faq-list">
              {FAQS.map((faq) => (
                <details className="landing-faq-item" key={faq.question}>
                  <summary>
                    <span>{faq.question}</span>
                    <span className="landing-faq-marker" aria-hidden="true" />
                  </summary>
                  <p>{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section
          id="cta"
          className="landing-section landing-cta"
          aria-labelledby="landing-cta-title"
        >
          <div className="landing-cta-glow" aria-hidden="true" />
          <div className="landing-cta-content">
            <p className="landing-eyebrow">Mulai dari satu langkah</p>
            <h2 id="landing-cta-title">Beri ruang untuk hal yang penting.</h2>
            <p>
              Buat akun gratis dan susun hari Anda dengan ritme yang lebih
              tenang.
            </p>
          </div>
          <div className="landing-cta-actions">
            <Link href="/register" className="button button-primary landing-button-lg">
              Daftar gratis
              <ArrowIcon />
            </Link>
            <Link href="/login" className="button button-secondary landing-button-lg">
              Masuk
            </Link>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
