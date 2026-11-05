import request from 'supertest';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
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
} from './helpers/test-db.js';

const allowedOrigin = 'http://localhost:5173';

let pools;
let app;
let auth;

function createTestApp() {
  const pool = createPostgresPool({
    connectionString: testConfig.databaseUrl,
    max: 1,
    connectionTimeoutMillis: 15000,
  });
  pools.push(pool);

  return createApp(createPostgresDb(pool), {
    corsOrigins: [allowedOrigin],
  });
}

function client(targetApp = app) {
  const withAuth = (req) =>
    req
      .set('Cookie', auth.cookie)
      .set('Origin', allowedOrigin)
      .set('X-CSRF-Token', auth.csrfToken);

  return {
    get: (path) => request(targetApp).get(path).set('Cookie', auth.cookie),
    post: (path) => withAuth(request(targetApp).post(path)),
    patch: (path) => withAuth(request(targetApp).patch(path)),
    delete: (path) => withAuth(request(targetApp).delete(path)),
  };
}

async function registerUser(email = 'persist@example.com') {
  const response = await request(app)
    .post('/api/auth/register')
    .set('Origin', allowedOrigin)
    .send({ email, password: 'password123' })
    .expect(201);

  return {
    cookie: response.headers['set-cookie'][0].split(';')[0],
    csrfToken: response.body.data.csrf_token,
  };
}

beforeAll(async () => {
  await resetTestSchema();
  await runTestMigrations();
});

beforeEach(async () => {
  pools = [];
  await truncateTestTables();
  app = createTestApp();
  auth = await registerUser();
});

afterEach(async () => {
  for (const pool of pools) {
    await closePostgresPool(pool);
  }

  pools = [];
});

afterAll(async () => {
  await resetTestSchema();
});

describe('persistence', () => {
  it('keeps tasks and renamed default categories after reconnecting', async () => {
    const renamed = await client()
      .patch('/api/categories/1')
      .send({ name: 'Keluarga' })
      .expect(200);

    expect(renamed.body.data).toMatchObject({
      name: 'Keluarga',
      is_default: true,
    });

    await client()
      .post('/api/tasks')
      .send({ title: 'Tugas persisten', priority: 'High', category_id: 1 })
      .expect(201);

    await closePostgresPool(pools[0]);
    app = createTestApp();

    const categories = await client().get('/api/categories').expect(200);

    expect(categories.body.data).toHaveLength(3);
    expect(categories.body.data[0]).toMatchObject({
      name: 'Keluarga',
      is_default: true,
    });

    const tasks = await client().get('/api/tasks').expect(200);

    expect(tasks.body.data).toHaveLength(1);
    expect(tasks.body.data[0]).toMatchObject({
      title: 'Tugas persisten',
      category_name: 'Keluarga',
    });
  });
});
