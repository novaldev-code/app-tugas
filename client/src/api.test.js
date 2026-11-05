import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  api,
  getCsrfToken,
  normalizeApiBaseUrl,
  resolveApiUrl,
  setAuthExpiredHandler,
  setCsrfToken,
} from './api.js';

afterEach(() => {
  vi.unstubAllGlobals();
  setAuthExpiredHandler(null);
  setCsrfToken('');
});

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('normalizeApiBaseUrl', () => {
  it('returns an empty string for missing values', () => {
    expect(normalizeApiBaseUrl()).toBe('');
    expect(normalizeApiBaseUrl(null)).toBe('');
    expect(normalizeApiBaseUrl('   ')).toBe('');
  });

  it('trims whitespace and removes trailing slashes', () => {
    expect(normalizeApiBaseUrl(' https://api.example.com/ ')).toBe(
      'https://api.example.com',
    );
    expect(normalizeApiBaseUrl('https://api.example.com///')).toBe(
      'https://api.example.com',
    );
    expect(normalizeApiBaseUrl('/')).toBe('');
  });
});

describe('resolveApiUrl', () => {
  it('keeps paths relative when no base URL is configured', () => {
    expect(resolveApiUrl('/api/tasks')).toBe('/api/tasks');
    expect(resolveApiUrl('/api/tasks', '')).toBe('/api/tasks');
    expect(resolveApiUrl('/api/tasks', '   ')).toBe('/api/tasks');
  });

  it('joins an absolute base URL without duplicating slashes', () => {
    expect(resolveApiUrl('/api/tasks', 'https://api.example.com')).toBe(
      'https://api.example.com/api/tasks',
    );
    expect(resolveApiUrl('/api/tasks', 'https://api.example.com/')).toBe(
      'https://api.example.com/api/tasks',
    );
    expect(resolveApiUrl('api/tasks', 'https://api.example.com///')).toBe(
      'https://api.example.com/api/tasks',
    );
  });
});

describe('api client authentication', () => {
  it('sends credentials and the CSRF token on mutations', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({ success: true, data: { id: 1 } }),
    );
    vi.stubGlobal('fetch', fetchMock);
    setCsrfToken('csrf-token');

    await api.createTask({ title: 'Tugas' });

    const [, options] = fetchMock.mock.calls[0];
    expect(options.credentials).toBe('include');
    expect(options.headers['X-CSRF-Token']).toBe('csrf-token');
  });

  it('does not send a CSRF header on GET requests', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse({ success: true, data: [] }));
    vi.stubGlobal('fetch', fetchMock);
    setCsrfToken('csrf-token');

    await api.listTasks({});

    const [, options] = fetchMock.mock.calls[0];
    expect(options.headers['X-CSRF-Token']).toBeUndefined();
  });

  it('stores the CSRF token returned by login and me', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          success: true,
          data: { user: { id: 'u1' }, csrf_token: 'login-csrf' },
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          success: true,
          data: { user: { id: 'u1' }, csrf_token: 'me-csrf' },
        }),
      );
    vi.stubGlobal('fetch', fetchMock);

    await api.login({ email: 'a@example.com', password: 'password123' });
    expect(getCsrfToken()).toBe('login-csrf');

    await api.me();
    expect(getCsrfToken()).toBe('me-csrf');
  });

  it('clears the token and notifies on a 401 for data requests', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse(
        { success: false, message: 'Sesi tidak valid.', errors: {} },
        401,
      ),
    );
    vi.stubGlobal('fetch', fetchMock);
    const expired = vi.fn();
    setAuthExpiredHandler(expired);
    setCsrfToken('csrf-token');

    await expect(api.listTasks({})).rejects.toMatchObject({ status: 401 });

    expect(expired).toHaveBeenCalledTimes(1);
    expect(getCsrfToken()).toBe('');
  });

  it('does not notify on a 401 from login', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse(
        { success: false, message: 'Email atau password salah.', errors: {} },
        401,
      ),
    );
    vi.stubGlobal('fetch', fetchMock);
    const expired = vi.fn();
    setAuthExpiredHandler(expired);

    await expect(
      api.login({ email: 'a@example.com', password: 'wrong' }),
    ).rejects.toMatchObject({ status: 401 });

    expect(expired).not.toHaveBeenCalled();
  });

  it('clears the CSRF token on logout', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse({ success: true, data: {} }));
    vi.stubGlobal('fetch', fetchMock);
    setCsrfToken('csrf-token');

    await api.logout();

    expect(getCsrfToken()).toBe('');
  });
});
