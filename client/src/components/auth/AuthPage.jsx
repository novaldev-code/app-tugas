import { useState } from 'react';
import { navigateTo } from '../../routing.js';
import Button from '../ui/Button.jsx';
import Link from '../ui/Link.jsx';

const COPY = {
  login: {
    title: 'Masuk ke workspace',
    subtitle: 'Gunakan email dan password akun Anda.',
    submit: 'Masuk',
    busy: 'Memproses...',
    switchText: 'Belum punya akun?',
    switchLabel: 'Daftar',
    switchHref: '/register',
  },
  register: {
    title: 'Buat akun baru',
    subtitle: 'Akun baru mendapat kategori bawaan Pribadi, Pekerjaan, dan Belajar.',
    submit: 'Daftar',
    busy: 'Memproses...',
    switchText: 'Sudah punya akun?',
    switchLabel: 'Masuk',
    switchHref: '/login',
  },
};

function validate(mode, email, password) {
  const errors = {};

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    errors.email = 'Email tidak valid.';
  }

  if (mode === 'register') {
    if (password.length < 8 || password.length > 128) {
      errors.password = 'Password harus 8-128 karakter.';
    }
  } else if (!password) {
    errors.password = 'Password wajib diisi.';
  }

  return errors;
}

export default function AuthPage({ mode, onLogin, onRegister }) {
  const copy = COPY[mode];
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = validate(mode, email, password);

    setErrors(nextErrors);
    setGeneralError('');

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setBusy(true);

    try {
      if (mode === 'login') {
        await onLogin({ email: email.trim(), password });
      } else {
        await onRegister({ email: email.trim(), password });
      }
    } catch (error) {
      setErrors(error.errors ?? {});
      setGeneralError(error.message || 'Terjadi kesalahan. Coba lagi.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-page">
      <a className="skip-link" href="#auth-main">
        Lewati ke konten utama
      </a>
      <main id="auth-main" className="auth-card" tabIndex={-1}>
        <p className="auth-eyebrow">Manajer Tugas Pribadi</p>
        <h1 className="auth-title">{copy.title}</h1>
        <p className="auth-subtitle">{copy.subtitle}</p>

        {generalError && (
          <p className="alert error" role="alert">
            {generalError}
          </p>
        )}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="field-group">
            <label className="field-label" htmlFor="auth-email">
              Email
            </label>
            <input
              id="auth-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? 'auth-email-error' : undefined}
            />
            {errors.email && (
              <span id="auth-email-error" className="field-error">
                {errors.email}
              </span>
            )}
          </div>

          <div className="field-group">
            <label className="field-label" htmlFor="auth-password">
              Password
            </label>
            <input
              id="auth-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={
                errors.password ? 'auth-password-error' : undefined
              }
            />
            {errors.password && (
              <span id="auth-password-error" className="field-error">
                {errors.password}
              </span>
            )}
          </div>

          <Button type="submit" disabled={busy} className="auth-submit">
            {busy ? copy.busy : copy.submit}
          </Button>
        </form>

        <p className="auth-switch">
          {copy.switchText}{' '}
          <Link
            href={copy.switchHref}
            onClick={(event) => {
              event.preventDefault();
              navigateTo(copy.switchHref);
            }}
          >
            {copy.switchLabel}
          </Link>
        </p>
      </main>
    </div>
  );
}
