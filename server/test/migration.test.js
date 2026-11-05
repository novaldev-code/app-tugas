import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  createTestPool,
  resetTestSchema,
  runTestMigrations,
  withUnpooledClient,
} from './helpers/test-db.js';

let pool;

beforeAll(async () => {
  await resetTestSchema();
  await runTestMigrations();
  pool = createTestPool();
});

afterAll(async () => {
  await pool?.end();
  await resetTestSchema();
});

describe('PostgreSQL migration', () => {
  it('creates the schema and records every migration', async () => {
    const tables = await pool.query(
      "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename",
    );
    const migrations = await pool.query(
      'SELECT count(*)::int AS count FROM drizzle.schema_migrations',
    );

    expect(tables.rows.map((row) => row.tablename)).toEqual([
      'categories',
      'sessions',
      'tasks',
      'users',
    ]);
    expect(migrations.rows[0].count).toBe(4);
  });

  it('seeds the three default categories exactly once', async () => {
    const categories = await pool.query(
      'SELECT name, is_default, sort_order FROM categories ORDER BY sort_order',
    );

    expect(categories.rows).toEqual([
      { name: 'Pribadi', is_default: true, sort_order: 1 },
      { name: 'Pekerjaan', is_default: true, sort_order: 2 },
      { name: 'Belajar', is_default: true, sort_order: 3 },
    ]);

    await runTestMigrations();

    const afterRerun = await pool.query(
      'SELECT count(*)::int AS count FROM categories',
    );
    expect(afterRerun.rows[0].count).toBe(3);
  });

  it('enforces case-insensitive category uniqueness', async () => {
    await withUnpooledClient(async (client) => {
      try {
        await client.query('BEGIN');
        await expect(
          client.query(
            "INSERT INTO categories (name, is_default, sort_order) VALUES ('pribadi', false, 99)",
          ),
        ).rejects.toMatchObject({ code: '23505' });
      } finally {
        await client.query('ROLLBACK');
      }
    });
  });

  it('enforces case-insensitive user email uniqueness', async () => {
    await withUnpooledClient(async (client) => {
      try {
        await client.query('BEGIN');
        await client.query(
          "INSERT INTO users (id, email, password_hash) VALUES ($1, 'User@Example.com', 'hash')",
          [randomUUID()],
        );

        await expect(
          client.query(
            "INSERT INTO users (id, email, password_hash) VALUES ($1, 'user@example.com', 'hash')",
            [randomUUID()],
          ),
        ).rejects.toMatchObject({ code: '23505' });
      } finally {
        await client.query('ROLLBACK');
      }
    });
  });

  it('enforces unique session token hashes', async () => {
    await withUnpooledClient(async (client) => {
      try {
        await client.query('BEGIN');
        const userId = randomUUID();
        await client.query(
          "INSERT INTO users (id, email, password_hash) VALUES ($1, 'session@example.com', 'hash')",
          [userId],
        );
        await client.query(
          `INSERT INTO sessions (id, user_id, token_hash, csrf_token, expires_at)
           VALUES ($1, $2, 'same-token', 'csrf', now() + interval '1 day')`,
          [randomUUID(), userId],
        );

        await expect(
          client.query(
            `INSERT INTO sessions (id, user_id, token_hash, csrf_token, expires_at)
             VALUES ($1, $2, 'same-token', 'csrf', now() + interval '1 day')`,
            [randomUUID(), userId],
          ),
        ).rejects.toMatchObject({ code: '23505' });
      } finally {
        await client.query('ROLLBACK');
      }
    });
  });

  it('cascades user deletion to sessions, categories, and tasks', async () => {
    await withUnpooledClient(async (client) => {
      try {
        await client.query('BEGIN');
        const userId = randomUUID();
        await client.query(
          "INSERT INTO users (id, email, password_hash) VALUES ($1, 'cascade@example.com', 'hash')",
          [userId],
        );
        const category = await client.query(
          "INSERT INTO categories (user_id, name, is_default, sort_order) VALUES ($1, 'Milik user', true, 1) RETURNING id",
          [userId],
        );
        await client.query(
          "INSERT INTO tasks (user_id, title, priority, category_id) VALUES ($1, 'Tugas user', 'High', $2)",
          [userId, category.rows[0].id],
        );
        await client.query(
          `INSERT INTO sessions (id, user_id, token_hash, csrf_token, expires_at)
           VALUES ($1, $2, 'cascade-token', 'csrf', now() + interval '1 day')`,
          [randomUUID(), userId],
        );

        await client.query('DELETE FROM users WHERE id = $1', [userId]);

        const counts = await client.query(
          `SELECT
             (SELECT count(*)::int FROM users) AS users,
             (SELECT count(*)::int FROM sessions) AS sessions,
             (SELECT count(*)::int FROM categories WHERE user_id = $1) AS owned_categories,
             (SELECT count(*)::int FROM tasks) AS tasks,
             (SELECT count(*)::int FROM categories WHERE id = $2) AS category_by_id`,
          [userId, category.rows[0].id],
        );
        expect(counts.rows[0]).toEqual({
          users: 0,
          sessions: 0,
          owned_categories: 0,
          tasks: 0,
          category_by_id: 0,
        });
      } finally {
        await client.query('ROLLBACK');
      }
    });
  });

  it('allows legacy rows with null owner', async () => {
    await withUnpooledClient(async (client) => {
      try {
        await client.query('BEGIN');
        const category = await client.query(
          "INSERT INTO categories (name, is_default, sort_order) VALUES ('Legacy migration', false, 99) RETURNING id, user_id",
        );
        const task = await client.query(
          "INSERT INTO tasks (title, priority, category_id) VALUES ('Legacy migration task', 'Low', $1) RETURNING user_id",
          [category.rows[0].id],
        );

        expect(category.rows[0].user_id).toBeNull();
        expect(task.rows[0].user_id).toBeNull();
      } finally {
        await client.query('ROLLBACK');
      }
    });
  });

  it('enforces task constraints', async () => {
    await withUnpooledClient(async (client) => {
      try {
        await client.query('BEGIN');

        async function expectConstraintViolation(sql) {
          await client.query('SAVEPOINT constraint_check');
          await expect(client.query(sql)).rejects.toMatchObject({
            code: '23514',
          });
          await client.query('ROLLBACK TO SAVEPOINT constraint_check');
        }

        await expectConstraintViolation(
          "INSERT INTO tasks (title, priority) VALUES ('   ', 'High')",
        );
        await expectConstraintViolation(
          "INSERT INTO tasks (title, priority) VALUES ('Valid', 'Invalid')",
        );
        await expectConstraintViolation(
          "INSERT INTO tasks (title, status, priority) VALUES ('Valid', 'Invalid', 'High')",
        );
      } finally {
        await client.query('ROLLBACK');
      }
    });
  });

  it('sets task category to null when the category is deleted', async () => {
    await withUnpooledClient(async (client) => {
      try {
        await client.query('BEGIN');
        const task = await client.query(
          "INSERT INTO tasks (title, priority, category_id) VALUES ('Tugas FK', 'High', 1) RETURNING id",
        );

        await client.query('DELETE FROM categories WHERE id = 1');

        const updated = await client.query(
          'SELECT category_id FROM tasks WHERE id = $1',
          [task.rows[0].id],
        );
        expect(updated.rows[0].category_id).toBeNull();
      } finally {
        await client.query('ROLLBACK');
      }
    });
  });
});
