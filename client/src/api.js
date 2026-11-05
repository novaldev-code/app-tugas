const defaultApiBaseUrl = import.meta.env?.VITE_API_URL ?? '';

let csrfToken = '';
let authExpiredHandler = null;

export function normalizeApiBaseUrl(value) {
  if (typeof value !== 'string') {
    return '';
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return '';
  }

  return trimmed.replace(/\/+$/, '');
}

export function resolveApiUrl(path, baseUrl = defaultApiBaseUrl) {
  const base = normalizeApiBaseUrl(baseUrl);

  if (!base) {
    return path;
  }

  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

export function setCsrfToken(value) {
  csrfToken = typeof value === 'string' ? value : '';
}

export function getCsrfToken() {
  return csrfToken;
}

export function setAuthExpiredHandler(handler) {
  authExpiredHandler = typeof handler === 'function' ? handler : null;
}

function applyAuth(data) {
  setCsrfToken(data?.csrf_token);
  return data;
}

async function request(path, options = {}) {
  const { skipAuthExpired = false, ...fetchOptions } = options;
  const method = (fetchOptions.method ?? 'GET').toUpperCase();
  const headers = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers ?? {}),
  };

  if (method !== 'GET' && csrfToken) {
    headers['X-CSRF-Token'] = csrfToken;
  }

  const response = await fetch(resolveApiUrl(path), {
    credentials: 'include',
    ...fetchOptions,
    headers,
  });

  const body = await response.json().catch(() => ({}));

  if (response.status === 401 && !skipAuthExpired) {
    setCsrfToken('');
    authExpiredHandler?.();
  }

  if (!response.ok || body.success === false) {
    const error = new Error(body.message || 'Terjadi kesalahan.');
    error.status = response.status;
    error.errors = body.errors || {};
    throw error;
  }

  return body.data;
}

function taskQuery(filters) {
  const params = new URLSearchParams();

  if (filters.search?.trim()) {
    params.set('search', filters.search.trim());
  }

  if (filters.category_id && filters.category_id !== 'all') {
    params.set('category_id', filters.category_id);
  }

  if (filters.status && filters.status !== 'all') {
    params.set('status', filters.status);
  }

  if (filters.priority && filters.priority !== 'all') {
    params.set('priority', filters.priority);
  }

  if (filters.sort) {
    params.set('sort', filters.sort);
  }

  const query = params.toString();
  return query ? `?${query}` : '';
}

export const api = {
  register(payload) {
    return request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
      skipAuthExpired: true,
    }).then(applyAuth);
  },

  login(payload) {
    return request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
      skipAuthExpired: true,
    }).then(applyAuth);
  },

  logout() {
    return request('/api/auth/logout', {
      method: 'POST',
      skipAuthExpired: true,
    }).finally(() => setCsrfToken(''));
  },

  me() {
    return request('/api/auth/me', { skipAuthExpired: true }).then(applyAuth);
  },

  listTasks(filters, signal) {
    return request(`/api/tasks${taskQuery(filters)}`, { signal });
  },

  createTask(payload) {
    return request('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  updateTask(id, payload) {
    return request(`/api/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  deleteTask(id) {
    return request(`/api/tasks/${id}`, { method: 'DELETE' });
  },

  listCategories() {
    return request('/api/categories');
  },

  createCategory(payload) {
    return request('/api/categories', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  updateCategory(id, payload) {
    return request(`/api/categories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  deleteCategory(id) {
    return request(`/api/categories/${id}`, { method: 'DELETE' });
  },

  getStats() {
    return request('/api/dashboard/stats');
  },
};
