async function request(path, options = {}) {
  const response = await fetch(path, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  const body = await response.json().catch(() => ({}));

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
