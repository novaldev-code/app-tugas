import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { hashToken } from '../src/auth/tokens.js';
import { ConflictError, UnauthorizedError } from '../src/errors.js';
import {
  closePostgresPool,
  createPostgresDb,
  createPostgresPool,
} from '../src/db.js';
import { listCategories } from '../src/repositories/categories.js';
import {
  createSession,
  deleteExpiredSessions,
  deleteSessionById,
  findValidSessionByTokenHash,
} from '../src/repositories/sessions.js';
import {
  findUserByEmail,
  findUserById,
  mapUser,
} from '../src/repositories/users.js';
import {
  loginUser,
  logoutUser,
  registerUser,
} from '../src/services/auth.js';
import {
  createSessionToken,
  createTestUser,
  resetTestSchema,
  runTestMigrations,
  testConfig,
  truncateTestTables,
  withUnpooledClient,
} from './helpers/test-db.js';

let pool;
let db;

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
});

afterAll(async () => {
  await closePostgresPool(pool);
  await resetTestSchema();
});

describe('user and session repositories', () => {
  it('finds users by id and case-insensitive email', async () => {
    const user = await createTestUser({ email: 'Person@Example.com' });

    const byEmail = await findUserByEmail(db, 'PERSON@example.com');
    const byId = await findUserById(db, user.id);

    expect(byEmail.id).toBe(user.id);
    expect(byId.email).toBe('person@example.com');
    expect(mapUser(byId)).toEqual({
      id: user.id,
      email: 'person@example.com',
    });
  });

  it('creates, finds, expires, and deletes sessions', async () => {
    const user = await createTestUser();

    const session = {
      id: 'session-id',
      userId: user.id,
      tokenHash: hashToken(createSessionToken()),
      csrfToken: 'csrf-token',
      expiresAt: new Date(Date.now() + 60_000),
    };
    await createSession(db, session);

    const found = await findValidSessionByTokenHash(db, session.tokenHash);
    expect(found.id).toBe(session.id);

    const expired = {
      id: 'expired-session',
      userId: user.id,
      tokenHash: hashToken(createSessionToken()),
      csrfToken: 'csrf-expired',
      expiresAt: new Date(Date.now() - 60_000),
    };
    await createSession(db, expired);

    await expect(
      findValidSessionByTokenHash(db, expired.tokenHash),
    ).resolves.toBeNull();
    await expect(deleteExpiredSessions(db)).resolves.toBe(1);
    await expect(deleteSessionById(db, session.id)).resolves.toBe(true);
    await expect(deleteSessionById(db, session.id)).resolves.toBe(false);
  });
});

describe('auth service', () => {
  it('registers a user with default categories, a session, and a hashed password', async () => {
    const result = await registerUser(db, {
      email: '  User@Example.com ',
      password: 'password123',
    });

    expect(result.user.email).toBe('user@example.com');
    expect(result.session.token).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(result.session.csrfToken).toMatch(/^[A-Za-z0-9_-]+$/);

    const categories = await listCategories(db, result.user.id);
    expect(categories.map((category) => category.name)).toEqual([
      'Pribadi',
      'Pekerjaan',
      'Belajar',
    ]);

    const storedUser = await findUserByEmail(db, 'USER@example.com');
    expect(storedUser.passwordHash).not.toBe('password123');
    expect(storedUser.passwordHash.startsWith('$argon2id$')).toBe(true);

    const storedSession = await findValidSessionByTokenHash(
      db,
      hashToken(result.session.token),
    );
    expect(storedSession.userId).toBe(result.user.id);
  });

  it('rejects duplicate emails case-insensitively', async () => {
    await registerUser(db, {
      email: 'duplicate@example.com',
      password: 'password123',
    });

    await expect(
      registerUser(db, {
        email: 'DUPLICATE@example.com',
        password: 'password456',
      }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it('rolls back user creation when default categories fail', async () => {
    await withUnpooledClient(async (client) => {
      await client.query(`
        CREATE OR REPLACE FUNCTION test_fail_category_insert()
        RETURNS trigger AS $$
        BEGIN
          RAISE EXCEPTION 'category insert failed';
        END;
        $$ LANGUAGE plpgsql;
      `);
      await client.query(`
        CREATE TRIGGER test_fail_category_insert
        BEFORE INSERT ON categories
        FOR EACH ROW EXECUTE FUNCTION test_fail_category_insert();
      `);
    });

    try {
      await expect(
        registerUser(db, {
          email: 'rollback@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow('category insert failed');
    } finally {
      await withUnpooledClient(async (client) => {
        await client.query(
          'DROP TRIGGER IF EXISTS test_fail_category_insert ON categories',
        );
        await client.query(
          'DROP FUNCTION IF EXISTS test_fail_category_insert()',
        );
      });
    }

    await expect(findUserByEmail(db, 'rollback@example.com')).resolves.toBeNull();
    const sessions = await withUnpooledClient((client) =>
      client.query('SELECT count(*)::int AS count FROM sessions'),
    );
    expect(sessions.rows[0].count).toBe(0);
  });

  it('logs in with rotating session tokens and rejects bad credentials generically', async () => {
    await registerUser(db, {
      email: 'login@example.com',
      password: 'password123',
    });

    const first = await loginUser(db, {
      email: 'LOGIN@example.com',
      password: 'password123',
    });
    const second = await loginUser(db, {
      email: 'login@example.com',
      password: 'password123',
    });

    expect(first.session.token).not.toBe(second.session.token);

    await expect(
      loginUser(db, {
        email: 'login@example.com',
        password: 'wrong-password',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedError);

    await expect(
      loginUser(db, {
        email: 'missing@example.com',
        password: 'password123',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('revokes the session on logout', async () => {
    const result = await registerUser(db, {
      email: 'logout@example.com',
      password: 'password123',
    });

    await logoutUser(db, result.session);

    await expect(
      findValidSessionByTokenHash(db, hashToken(result.session.token)),
    ).resolves.toBeNull();
  });
});
