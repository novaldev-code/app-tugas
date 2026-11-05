import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  importSqliteToPostgres,
  main,
} from '../scripts/import-sqlite.js';
import {
  createTestPool,
  resetTestSchema,
  runTestMigrations,
  testConfig,
  truncateTestTables,
  withUnpooledClient,
} from './helpers/test-db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.resolve(__dirname, '..');

let pool;
let tempDirectory;
let sourcePath;
let initialSourceHash;

function hashFile(filePath) {
  return createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function createFixture(filePath) {
  const database = new Database(filePath);

  try {
    database.pragma('foreign_keys = ON');
    database.exec(
      fs.readFileSync(
        path.join(serverRoot, 'test/fixtures/sqlite-001-init.sql'),
        'utf8',
      ),
    );

    const insertCategory = database.prepare(
      `INSERT INTO categories (id, name, is_default, sort_order, created_at)
       VALUES (?, ?, ?, ?, ?)`,
    );
    const insertTask = database.prepare(
      `INSERT INTO tasks (id, title, description, status, priority, deadline,
                          category_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    );

    insertCategory.run(2, 'Pribadi', 1, 1, '2026-01-02 03:04:05');
    insertCategory.run(7, 'Arsip', 0, 9, '2026-02-03 04:05:06');

    insertTask.run(
      3,
      'Tugas kategori',
      'Deskripsi tugas',
      'In Progress',
      'High',
      '2026-12-31',
      7,
      '2026-03-04 05:06:07',
    );
    insertTask.run(
      11,
      'Tanpa kategori',
      null,
      'Todo',
      'Low',
      null,
      null,
      '2026-04-05 06:07:08',
    );
    insertTask.run(
      20,
      'Tugas selesai',
      null,
      'Done',
      'Urgent',
      '2026-11-05',
      2,
      '2026-05-06 07:08:09',
    );
  } finally {
    database.close();
  }
}

function importFixture(options = {}) {
  return importSqliteToPostgres({
    sourcePath,
    databaseUrl: testConfig.databaseUrlUnpooled,
    ...options,
  });
}

async function snapshot() {
  const categories = await pool.query(
    `SELECT id, name, is_default, sort_order, created_at
     FROM categories
     ORDER BY id`,
  );
  const tasks = await pool.query(
    `SELECT id, title, description, status, priority, deadline::text AS deadline,
            category_id, created_at
     FROM tasks
     ORDER BY id`,
  );
  const categoriesSequence = await pool.query(
    'SELECT last_value::text AS last_value, is_called FROM categories_id_seq',
  );
  const tasksSequence = await pool.query(
    'SELECT last_value::text AS last_value, is_called FROM tasks_id_seq',
  );

  return {
    categories: categories.rows.map((row) => ({
      ...row,
      created_at: row.created_at.toISOString(),
    })),
    tasks: tasks.rows.map((row) => ({
      ...row,
      created_at: row.created_at.toISOString(),
    })),
    sequences: {
      categories: categoriesSequence.rows[0],
      tasks: tasksSequence.rows[0],
    },
  };
}

async function dropRejectTrigger() {
  await withUnpooledClient(async (client) => {
    await client.query(
      'DROP TRIGGER IF EXISTS reject_import_task ON tasks',
    );
    await client.query(
      'DROP FUNCTION IF EXISTS reject_import_task()',
    );
  });
}

beforeAll(async () => {
  await resetTestSchema();
  await runTestMigrations();
  pool = createTestPool();

  tempDirectory = fs.mkdtempSync(
    path.join(os.tmpdir(), 'task-manager-importer-'),
  );
  sourcePath = path.join(tempDirectory, 'tasks.db');
  createFixture(sourcePath);
  initialSourceHash = hashFile(sourcePath);
});

beforeEach(async () => {
  await truncateTestTables();
  await dropRejectTrigger();
});

afterAll(async () => {
  await pool?.end();
  await dropRejectTrigger();
  await resetTestSchema();

  if (tempDirectory) {
    fs.rmSync(tempDirectory, { recursive: true, force: true });
  }
});

describe('SQLite importer', () => {
  it('preserves IDs, relations, values, timestamps, and sequences', async () => {
    const report = await importFixture({ replace: true });

    expect(report).toMatchObject({
      dryRun: false,
      replace: true,
      matches: true,
      orphanTasks: 0,
      source: {
        categories: 2,
        tasks: 3,
        statusCounts: { Todo: 1, 'In Progress': 1, Done: 1 },
        priorityCounts: { Low: 1, High: 1, Urgent: 1 },
      },
    });

    const categories = await pool.query(
      `SELECT id, name, is_default, sort_order, created_at
       FROM categories
       ORDER BY id`,
    );
    const tasks = await pool.query(
      `SELECT id, title, description, status, priority, deadline::text AS deadline,
              category_id, created_at
       FROM tasks
       ORDER BY id`,
    );

    expect(
      categories.rows.map((row) => ({
        ...row,
        created_at: row.created_at.toISOString(),
      })),
    ).toEqual([
      {
        id: 2,
        name: 'Pribadi',
        is_default: true,
        sort_order: 1,
        created_at: '2026-01-02T03:04:05.000Z',
      },
      {
        id: 7,
        name: 'Arsip',
        is_default: false,
        sort_order: 9,
        created_at: '2026-02-03T04:05:06.000Z',
      },
    ]);

    expect(
      tasks.rows.map((row) => ({
        ...row,
        created_at: row.created_at.toISOString(),
      })),
    ).toEqual([
      {
        id: 3,
        title: 'Tugas kategori',
        description: 'Deskripsi tugas',
        status: 'In Progress',
        priority: 'High',
        deadline: '2026-12-31',
        category_id: 7,
        created_at: '2026-03-04T05:06:07.000Z',
      },
      {
        id: 11,
        title: 'Tanpa kategori',
        description: null,
        status: 'Todo',
        priority: 'Low',
        deadline: null,
        category_id: null,
        created_at: '2026-04-05T06:07:08.000Z',
      },
      {
        id: 20,
        title: 'Tugas selesai',
        description: null,
        status: 'Done',
        priority: 'Urgent',
        deadline: '2026-11-05',
        category_id: 2,
        created_at: '2026-05-06T07:08:09.000Z',
      },
    ]);

    expect(report.sequences.categories).toEqual({
      lastValue: '7',
      isCalled: true,
    });
    expect(report.sequences.tasks).toEqual({
      lastValue: '20',
      isCalled: true,
    });
    expect(hashFile(sourcePath)).toBe(initialSourceHash);
  });

  it('does not duplicate data when rerun with --replace and keeps dry-run read-only', async () => {
    await importFixture({ replace: true });
    const before = await snapshot();

    const dryRun = await importFixture({ dryRun: true });
    expect(dryRun.matches).toBe(true);
    expect(dryRun.requiresReplace).toBe(true);
    expect(await snapshot()).toEqual(before);

    await importFixture({ replace: true });
    expect(await snapshot()).toEqual(before);
    expect(hashFile(sourcePath)).toBe(initialSourceHash);
  });

  it('rejects a non-empty target without --replace without modifying it', async () => {
    await withUnpooledClient(async (client) => {
      await client.query(
        "INSERT INTO categories (name, is_default, sort_order) VALUES ('Existing', false, 1)",
      );
    });
    const before = await snapshot();

    await expect(importFixture()).rejects.toThrow(/tidak kosong/i);

    expect(await snapshot()).toEqual(before);
    expect(hashFile(sourcePath)).toBe(initialSourceHash);
  });

  it('rolls back all target changes when the import fails mid-transaction', async () => {
    const before = await snapshot();

    await withUnpooledClient(async (client) => {
      await client.query(`
        CREATE FUNCTION reject_import_task() RETURNS trigger
        LANGUAGE plpgsql
        AS $$
        BEGIN
          RAISE EXCEPTION 'simulasi kegagalan importer';
        END;
        $$
      `);
      await client.query(`
        CREATE TRIGGER reject_import_task
        BEFORE INSERT ON tasks
        FOR EACH ROW
        EXECUTE FUNCTION reject_import_task()
      `);
    });

    try {
      await expect(importFixture({ replace: true })).rejects.toThrow(
        /simulasi kegagalan importer/,
      );
    } finally {
      await dropRejectTrigger();
    }

    expect(await snapshot()).toEqual(before);
    expect(hashFile(sourcePath)).toBe(initialSourceHash);
  });

  it('fails clearly when the source file is missing', async () => {
    await expect(
      importSqliteToPostgres({
        sourcePath: path.join(tempDirectory, 'missing.db'),
        databaseUrl: testConfig.databaseUrlUnpooled,
        dryRun: true,
      }),
    ).rejects.toThrow(/File SQLite sumber tidak ditemukan/);
  });

  it('fails clearly when the database URL is missing', async () => {
    await expect(main(['--source', sourcePath, '--dry-run'], {})).rejects.toThrow(
      /DATABASE_URL_UNPOOLED wajib diisi/,
    );
  });
});
