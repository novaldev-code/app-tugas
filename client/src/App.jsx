import { useEffect, useRef } from 'react';
import AppWorkspace from './AppWorkspace.jsx';
import { useAuth } from './auth/useAuth.js';
import AuthPage from './components/auth/AuthPage.jsx';
import LandingPage from './components/landing/LandingPage.jsx';
import usePathname from './hooks/usePathname.js';
import {
  getBuildDeploymentMode,
  navigateTo,
  resolveAuthNavigation,
} from './routing.js';

const deploymentMode = getBuildDeploymentMode();

const MAIN_IDS = {
  landing: 'landing-main',
  workspace: 'main-content',
  login: 'auth-main',
  register: 'auth-main',
};

export default function App() {
  const pathname = usePathname();
  const auth = useAuth();
  const route = resolveAuthNavigation({
    pathname,
    mode: deploymentMode,
    status: auth.status,
  });
  const redirectTo = route.redirectTo;
  const previousPageRef = useRef(route.page);

  useEffect(() => {
    if (redirectTo && window.location.pathname !== redirectTo) {
      navigateTo(redirectTo, { replace: true });
    }
  }, [redirectTo, pathname]);

  useEffect(() => {
    const main = document.getElementById(MAIN_IDS[route.page] ?? 'landing-main');

    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });

    if (previousPageRef.current === route.page) {
      return;
    }

    previousPageRef.current = route.page;
    main?.focus({ preventScroll: true });
  }, [route.page]);

  const isAuthLoading =
    auth.status === 'loading' &&
    (route.page === 'workspace' ||
      route.page === 'login' ||
      route.page === 'register');

  if (isAuthLoading) {
    return (
      <div className="auth-loading" role="status">
        Memeriksa sesi...
      </div>
    );
  }

  if (route.page === 'login' || route.page === 'register') {
    return (
      <AuthPage
        mode={route.page}
        onLogin={auth.login}
        onRegister={auth.register}
      />
    );
  }

  if (route.page === 'workspace') {
    return <AppWorkspace user={auth.user} onLogout={auth.logout} />;
  }

  return <LandingPage />;
}
