import { createHash, randomBytes, randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import pg from 'pg';
import { loadTestConfig } from '../../src/config.js';
import { runMigrations } from '../../src/migrate.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.resolve(__dirname, '../..');
const testEnvPath = path.join(serverRoot, '.env.test');
const runtimeEnvPath = path.join(serverRoot, '.env');

function readEnv(filePath) {
  return fs.existsSync(filePath)
    ? dotenv.parse(fs.readFileSync(filePath))
    : {};
}

function normalizeHost(host) {
  return host.replace('-pooler.', '.');
}

function runtimeUrls() {
  const envs = [readEnv(runtimeEnvPath), process.env];
  const keys = [
    'DATABASE_URL',
    'DATABASE_URL_UNPOOLED',
    'PRODUCTION_DATABASE_URL',
    'PRODUCTION_DATABASE_URL_UNPOOLED',
    'DATABASE_URL_PRODUCTION',
  ];
  const urls = [];

  for (const env of envs) {
    for (const key of keys) {
      const value = env[key]?.trim();

      if (value) {
        urls.push(value);
      }
    }
  }

  return urls;
}

function assertSafeTestDatabase(config) {
  const forbiddenUrls = runtimeUrls();

  if (forbiddenUrls.includes(config.databaseUrl)) {
    throw new Error('TEST_DATABASE_URL tidak boleh sama dengan URL runtime/production.');
  }

  if (forbiddenUrls.includes(config.databaseUrlUnpooled)) {
    throw new Error(
      'TEST_DATABASE_URL_UNPOOLED tidak boleh sama dengan URL runtime/production.',
    );
  }

  const pooled = new URL(config.databaseUrl);
  const unpooled = new URL(config.databaseUrlUnpooled);

  if (config.databaseUrl === config.databaseUrlUnpooled) {
    throw new Error('URL test pooled dan unpooled tidak boleh identik.');
  }

  if (
    normalizeHost(pooled.hostname) !== normalizeHost(unpooled.hostname) ||
    pooled.pathname !== unpooled.pathname ||
    pooled.username !== unpooled.username
  ) {
    throw new Error('URL test pooled dan unpooled harus berasal dari branch yang sama.');
  }

  if (
    !pooled.hostname.includes('-pooler.') ||
    unpooled.hostname.includes('-pooler.')
  ) {
    throw new Error('URL test harus memakai host pooled dan unpooled yang sesuai.');
  }
}

const fileEnv = readEnv(testEnvPath);
const mergedEnv = { ...fileEnv, ...process.env };
export const testConfig = loadTestConfig(mergedEnv);
assertSafeTestDatabase(testConfig);

const connectionAttempts = 5;
const retryDelayMs = 1000;
const transientConnectionCodes = new Set([
  'ECONNREFUSED',
  'ECONNRESET',
  'EHOSTUNREACH',
  'ENETUNREACH',
  'ETIMEDOUT',
]);

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isTransientConnectionError(error) {
  return (
    transientConnectionCodes.has(error?.code) ||
    /timeout/i.test(error?.message ?? '')
  );
}

export function createTestPool() {
  return new pg.Pool({
    connectionString: testConfig.databaseUrl,
    max: 2,
    connectionTimeoutMillis: 15000,
  });
}

async function connectUnpooledClient() {
  let lastError;

  for (let attempt = 1; attempt <= connectionAttempts; attempt += 1) {
    const client = new pg.Client({
      connectionString: testConfig.databaseUrlUnpooled,
      connectionTimeoutMillis: 15000,
    });

    try {
      await client.connect();
      return client;
    } catch (error) {
      lastError = error;
      await client.end().catch(() => {});

      if (
        attempt === connectionAttempts ||
        !isTransientConnectionError(error)
      ) {
        throw error;
      }

      await delay(retryDelayMs);
    }
  }

  throw lastError;
}

export async function withUnpooledClient(callback) {
  const client = await connectUnpooledClient();

  try {
    return await callback(client);
  } finally {
    await client.end().catch(() => {});
  }
}

export async function resetTestSchema() {
  await withUnpooledClient(async (client) => {
    await client.query('DROP SCHEMA IF EXISTS drizzle CASCADE');
    await client.query('DROP SCHEMA IF EXISTS public CASCADE');
    await client.query('CREATE SCHEMA public');
  });
}

export async function runTestMigrations() {
  let lastError;

  for (let attempt = 1; attempt <= connectionAttempts; attempt += 1) {
    try {
      await runMigrations({ databaseUrl: testConfig.databaseUrlUnpooled });
      return;
    } catch (error) {
      lastError = error;

      if (
        attempt === connectionAttempts ||
        !isTransientConnectionError(error)
      ) {
        throw error;
      }

      await delay(retryDelayMs);
    }
  }

  throw lastError;
}

export async function truncateTestTables() {
  await withUnpooledClient(async (client) => {
    await client.query(
      'TRUNCATE sessions, tasks, categories, users RESTART IDENTITY CASCADE',
    );
  });
}

export function createSessionToken() {
  return randomBytes(32).toString('base64url');
}

export function createCsrfToken() {
  return randomBytes(32).toString('base64url');
}

export function hashSessionToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

export async function createTestUser({
  email = `user-${randomUUID()}@example.com`,
  passwordHash = 'placeholder-password-hash',
} = {}) {
  const id = randomUUID();
  const normalizedEmail = email.trim().toLowerCase();

  await withUnpooledClient(async (client) => {
    await client.query(
      'INSERT INTO users (id, email, password_hash) VALUES ($1, $2, $3)',
      [id, normalizedEmail, passwordHash],
    );
  });

  return { id, email: normalizedEmail };
}

export async function createDefaultCategories(userId) {
  await withUnpooledClient(async (client) => {
    await client.query(
      `INSERT INTO categories (user_id, name, is_default, sort_order)
       VALUES ($1, 'Pribadi', true, 1),
              ($1, 'Pekerjaan', true, 2),
              ($1, 'Belajar', true, 3)`,
      [userId],
    );
  });
}

export async function createTestSession(
  userId,
  { ttlHours = 168, csrfToken = createCsrfToken() } = {},
) {
  const id = randomUUID();
  const token = createSessionToken();
  const tokenHash = hashSessionToken(token);
  const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);

  await withUnpooledClient(async (client) => {
    await client.query(
      `INSERT INTO sessions (id, user_id, token_hash, csrf_token, expires_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, userId, tokenHash, csrfToken, expiresAt],
    );
  });

  return { id, userId, token, tokenHash, csrfToken, expiresAt };
}

export async function createAuthenticatedUser(options = {}) {
  const user = await createTestUser(options);
  await createDefaultCategories(user.id);
  const session = await createTestSession(user.id, options.session);
  return { user, session };
}

export function authHeaders(session, cookieName = 'ptm_session') {
  return {
    Cookie: `${cookieName}=${session.token}`,
    'X-CSRF-Token': session.csrfToken,
  };
}
