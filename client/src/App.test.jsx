// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const { apiMock, setCsrfTokenMock, setAuthExpiredHandlerMock } = vi.hoisted(() => ({
  apiMock: {
    me: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    listCategories: vi.fn(),
    getStats: vi.fn(),
    listTasks: vi.fn(),
    createTask: vi.fn(),
    updateTask: vi.fn(),
    deleteTask: vi.fn(),
    createCategory: vi.fn(),
    updateCategory: vi.fn(),
    deleteCategory: vi.fn(),
  },
  setCsrfTokenMock: vi.fn(),
  setAuthExpiredHandlerMock: vi.fn(),
}));

vi.mock('./api.js', () => ({
  api: apiMock,
  setCsrfToken: setCsrfTokenMock,
  setAuthExpiredHandler: setAuthExpiredHandlerMock,
}));

import App from './App.jsx';

const user = { id: 'user-1', email: 'user@example.com' };
let authExpiredHandler = null;

function setPath(path) {
  window.history.replaceState({}, '', path);
}

function mockWorkspaceData() {
  apiMock.listCategories.mockResolvedValue([
    { id: 1, name: 'Pribadi', is_default: true, sort_order: 1 },
  ]);
  apiMock.getStats.mockResolvedValue({
    total: 0,
    byStatus: { Todo: 0, 'In Progress': 0, Done: 0 },
    byPriority: { Low: 0, Medium: 0, High: 0, Urgent: 0 },
  });
  apiMock.listTasks.mockResolvedValue([]);
}

function authenticatedSession() {
  return { user, csrf_token: 'csrf-token' };
}

function unauthenticated() {
  return Object.assign(new Error('Sesi tidak valid.'), { status: 401 });
}

beforeEach(() => {
  vi.clearAllMocks();
  window.scrollTo = vi.fn();
  authExpiredHandler = null;
  setAuthExpiredHandlerMock.mockImplementation((handler) => {
    authExpiredHandler = handler;
  });
  mockWorkspaceData();
  setPath('/');
});

afterEach(() => {
  cleanup();
  setPath('/');
});

describe('authentication routing', () => {
  it('redirects unauthenticated /app visits to /login without mounting the workspace', async () => {
    apiMock.me.mockRejectedValue(unauthenticated());
    setPath('/app');

    render(<App />);

    expect(screen.getByRole('status').textContent).toContain('Memeriksa sesi');
    await screen.findByRole('heading', { name: 'Masuk ke workspace' });
    await waitFor(() => expect(window.location.pathname).toBe('/login'));
    expect(screen.queryByText('Dashboard')).toBeNull();
  });

  it('does not redirect while the initial session check is loading', async () => {
    let resolveMe;
    apiMock.me.mockReturnValue(
      new Promise((resolve) => {
        resolveMe = resolve;
      }),
    );
    setPath('/app');

    render(<App />);

    expect(screen.getByRole('status').textContent).toContain('Memeriksa sesi');
    expect(window.location.pathname).toBe('/app');

    resolveMe(authenticatedSession());

    await screen.findByRole('heading', { name: 'Dashboard' });
    expect(window.location.pathname).toBe('/app');
  });

  it('keeps the user on /login when login fails', async () => {
    apiMock.me.mockRejectedValue(unauthenticated());
    apiMock.login.mockRejectedValue(
      Object.assign(new Error('Email atau password salah.'), {
        status: 401,
        errors: {},
      }),
    );
    setPath('/login');

    render(<App />);

    await screen.findByRole('heading', { name: 'Masuk ke workspace' });
    await userEvent.type(screen.getByLabelText('Email'), 'user@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'wrong');
    await userEvent.click(screen.getByRole('button', { name: 'Masuk' }));

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain('Email atau password salah.');
    expect(window.location.pathname).toBe('/login');
    expect(screen.queryByText('Dashboard')).toBeNull();
  });

  it('keeps the user on /register when registration fails', async () => {
    apiMock.me.mockRejectedValue(unauthenticated());
    apiMock.register.mockRejectedValue(
      Object.assign(new Error('Email sudah terdaftar.'), {
        status: 409,
        errors: { email: 'Email sudah terdaftar.' },
      }),
    );
    setPath('/register');

    render(<App />);

    await screen.findByRole('heading', { name: 'Buat akun baru' });
    await userEvent.type(screen.getByLabelText('Email'), 'user@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'password123');
    await userEvent.click(screen.getByRole('button', { name: 'Daftar' }));

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain('Email sudah terdaftar.');
    expect(window.location.pathname).toBe('/register');
    expect(screen.queryByText('Dashboard')).toBeNull();
  });

  it('redirects to /app after successful login', async () => {
    apiMock.me.mockRejectedValue(unauthenticated());
    apiMock.login.mockResolvedValue(authenticatedSession());
    setPath('/login');

    render(<App />);

    await screen.findByRole('heading', { name: 'Masuk ke workspace' });
    await userEvent.type(screen.getByLabelText('Email'), 'user@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'password123');
    await userEvent.click(screen.getByRole('button', { name: 'Masuk' }));

    await screen.findByRole('heading', { name: 'Dashboard' });
    await waitFor(() => expect(window.location.pathname).toBe('/app'));
  });

  it('redirects authenticated users away from /login and /register', async () => {
    apiMock.me.mockResolvedValue(authenticatedSession());
    setPath('/login');

    render(<App />);

    await screen.findByRole('heading', { name: 'Dashboard' });
    await waitFor(() => expect(window.location.pathname).toBe('/app'));

    cleanup();
    setPath('/register');
    apiMock.me.mockResolvedValue(authenticatedSession());
    render(<App />);

    await screen.findByRole('heading', { name: 'Dashboard' });
    await waitFor(() => expect(window.location.pathname).toBe('/app'));
  });

  it('clears the session and redirects to /login after a 401 from the API', async () => {
    apiMock.me.mockResolvedValue(authenticatedSession());
    setPath('/app');

    render(<App />);

    await screen.findByRole('heading', { name: 'Dashboard' });
    expect(authExpiredHandler).toBeTypeOf('function');

    authExpiredHandler();

    await screen.findByRole('heading', { name: 'Masuk ke workspace' });
    await waitFor(() => expect(window.location.pathname).toBe('/login'));
  });

  it('blocks /app after logout', async () => {
    apiMock.me.mockResolvedValue(authenticatedSession());
    apiMock.logout.mockResolvedValue({});
    setPath('/app');

    render(<App />);

    await screen.findByRole('heading', { name: 'Dashboard' });
    await userEvent.click(screen.getAllByRole('button', { name: 'Keluar' })[0]);

    await screen.findByRole('heading', { name: 'Masuk ke workspace' });
    await waitFor(() => expect(window.location.pathname).toBe('/login'));
    expect(screen.queryByText('Dashboard')).toBeNull();
  });

  it('shows login and register links on the landing page', async () => {
    apiMock.me.mockRejectedValue(unauthenticated());
    setPath('/');

    render(<App />);

    await screen.findByRole('heading', {
      name: /Rapikan hari Anda/
    });
    expect(document.querySelector('a[href="/login"]')).toBeTruthy();
    expect(document.querySelector('a[href="/register"]')).toBeTruthy();
    expect(document.querySelector('a[href="/app"]')).toBeNull();
  });
});
