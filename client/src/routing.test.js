import { describe, expect, it, vi } from 'vitest';
import {
  getDeploymentMode,
  normalizePathname,
  resolveAuthNavigation,
  resolveRoute,
  writeHistory,
} from './routing.js';

describe('normalizePathname', () => {
  it('normalizes root and trailing slashes', () => {
    expect(normalizePathname('')).toBe('/');
    expect(normalizePathname('/')).toBe('/');
    expect(normalizePathname('/app')).toBe('/app');
    expect(normalizePathname('/app/')).toBe('/app');
    expect(normalizePathname('/app///')).toBe('/app');
  });

  it('adds a leading slash and ignores query/hash', () => {
    expect(normalizePathname('app')).toBe('/app');
    expect(normalizePathname('/app?tab=list')).toBe('/app');
    expect(normalizePathname('/app#main-content')).toBe('/app');
  });
});

describe('getDeploymentMode', () => {
  it('treats only the true flag as public', () => {
    expect(getDeploymentMode('true')).toBe('public');
    expect(getDeploymentMode('false')).toBe('local');
    expect(getDeploymentMode(undefined)).toBe('local');
    expect(getDeploymentMode('')).toBe('local');
  });
});

describe('resolveRoute', () => {
  it('resolves public and auth routes', () => {
    expect(resolveRoute('/')).toEqual({ page: 'landing', path: '/' });
    expect(resolveRoute('/login')).toEqual({ page: 'login', path: '/login' });
    expect(resolveRoute('/login/')).toEqual({ page: 'login', path: '/login' });
    expect(resolveRoute('/register')).toEqual({
      page: 'register',
      path: '/register',
    });
    expect(resolveRoute('/app')).toEqual({ page: 'workspace', path: '/app' });
    expect(resolveRoute('/app')).toEqual({ page: 'workspace', path: '/app' });
  });

  it('redirects unknown paths to landing', () => {
    expect(resolveRoute('/unknown')).toEqual({
      page: 'landing',
      path: '/',
      redirectTo: '/',
    });
  });
});

describe('resolveAuthNavigation', () => {
  it('redirects unauthenticated workspace access to login', () => {
    expect(
      resolveAuthNavigation({
        pathname: '/app',
        status: 'unauthenticated',
      }),
    ).toEqual({
      page: 'login',
      path: '/login',
      redirectTo: '/login',
    });
  });

  it('keeps unauthenticated users on auth pages', () => {
    expect(
      resolveAuthNavigation({ pathname: '/login', status: 'unauthenticated' }),
    ).toEqual({ page: 'login', path: '/login' });
    expect(
      resolveAuthNavigation({
        pathname: '/register',
        status: 'unauthenticated',
      }),
    ).toEqual({ page: 'register', path: '/register' });
  });

  it('allows authenticated users into the workspace', () => {
    expect(
      resolveAuthNavigation({ pathname: '/app', status: 'authenticated' }),
    ).toEqual({ page: 'workspace', path: '/app' });
  });

  it('redirects authenticated users away from login and register', () => {
    expect(
      resolveAuthNavigation({ pathname: '/login', status: 'authenticated' }),
    ).toEqual({
      page: 'workspace',
      path: '/app',
      redirectTo: '/app',
    });
    expect(
      resolveAuthNavigation({
        pathname: '/register',
        status: 'authenticated',
      }),
    ).toEqual({
      page: 'workspace',
      path: '/app',
      redirectTo: '/app',
    });
  });

  it('keeps landing accessible in every auth state', () => {
    for (const status of ['loading', 'authenticated', 'unauthenticated']) {
      expect(resolveAuthNavigation({ pathname: '/', status })).toEqual({
        page: 'landing',
        path: '/',
      });
    }
  });

  it('does not redirect while auth status is loading', () => {
    expect(
      resolveAuthNavigation({ pathname: '/app', status: 'loading' }),
    ).toEqual({ page: 'workspace', path: '/app' });
  });
});

describe('writeHistory', () => {
  it('pushes and replaces paths without reloading', () => {
    const history = {
      pushState: vi.fn(),
      replaceState: vi.fn(),
    };
    const notify = vi.fn();

    writeHistory(history, '/app', { notify });
    writeHistory(history, '/', { replace: true, notify });

    expect(history.pushState).toHaveBeenCalledWith({}, '', '/app');
    expect(history.replaceState).toHaveBeenCalledWith({}, '', '/');
    expect(notify).toHaveBeenCalledTimes(2);
  });
});
