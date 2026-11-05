import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import {
  closePostgresPool,
  createPostgresDb,
  createPostgresPool,
} from '../src/db.js';
import {
  resetTestSchema,
  runTestMigrations,
  testConfig,
  truncateTestTables,
  withUnpooledClient,
} from './helpers/test-db.js';

const allowedOrigin = 'http://localhost:5173';

let pool;
let db;
let app;
let authA;
let authB;

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
  authA = await register('user-a@example.com');
  authB = await register('user-b@example.com');
});

afterAll(async () => {
  await closePostgresPool(pool);
  await resetTestSchema();
});

async function register(email) {
  const response = await request(app)
    .post('/api/auth/register')
    .set('Origin', allowedOrigin)
    .send({ email, password: 'password123' })
    .expect(201);

  return {
    cookie: response.headers['set-cookie'][0].split(';')[0],
    csrfToken: response.body.data.csrf_token,
    user: response.body.data.user,
  };
}

function client(auth) {
  const withAuth = (req) =>
    req
      .set('Cookie', auth.cookie)
      .set('Origin', allowedOrigin)
      .set('X-CSRF-Token', auth.csrfToken);

  return {
    get: (path) => request(app).get(path).set('Cookie', auth.cookie),
    post: (path) => withAuth(request(app).post(path)),
    patch: (path) => withAuth(request(app).patch(path)),
    delete: (path) => withAuth(request(app).delete(path)),
  };
}

async function listTasks(auth) {
  const response = await client(auth).get('/api/tasks').expect(200);
  return response.body.data;
}

async function listCategories(auth) {
  const response = await client(auth).get('/api/categories').expect(200);
  return response.body.data;
}

describe('multi-user isolation', () => {
  it('isolates task lists, categories, and dashboard statistics per user', async () => {
    const categoriesA = await listCategories(authA);
    const categoriesB = await listCategories(authB);

    await client(authA)
      .post('/api/tasks')
      .send({
        title: 'Tugas A',
        priority: 'High',
        status: 'Done',
        category_id: categoriesA[0].id,
      })
      .expect(201);
    await client(authB)
      .post('/api/tasks')
      .send({
        title: 'Tugas B',
        priority: 'Low',
        status: 'Todo',
        category_id: categoriesB[0].id,
      })
      .expect(201);

    expect((await listTasks(authA)).map((task) => task.title)).toEqual([
      'Tugas A',
    ]);
    expect((await listTasks(authB)).map((task) => task.title)).toEqual([
      'Tugas B',
    ]);

    expect((await listCategories(authA)).map((c) => c.name)).toEqual([
      'Pribadi',
      'Pekerjaan',
      'Belajar',
    ]);
    expect((await listCategories(authB)).map((c) => c.name)).toEqual([
      'Pribadi',
      'Pekerjaan',
      'Belajar',
    ]);
    expect(categoriesA[0].id).not.toBe(categoriesB[0].id);

    const statsA = await client(authA)
      .get('/api/dashboard/stats')
      .expect(200);
    const statsB = await client(authB)
      .get('/api/dashboard/stats')
      .expect(200);

    expect(statsA.body.data).toEqual({
      total: 1,
      byStatus: { Todo: 0, 'In Progress': 0, Done: 1 },
      byPriority: { Low: 0, Medium: 0, High: 1, Urgent: 0 },
    });
    expect(statsB.body.data).toEqual({
      total: 1,
      byStatus: { Todo: 1, 'In Progress': 0, Done: 0 },
      byPriority: { Low: 1, Medium: 0, High: 0, Urgent: 0 },
    });
  });

  it('denies cross-user task and category mutations with 404', async () => {
    const categoriesA = await listCategories(authA);
    const created = await client(authA)
      .post('/api/tasks')
      .send({ title: 'Tugas rahasia A', priority: 'High' })
      .expect(201);
    const taskId = created.body.data.id;

    await client(authB)
      .patch(`/api/tasks/${taskId}`)
      .send({ title: 'Diubah B' })
      .expect(404);
    await client(authB).delete(`/api/tasks/${taskId}`).expect(404);
    await client(authB)
      .patch(`/api/categories/${categoriesA[0].id}`)
      .send({ name: 'Diubah B' })
      .expect(404);
    await client(authB)
      .delete(`/api/categories/${categoriesA[0].id}`)
      .expect(404);

    const tasksA = await listTasks(authA);
    expect(tasksA).toHaveLength(1);
    expect(tasksA[0].title).toBe('Tugas rahasia A');
    expect((await listCategories(authA))[0].name).toBe('Pribadi');
  });

  it('rejects foreign category ids when creating or updating tasks', async () => {
    const categoriesA = await listCategories(authA);
    const categoriesB = await listCategories(authB);

    await client(authB)
      .post('/api/tasks')
      .send({
        title: 'Kategori asing',
        priority: 'Low',
        category_id: categoriesA[0].id,
      })
      .expect(400);
    expect(await listTasks(authB)).toEqual([]);

    const ownTask = await client(authB)
      .post('/api/tasks')
      .send({
        title: 'Tugas B',
        priority: 'Low',
        category_id: categoriesB[0].id,
      })
      .expect(201);

    await client(authB)
      .patch(`/api/tasks/${ownTask.body.data.id}`)
      .send({ category_id: categoriesA[1].id })
      .expect(400);

    const tasksB = await listTasks(authB);
    expect(tasksB[0].category_id).toBe(categoriesB[0].id);
    expect(tasksB[0].category_name).toBe('Pribadi');
  });

  it('keeps legacy rows without an owner invisible and immutable', async () => {
    const legacy = await withUnpooledClient(async (clientDb) => {
      const category = await clientDb.query(
        "INSERT INTO categories (name, is_default, sort_order) VALUES ('Legacy', false, 99) RETURNING id",
      );
      const task = await clientDb.query(
        "INSERT INTO tasks (title, priority, category_id) VALUES ('Legacy task', 'Low', $1) RETURNING id",
        [category.rows[0].id],
      );

      return { categoryId: category.rows[0].id, taskId: task.rows[0].id };
    });

    expect(await listTasks(authA)).toEqual([]);
    expect((await listCategories(authA)).map((c) => c.name)).toEqual([
      'Pribadi',
      'Pekerjaan',
      'Belajar',
    ]);
    const stats = await client(authA).get('/api/dashboard/stats').expect(200);
    expect(stats.body.data.total).toBe(0);

    await client(authA)
      .patch(`/api/tasks/${legacy.taskId}`)
      .send({ title: 'Tidak boleh' })
      .expect(404);
    await client(authA).delete(`/api/tasks/${legacy.taskId}`).expect(404);
    await client(authA)
      .patch(`/api/categories/${legacy.categoryId}`)
      .send({ name: 'Tidak boleh' })
      .expect(404);
    await client(authA)
      .delete(`/api/categories/${legacy.categoryId}`)
      .expect(404);
  });

  it('does not assign legacy rows to a newly registered user', async () => {
    await withUnpooledClient(async (clientDb) => {
      await clientDb.query(
        "INSERT INTO categories (name, is_default, sort_order) VALUES ('Legacy only', false, 99)",
      );
    });

    const authC = await register('user-c@example.com');
    const categories = await listCategories(authC);

    expect(categories.map((c) => c.name)).toEqual([
      'Pribadi',
      'Pekerjaan',
      'Belajar',
    ]);
    expect(categories.some((c) => c.name === 'Legacy only')).toBe(false);
  });

  it('returns 401 for data endpoints without a valid session', async () => {
    await request(app).get('/api/tasks').expect(401);
    await request(app).get('/api/categories').expect(401);
    await request(app).get('/api/dashboard/stats').expect(401);
  });
});
