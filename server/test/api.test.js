import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import {
  closePostgresPool,
  createPostgresDb,
  createPostgresPool,
} from '../src/db.js';
import { localDateISO } from '../src/validation.js';
import {
  resetTestSchema,
  runTestMigrations,
  testConfig,
  truncateTestTables,
} from './helpers/test-db.js';

const allowedOrigin = 'http://localhost:5173';

let pool;
let db;
let app;
let auth;
let client;
let testCounter = 0;

beforeAll(async () => {
  await resetTestSchema();
  await runTestMigrations();
  pool = createPostgresPool({
    connectionString: testConfig.databaseUrl,
    max: 2,
    connectionTimeoutMillis: 15000,
  });
  db = createPostgresDb(pool);
  app = createApp(db, { corsOrigins: [allowedOrigin] });
});

beforeEach(async () => {
  await truncateTestTables();
  testCounter += 1;
  auth = await registerViaApi(`primary-${testCounter}@example.com`);
  client = createClient(auth);
});

afterAll(async () => {
  await closePostgresPool(pool);
  await resetTestSchema();
});

function createClient(session) {
  const withAuth = (req) =>
    req
      .set('Cookie', session.cookie)
      .set('Origin', allowedOrigin)
      .set('X-CSRF-Token', session.csrfToken);

  return {
    get: (path) => request(app).get(path).set('Cookie', session.cookie),
    post: (path) => withAuth(request(app).post(path)),
    patch: (path) => withAuth(request(app).patch(path)),
    delete: (path) => withAuth(request(app).delete(path)),
    options: (path) => request(app).options(path),
  };
}

async function registerViaApi(email, password = 'password123') {
  const response = await request(app)
    .post('/api/auth/register')
    .set('Origin', allowedOrigin)
    .send({ email, password })
    .expect(201);
  const cookie = response.headers['set-cookie'][0].split(';')[0];

  return {
    cookie,
    csrfToken: response.body.data.csrf_token,
    user: response.body.data.user,
  };
}

function dateOffset(days) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return localDateISO(date);
}

async function createTask(payload) {
  const response = await client
    .post('/api/tasks')
    .send({ priority: 'Medium', ...payload })
    .expect(201);

  return response.body.data;
}

async function getCategories() {
  const response = await client.get('/api/categories').expect(200);
  return response.body.data;
}

describe('categories', () => {
  it('seeds the three default categories in order', async () => {
    const categories = await getCategories();

    expect(categories.map((category) => category.name)).toEqual([
      'Pribadi',
      'Pekerjaan',
      'Belajar',
    ]);
    expect(categories.every((category) => category.is_default === true)).toBe(
      true,
    );
  });

  it('creates categories and orders them after defaults', async () => {
    await client.post('/api/categories').send({ name: 'Hobi' }).expect(201);
    await client.post('/api/categories').send({ name: 'Arsip' }).expect(201);

    const categories = await getCategories();

    expect(categories.map((category) => category.name)).toEqual([
      'Pribadi',
      'Pekerjaan',
      'Belajar',
      'Arsip',
      'Hobi',
    ]);
    expect(categories.at(-1).is_default).toBe(false);
  });

  it('rejects duplicate names case-insensitively', async () => {
    await client.post('/api/categories').send({ name: 'Hobi' }).expect(201);

    const response = await client
      .post('/api/categories')
      .send({ name: 'hobi' })
      .expect(409);

    expect(response.body).toMatchObject({
      success: false,
      errors: { name: 'Nama kategori sudah digunakan.' },
    });
  });

  it('renames categories including defaults', async () => {
    const categories = await getCategories();
    const pribadi = categories.find((category) => category.name === 'Pribadi');

    const response = await client
      .patch(`/api/categories/${pribadi.id}`)
      .send({ name: '  Personal  ' })
      .expect(200);

    expect(response.body.data).toMatchObject({
      id: pribadi.id,
      name: 'Personal',
      is_default: true,
    });
  });

  it('allows deleting a default category; recreating it is not default', async () => {
    const categories = await getCategories();
    const belajar = categories.find((category) => category.name === 'Belajar');

    await client.delete(`/api/categories/${belajar.id}`).expect(200);

    const response = await client
      .post('/api/categories')
      .send({ name: 'Belajar' })
      .expect(201);

    expect(response.body.data.is_default).toBe(false);
  });

  it('sets task category to null when its category is deleted', async () => {
    const categoryResponse = await client
      .post('/api/categories')
      .send({ name: 'Sementara' })
      .expect(201);

    const task = await createTask({
      title: 'Tugas sementara',
      category_id: categoryResponse.body.data.id,
    });

    await client
      .delete(`/api/categories/${categoryResponse.body.data.id}`)
      .expect(200);

    const response = await client.get('/api/tasks').expect(200);
    const updated = response.body.data.find((item) => item.id === task.id);

    expect(updated).toMatchObject({
      category_id: null,
      category_name: null,
    });
  });

  it('returns 404 for unknown categories and validates names', async () => {
    await client.patch('/api/categories/9999').send({ name: 'X' }).expect(404);
    await client.delete('/api/categories/9999').expect(404);

    const response = await client
      .post('/api/categories')
      .send({ name: '   ' })
      .expect(400);

    expect(response.body.errors.name).toBe('Nama kategori harus 1-50 karakter.');
  });
});

describe('tasks', () => {
  it('creates a task with defaults and trims fields', async () => {
    const response = await client
      .post('/api/tasks')
      .send({ title: '  Beli susu  ', priority: 'High' })
      .expect(201);

    expect(response.body.data).toMatchObject({
      title: 'Beli susu',
      description: null,
      status: 'Todo',
      priority: 'High',
      deadline: null,
      category_id: null,
      category_name: null,
      overdue: false,
    });
  });

  it('validates task input', async () => {
    const blankTitle = await client
      .post('/api/tasks')
      .send({ title: '   ', priority: 'Medium' })
      .expect(400);

    expect(blankTitle.body).toMatchObject({
      success: false,
      errors: { title: 'Judul tugas harus 1-120 karakter.' },
    });

    const missingPriority = await client
      .post('/api/tasks')
      .send({ title: 'Tanpa prioritas' })
      .expect(400);

    expect(missingPriority.body.errors.priority).toBe(
      'Prioritas tugas tidak valid.',
    );

    const badStatus = await client
      .post('/api/tasks')
      .send({ title: 'Status salah', priority: 'Low', status: 'Selesai' })
      .expect(400);

    expect(badStatus.body.errors.status).toBe('Status tugas tidak valid.');

    const badDeadline = await client
      .post('/api/tasks')
      .send({ title: 'Tanggal salah', priority: 'Low', deadline: '2026-02-30' })
      .expect(400);

    expect(badDeadline.body.errors.deadline).toBe('Tanggal tenggat tidak valid.');

    const badCategory = await client
      .post('/api/tasks')
      .send({ title: 'Kategori salah', priority: 'Low', category_id: 9999 })
      .expect(400);

    expect(badCategory.body.errors.category_id).toBe('Kategori tidak ditemukan.');
  });

  it('updates a task and recalculates overdue', async () => {
    const task = await createTask({
      title: 'Tugas lampau',
      priority: 'Urgent',
      deadline: dateOffset(-1),
    });

    expect(task.overdue).toBe(true);

    const done = await client
      .patch(`/api/tasks/${task.id}`)
      .send({ status: 'Done' })
      .expect(200);

    expect(done.body.data.overdue).toBe(false);

    const reopened = await client
      .patch(`/api/tasks/${task.id}`)
      .send({ status: 'Todo' })
      .expect(200);

    expect(reopened.body.data.overdue).toBe(true);

    await client
      .patch(`/api/tasks/${task.id}`)
      .send({ status: 'Done' })
      .expect(200);

    const inProgress = await client
      .patch(`/api/tasks/${task.id}`)
      .send({ status: 'In Progress' })
      .expect(200);

    expect(inProgress.body.data.status).toBe('In Progress');
    expect(inProgress.body.data.overdue).toBe(true);

    const updated = await client
      .patch(`/api/tasks/${task.id}`)
      .send({
        title: '  Judul baru  ',
        description: '   ',
        priority: 'Low',
        deadline: null,
      })
      .expect(200);

    expect(updated.body.data).toMatchObject({
      title: 'Judul baru',
      description: null,
      priority: 'Low',
      deadline: null,
      overdue: false,
    });
  });

  it('deletes a task and returns 404 afterwards', async () => {
    const task = await createTask({ title: 'Akan dihapus' });

    await client.delete(`/api/tasks/${task.id}`).expect(200);
    await client.patch(`/api/tasks/${task.id}`).send({ title: 'X' }).expect(404);
    await client.delete(`/api/tasks/${task.id}`).expect(404);
  });

  it('searches title and description case-insensitively and escapes wildcards', async () => {
    await createTask({ title: 'Alpha', description: 'Beta gamma' });
    await createTask({ title: 'Diskon 100%', priority: 'Low' });
    await createTask({ title: 'Biasa', priority: 'Low' });

    const byTitle = await client
      .get('/api/tasks')
      .query({ search: 'ALPHA' })
      .expect(200);

    expect(byTitle.body.data.map((task) => task.title)).toEqual(['Alpha']);

    const byDescription = await client
      .get('/api/tasks')
      .query({ search: 'gamma' })
      .expect(200);

    expect(byDescription.body.data.map((task) => task.title)).toEqual(['Alpha']);

    const wildcard = await client
      .get('/api/tasks')
      .query({ search: '%' })
      .expect(200);

    expect(wildcard.body.data.map((task) => task.title)).toEqual(['Diskon 100%']);
  });

  it('filters by category, status, and priority with AND semantics', async () => {
    const categories = await getCategories();
    const pribadi = categories.find((category) => category.name === 'Pribadi');
    const customResponse = await client
      .post('/api/categories')
      .send({ name: 'Proyek' })
      .expect(201);
    const proyek = customResponse.body.data;

    await createTask({
      title: 'Pribadi penting',
      category_id: pribadi.id,
      status: 'Todo',
      priority: 'High',
    });
    await createTask({
      title: 'Proyek selesai',
      category_id: proyek.id,
      status: 'Done',
      priority: 'Low',
    });
    await createTask({
      title: 'Tanpa kategori',
      status: 'Todo',
      priority: 'High',
    });

    const none = await client
      .get('/api/tasks')
      .query({ category_id: 'none' })
      .expect(200);

    expect(none.body.data.map((task) => task.title)).toEqual(['Tanpa kategori']);

    const combined = await client
      .get('/api/tasks')
      .query({ status: 'Todo', priority: 'High' })
      .expect(200);

    expect(combined.body.data.map((task) => task.title).sort()).toEqual([
      'Pribadi penting',
      'Tanpa kategori',
    ]);

    const byCategory = await client
      .get('/api/tasks')
      .query({ category_id: String(proyek.id), status: 'Done' })
      .expect(200);

    expect(byCategory.body.data.map((task) => task.title)).toEqual([
      'Proyek selesai',
    ]);
  });

  it('sorts by newest creation and by deadline with nulls last', async () => {
    const first = await createTask({
      title: 'Jauh',
      priority: 'Low',
      deadline: '2099-01-01',
    });
    const second = await createTask({
      title: 'Dekat',
      priority: 'Low',
      deadline: '2098-01-01',
    });
    const third = await createTask({ title: 'Tanpa deadline', priority: 'Low' });

    const newest = await client.get('/api/tasks').expect(200);
    expect(newest.body.data.map((task) => task.id)).toEqual([
      third.id,
      second.id,
      first.id,
    ]);

    const byDeadline = await client
      .get('/api/tasks')
      .query({ sort: 'deadline_asc' })
      .expect(200);

    expect(byDeadline.body.data.map((task) => task.id)).toEqual([
      second.id,
      first.id,
      third.id,
    ]);
  });

  it('rejects invalid filters and sorting', async () => {
    await client.get('/api/tasks').query({ status: 'Selesai' }).expect(400);
    await client.get('/api/tasks').query({ priority: 'Tinggi' }).expect(400);
    await client.get('/api/tasks').query({ sort: 'acak' }).expect(400);
    await client
      .get('/api/tasks')
      .query({ category_id: 'abc' })
      .expect(400);
  });
});

describe('dashboard', () => {
  it('returns global counts by status and priority', async () => {
    await createTask({ title: 'Satu', status: 'Todo', priority: 'High' });
    await createTask({ title: 'Dua', status: 'Done', priority: 'High' });
    await createTask({ title: 'Tiga', status: 'In Progress', priority: 'Low' });

    const response = await client
      .get('/api/dashboard/stats')
      .expect(200);

    expect(response.body.data).toEqual({
      total: 3,
      byStatus: { Todo: 1, 'In Progress': 1, Done: 1 },
      byPriority: { Low: 1, Medium: 0, High: 2, Urgent: 0 },
    });

    await client.get('/api/tasks').query({ status: 'Todo' }).expect(200);

    const unchanged = await client
      .get('/api/dashboard/stats')
      .expect(200);

    expect(unchanged.body.data.total).toBe(3);
  });
});

describe('health check', () => {
  it('returns 200 only when the runtime database responds without changing data', async () => {
    const before = await pool.query(
      `SELECT (SELECT count(*) FROM categories)::int AS categories,
              (SELECT count(*) FROM tasks)::int AS tasks`,
    );

    const response = await client.get('/api/health').expect(200);

    expect(response.body).toEqual({ status: 'ok' });
    expect(response.headers['cache-control']).toBe('no-store');
    expect(response.text).not.toMatch(/postgres|neon|database_url|localhost/i);

    const after = await pool.query(
      `SELECT (SELECT count(*) FROM categories)::int AS categories,
              (SELECT count(*) FROM tasks)::int AS tasks`,
    );

    expect(after.rows[0]).toEqual(before.rows[0]);
  });

  it('returns 503 without leaking database details when the dependency fails', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const failingApp = createApp(
      {
        execute: async () => {
          throw new Error(
            'kredensial-rahasia db.example.com production gagal',
          );
        },
      },
      { healthCheckTimeoutMs: 100 },
    );

    try {
      const response = await request(failingApp)
        .get('/api/health')
        .expect(503);

      expect(response.body).toEqual({ status: 'unhealthy' });
      expect(response.headers['cache-control']).toBe('no-store');
      expect(response.text).not.toMatch(
        /kredensial|db\.example|production|stack|Error/i,
      );
      expect(errorSpy).toHaveBeenCalledWith('Health check database gagal.');
    } finally {
      errorSpy.mockRestore();
    }
  });

  it('returns 503 when the database query times out', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const hangingApp = createApp(
      { execute: () => new Promise(() => {}) },
      { healthCheckTimeoutMs: 50 },
    );

    try {
      const response = await request(hangingApp)
        .get('/api/health')
        .expect(503);

      expect(response.body).toEqual({ status: 'unhealthy' });
      expect(response.headers['cache-control']).toBe('no-store');
      expect(response.text).not.toMatch(
        /kredensial|db\.example|production|stack|Error/i,
      );
      expect(errorSpy).toHaveBeenCalledWith('Health check database gagal.');
    } finally {
      errorSpy.mockRestore();
    }
  });
});

describe('CORS', () => {
  it('allows preflight from an allowed origin with credentials', async () => {
    const response = await client
      .options('/api/tasks')
      .set('Origin', allowedOrigin)
      .set('Access-Control-Request-Method', 'GET')
      .set('Access-Control-Request-Headers', 'X-CSRF-Token')
      .expect(204);

    expect(response.headers['access-control-allow-origin']).toBe(allowedOrigin);
    expect(response.headers['access-control-allow-credentials']).toBe('true');
    expect(response.headers['access-control-allow-headers']).toContain(
      'X-CSRF-Token',
    );
  });

  it('does not grant CORS access to an unknown origin', async () => {
    const response = await client
      .options('/api/tasks')
      .set('Origin', 'https://contoh-tidak-diizinkan.example')
      .set('Access-Control-Request-Method', 'GET');

    expect(response.status).toBe(404);
    expect(response.headers['access-control-allow-origin']).toBeUndefined();
    expect(response.headers['access-control-allow-credentials']).toBeUndefined();
  });
});

describe('API contract', () => {
  it('preserves integer IDs, booleans, timestamps, and date-only deadlines', async () => {
    const categories = await getCategories();

    for (const category of categories) {
      expect(Number.isInteger(category.id)).toBe(true);
      expect(typeof category.is_default).toBe('boolean');
      expect(category.created_at).toMatch(
        /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/,
      );
    }

    const task = await createTask({
      title: 'Kontrak API',
      priority: 'High',
      deadline: '2030-05-06',
    });

    expect(Number.isInteger(task.id)).toBe(true);
    expect(task.deadline).toBe('2030-05-06');
    expect(typeof task.overdue).toBe('boolean');
    expect(task.created_at).toMatch(
      /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/,
    );
  });

  it('keeps error statuses and the standard error envelope', async () => {
    const validation = await client
      .post('/api/tasks')
      .send({ title: '   ', priority: 'High' })
      .expect(400);

    expect(validation.body).toMatchObject({
      success: false,
      errors: { title: 'Judul tugas harus 1-120 karakter.' },
    });

    const notFound = await client
      .patch('/api/tasks/9999')
      .send({ title: 'Tidak ada' })
      .expect(404);

    expect(notFound.body).toMatchObject({ success: false });

    await client.post('/api/categories').send({ name: 'Hobi' }).expect(201);

    const conflict = await client
      .post('/api/categories')
      .send({ name: 'hobi' })
      .expect(409);

    expect(conflict.body).toMatchObject({
      success: false,
      errors: { name: 'Nama kategori sudah digunakan.' },
    });

    const unknown = await client.get('/api/tidak-ada').expect(404);

    expect(unknown.body).toEqual({
      success: false,
      message: 'Endpoint tidak ditemukan.',
      errors: {},
    });
  });
});

describe('errors', () => {
  it('returns the standard error envelope', async () => {
    const response = await client.get('/api/tidak-ada').expect(404);

    expect(response.body).toEqual({
      success: false,
      message: 'Endpoint tidak ditemukan.',
      errors: {},
    });
  });

  it('returns 400 for malformed JSON', async () => {
    const response = await client
      .post('/api/tasks')
      .set('Content-Type', 'application/json')
      .send('{"title":')
      .expect(400);

    expect(response.body).toMatchObject({
      success: false,
      errors: {},
    });
  });
});
