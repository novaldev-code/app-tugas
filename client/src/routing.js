export const LANDING_PATH = '/';
export const WORKSPACE_PATH = '/app';
export const LOGIN_PATH = '/login';
export const REGISTER_PATH = '/register';

export function normalizePathname(pathname) {
  if (typeof pathname !== 'string' || pathname.trim() === '') {
    return LANDING_PATH;
  }

  const path = pathname.split(/[?#]/, 1)[0] || LANDING_PATH;
  const withLeadingSlash = path.startsWith('/') ? path : `/${path}`;

  if (withLeadingSlash === LANDING_PATH) {
    return LANDING_PATH;
  }

  return withLeadingSlash.replace(/\/+$/, '') || LANDING_PATH;
}

export function getDeploymentMode(flag) {
  return flag === 'true' ? 'public' : 'local';
}

export function getBuildDeploymentMode() {
  return getDeploymentMode(import.meta.env.VITE_PUBLIC_DEPLOYMENT);
}

export function resolveRoute(pathname) {
  const path = normalizePathname(pathname);

  if (path === LANDING_PATH) {
    return { page: 'landing', path: LANDING_PATH };
  }

  if (path === LOGIN_PATH) {
    return { page: 'login', path: LOGIN_PATH };
  }

  if (path === REGISTER_PATH) {
    return { page: 'register', path: REGISTER_PATH };
  }

  if (path === WORKSPACE_PATH) {
    return { page: 'workspace', path: WORKSPACE_PATH };
  }

  return {
    page: 'landing',
    path: LANDING_PATH,
    redirectTo: LANDING_PATH,
  };
}

export function resolveAuthNavigation({
  pathname,
  mode = 'local',
  status = 'loading',
}) {
  const route = resolveRoute(pathname, mode);

  if (
    status === 'authenticated' &&
    (route.page === 'login' || route.page === 'register')
  ) {
    return {
      page: 'workspace',
      path: WORKSPACE_PATH,
      redirectTo: WORKSPACE_PATH,
    };
  }

  if (status === 'unauthenticated' && route.page === 'workspace') {
    return {
      page: 'login',
      path: LOGIN_PATH,
      redirectTo: LOGIN_PATH,
    };
  }

  return route;
}

export function writeHistory(history, path, { replace = false, notify } = {}) {
  const method = replace ? 'replaceState' : 'pushState';
  history[method]({}, '', path);
  notify?.();
}

export function navigateTo(path, { replace = false } = {}) {
  if (typeof window === 'undefined') {
    return false;
  }

  writeHistory(window.history, path, {
    replace,
    notify: () => window.dispatchEvent(new PopStateEvent('popstate')),
  });

  return true;
}
