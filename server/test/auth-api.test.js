import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import {
  closePostgresPool,
  createPostgresDb,
  createPostgresPool,
} from '../src/db.js';
import {
  createTestSession,
  createTestUser,
  resetTestSchema,
  runTestMigrations,
  testConfig,
  truncateTestTables,
} from './helpers/test-db.js';

const allowedOrigin = 'http://localhost:5173';

let pool;
let db;
let app;

beforeAll(async () => {
  await resetTestSchema();
  await runTestMigrations();
  pool = createPostgresPool({
    connectionString: testConfig.databaseUrl,
    max: 2,
    connectionTimeoutMillis: 15000,
  });
  db = createPostgresDb(pool);
});

beforeEach(async () => {
  await truncateTestTables();
  app = createApp(db, {
    corsOrigins: [allowedOrigin],
    auth: { sessionTtlHours: 1 },
  });
});

afterAll(async () => {
  await closePostgresPool(pool);
  await resetTestSchema();
});

function register(email, password = 'password123') {
  return request(app)
    .post('/api/auth/register')
    .set('Origin', allowedOrigin)
    .send({ email, password });
}

function login(email, password = 'password123') {
  return request(app)
    .post('/api/auth/login')
    .set('Origin', allowedOrigin)
    .send({ email, password });
}

function cookieOf(response) {
  const header = response.headers['set-cookie']?.[0];
  return header ? header.split(';')[0] : '';
}

async function registerAuth(email = 'auth@example.com') {
  const response = await register(email).expect(201);
  return {
    cookie: cookieOf(response),
    csrfToken: response.body.data.csrf_token,
    user: response.body.data.user,
  };
}

describe('authentication API', () => {
  it('registers a user and sets an HttpOnly session cookie', async () => {
    const response = await register('User@Example.com').expect(201);
    const setCookie = response.headers['set-cookie'][0];

    expect(response.body.success).toBe(true);
    expect(response.body.data.user.email).toBe('user@example.com');
    expect(response.body.data.csrf_token).toBeTruthy();
    expect(response.body.data).not.toHaveProperty('session');
    expect(JSON.stringify(response.body)).not.toMatch(
      /password|password_hash|token_hash/i,
    );
    expect(setCookie).toContain('HttpOnly');
    expect(setCookie).toContain('SameSite=Lax');
    expect(setCookie).toContain('Path=/');
    expect(setCookie).not.toContain('Secure');
  });

  it('rejects duplicate registration and invalid input', async () => {
    await register('duplicate@example.com').expect(201);

    const duplicate = await register('DUPLICATE@example.com').expect(409);
    expect(duplicate.body).toMatchObject({
      success: false,
      errors: { email: 'Email sudah terdaftar.' },
    });

    const invalid = await register('not-an-email', 'short').expect(400);
    expect(invalid.body.success).toBe(false);
    expect(invalid.body.errors).toHaveProperty('email');
    expect(invalid.body.errors).toHaveProperty('password');
  });

  it('logs in, reads the active session, and rejects bad credentials generically', async () => {
    const auth = await registerAuth('login@example.com');

    const loginResponse = await login('LOGIN@example.com').expect(200);
    const loginCookie = cookieOf(loginResponse);
    expect(loginResponse.body.data.user.email).toBe('login@example.com');
    expect(loginCookie).not.toBe(auth.cookie);

    const me = await request(app)
      .get('/api/auth/me')
      .set('Cookie', loginCookie)
      .expect(200);
    expect(me.body.data.user.email).toBe('login@example.com');
    expect(me.body.data.csrf_token).toBeTruthy();

    const wrongPassword = await login('login@example.com', 'wrong').expect(401);
    const unknownEmail = await login('missing@example.com').expect(401);
    expect(wrongPassword.body.message).toBe(unknownEmail.body.message);
    expect(wrongPassword.body.message).toBe('Email atau password salah.');
    expect(JSON.stringify(wrongPassword.body)).not.toMatch(/password_hash|token_hash|password123/i);

    await request(app).get('/api/auth/me').expect(401);
  });

  it('requires Origin and JSON content type for register/login', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'no-origin@example.com', password: 'password123' })
      .expect(403);

    await request(app)
      .post('/api/auth/register')
      .set('Origin', 'https://evil.example')
      .send({ email: 'bad-origin@example.com', password: 'password123' })
      .expect(403);

    await request(app)
      .post('/api/auth/register')
      .set('Origin', allowedOrigin)
      .type('form')
      .send({ email: 'form@example.com', password: 'password123' })
      .expect(403);
  });

  it('protects logout and mutations with CSRF, and logout revokes the session', async () => {
    const auth = await registerAuth('logout@example.com');

    await request(app)
      .post('/api/auth/logout')
      .set('Cookie', auth.cookie)
      .set('Origin', allowedOrigin)
      .expect(403);

    const taskWithoutCsrf = await request(app)
      .post('/api/tasks')
      .set('Cookie', auth.cookie)
      .set('Origin', allowedOrigin)
      .send({ title: 'Tanpa CSRF', priority: 'Low' })
      .expect(403);
    expect(taskWithoutCsrf.body.success).toBe(false);

    await request(app)
      .post('/api/tasks')
      .set('Cookie', auth.cookie)
      .set('Origin', allowedOrigin)
      .set('X-CSRF-Token', auth.csrfToken)
      .send({ title: 'Dengan CSRF', priority: 'Low' })
      .expect(201);

    await request(app)
      .post('/api/auth/logout')
      .set('Cookie', auth.cookie)
      .set('Origin', allowedOrigin)
      .set('X-CSRF-Token', auth.csrfToken)
      .expect(200);

    await request(app)
      .get('/api/auth/me')
      .set('Cookie', auth.cookie)
      .expect(401);
  });

  it('treats logout without a valid session as idempotent', async () => {
    const response = await request(app)
      .post('/api/auth/logout')
      .set('Origin', allowedOrigin)
      .expect(200);

    expect(response.body).toEqual({ success: true, data: {} });
    expect(response.headers['set-cookie'][0]).toContain('Max-Age=0');
  });

  it('rate limits repeated login attempts with a generic 429', async () => {
    const limitedApp = createApp(db, {
      corsOrigins: [allowedOrigin],
      auth: { rateLimitOptions: { limit: 3, windowMs: 60_000 } },
    });
    await request(limitedApp)
      .post('/api/auth/register')
      .set('Origin', allowedOrigin)
      .send({ email: 'limited@example.com', password: 'password123' })
      .expect(201);

    await request(limitedApp)
      .post('/api/auth/login')
      .set('Origin', allowedOrigin)
      .send({ email: 'limited@example.com', password: 'wrong' })
      .expect(401);
    await request(limitedApp)
      .post('/api/auth/login')
      .set('Origin', allowedOrigin)
      .send({ email: 'limited@example.com', password: 'wrong' })
      .expect(401);

    const limited = await request(limitedApp)
      .post('/api/auth/login')
      .set('Origin', allowedOrigin)
      .send({ email: 'limited@example.com', password: 'wrong' })
      .expect(429);

    expect(limited.body.success).toBe(false);
    expect(limited.headers['retry-after']).toBeTruthy();
    expect(JSON.stringify(limited.body)).not.toMatch(/tersedia|terdaftar/i);
  });

  it('rejects expired sessions', async () => {
    const user = await createTestUser({ email: 'expired@example.com' });
    const session = await createTestSession(user.id, { ttlHours: -1 });

    await request(app)
      .get('/api/auth/me')
      .set('Cookie', `ptm_session=${session.token}`)
      .expect(401);
    await request(app)
      .get('/api/tasks')
      .set('Cookie', `ptm_session=${session.token}`)
      .expect(401);
  });

  it('keeps health public and rejects data endpoints without a session', async () => {
    await request(app).get('/api/health').expect(200);
    await request(app).get('/api/tasks').expect(401);
    await request(app).get('/api/categories').expect(401);
    await request(app).get('/api/dashboard/stats').expect(401);
  });
});
