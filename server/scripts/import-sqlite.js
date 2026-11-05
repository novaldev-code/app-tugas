import 'dotenv/config';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function defaultSourcePath() {
  return path.resolve(__dirname, '../data/tasks.db');
}

function fileHash(filePath) {
  return createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function assertSourceExists(sourcePath) {
  if (!fs.existsSync(sourcePath) || !fs.statSync(sourcePath).isFile()) {
    throw new Error(`File SQLite sumber tidak ditemukan: ${sourcePath}`);
  }
}

function integerId(value, label) {
  const id = Number(value);

  if (!Number.isInteger(id) || id < 1) {
    throw new Error(`${label} harus berupa integer positif.`);
  }

  return id;
}

export function parseSqliteTimestamp(value, label = 'timestamp') {
  const text = String(value ?? '').trim();

  if (!text) {
    throw new Error(`${label} tidak boleh kosong.`);
  }

  let normalized = text;

  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(?:\.\d+)?$/.test(text)) {
    normalized = `${text.replace(' ', 'T')}Z`;
  } else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?$/.test(text)) {
    normalized = `${text}Z`;
  }

  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`${label} bukan timestamp yang valid: ${text}`);
  }

  return date;
}

export function readSqliteSource(sourcePath) {
  assertSourceExists(sourcePath);

  const database = new Database(sourcePath, {
    readonly: true,
    fileMustExist: true,
  });

  try {
    database.pragma('query_only = ON');

    const categories = database
      .prepare(
        `SELECT id, name, is_default, sort_order, created_at
         FROM categories
         ORDER BY id`,
      )
      .all()
      .map((row) => ({
        id: integerId(row.id, `categories.id=${row.id}`),
        name: String(row.name),
        isDefault: Boolean(row.is_default),
        sortOrder: Number(row.sort_order),
        createdAt: parseSqliteTimestamp(
          row.created_at,
          `categories.id=${row.id}.created_at`,
        ),
      }));

    const tasks = database
      .prepare(
        `SELECT id, title, description, status, priority, deadline,
                category_id, created_at
         FROM tasks
         ORDER BY id`,
      )
      .all()
      .map((row) => ({
        id: integerId(row.id, `tasks.id=${row.id}`),
        title: String(row.title),
        description: row.description ?? null,
        status: String(row.status),
        priority: String(row.priority),
        deadline: row.deadline ?? null,
        categoryId:
          row.category_id === null
            ? null
            : integerId(row.category_id, `tasks.id=${row.id}.category_id`),
        createdAt: parseSqliteTimestamp(
          row.created_at,
          `tasks.id=${row.id}.created_at`,
        ),
      }));

    return { categories, tasks };
  } catch (error) {
    throw new Error(`Gagal membaca sumber SQLite: ${error.message}`, {
      cause: error,
    });
  } finally {
    database.close();
  }
}

async function readTargetData(client) {
  const categories = await client.query(
    `SELECT id, name, is_default AS "isDefault", sort_order AS "sortOrder",
            created_at AS "createdAt"
     FROM categories
     ORDER BY id`,
  );
  const tasks = await client.query(
    `SELECT id, title, description, status, priority, deadline::text AS deadline,
            category_id AS "categoryId", created_at AS "createdAt"
     FROM tasks
     ORDER BY id`,
  );

  return {
    categories: categories.rows.map((row) => ({
      id: Number(row.id),
      name: row.name,
      isDefault: Boolean(row.isDefault),
      sortOrder: Number(row.sortOrder),
      createdAt: row.createdAt,
    })),
    tasks: tasks.rows.map((row) => ({
      id: Number(row.id),
      title: row.title,
      description: row.description ?? null,
      status: row.status,
      priority: row.priority,
      deadline: row.deadline ?? null,
      categoryId: row.categoryId === null ? null : Number(row.categoryId),
      createdAt: row.createdAt,
    })),
  };
}

function countBy(rows, field) {
  const counts = {};

  for (const row of rows) {
    counts[row[field]] = (counts[row[field]] ?? 0) + 1;
  }

  return counts;
}

function normalizeCategory(row) {
  return [
    Number(row.id),
    row.name,
    Boolean(row.isDefault),
    Number(row.sortOrder),
    new Date(row.createdAt).getTime(),
  ];
}

function normalizeTask(row) {
  return [
    Number(row.id),
    row.title,
    row.description ?? null,
    row.status,
    row.priority,
    row.deadline ?? null,
    row.categoryId === null ? null : Number(row.categoryId),
    new Date(row.createdAt).getTime(),
  ];
}

function compareRows(sourceRows, targetRows, normalize, label, differences) {
  if (sourceRows.length !== targetRows.length) {
    differences.push(
      `${label}: jumlah sumber ${sourceRows.length}, target ${targetRows.length}`,
    );
    return;
  }

  for (let index = 0; index < sourceRows.length; index += 1) {
    const source = normalize(sourceRows[index]);
    const target = normalize(targetRows[index]);

    if (JSON.stringify(source) !== JSON.stringify(target)) {
      differences.push(
        `${label}: ID ${sourceRows[index].id} tidak sesuai dengan target`,
      );
    }
  }
}

function compareDatasets(source, target) {
  const differences = [];

  compareRows(
    source.categories,
    target.categories,
    normalizeCategory,
    'Kategori',
    differences,
  );
  compareRows(source.tasks, target.tasks, normalizeTask, 'Tugas', differences);

  return {
    matches: differences.length === 0,
    differences,
  };
}

async function insertCategories(client, categories) {
  for (const category of categories) {
    await client.query(
      `INSERT INTO categories (id, name, is_default, sort_order, created_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        category.id,
        category.name,
        category.isDefault,
        category.sortOrder,
        category.createdAt.toISOString(),
      ],
    );
  }
}

async function insertTasks(client, tasks) {
  for (const task of tasks) {
    await client.query(
      `INSERT INTO tasks (id, title, description, status, priority, deadline,
                          category_id, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        task.id,
        task.title,
        task.description,
        task.status,
        task.priority,
        task.deadline,
        task.categoryId,
        task.createdAt.toISOString(),
      ],
    );
  }
}

async function resetSequence(client, table) {
  const sequence = await client.query(
    "SELECT pg_get_serial_sequence($1, 'id') AS name",
    [table],
  );
  const sequenceName = sequence.rows[0]?.name;

  if (!sequenceName) {
    throw new Error(`Sequence identity untuk tabel ${table} tidak ditemukan.`);
  }

  const maximum = await client.query(
    `SELECT max(id)::int AS "maxId" FROM ${table}`,
  );
  const maxId = maximum.rows[0].maxId;

  await client.query('SELECT setval($1::regclass, $2, $3)', [
    sequenceName,
    maxId ?? 1,
    maxId !== null,
  ]);

  const state = await client.query(
    `SELECT last_value::text AS "lastValue", is_called AS "isCalled"
     FROM ${sequenceName}`,
  );
  const expected = maxId ?? 1;

  if (
    Number(state.rows[0].lastValue) !== expected ||
    state.rows[0].isCalled !== (maxId !== null)
  ) {
    throw new Error(`Verifikasi sequence ${table} gagal.`);
  }

  return state.rows[0];
}

async function readOrphanTaskCount(client) {
  const result = await client.query(
    `SELECT count(*)::int AS count
     FROM tasks t
     LEFT JOIN categories c ON c.id = t.category_id
     WHERE t.category_id IS NOT NULL AND c.id IS NULL`,
  );

  return result.rows[0].count;
}

function buildReport({ source, target, dryRun, replace, differences, sequences, orphanTasks }) {
  return {
    dryRun,
    replace,
    source: {
      categories: source.categories.length,
      tasks: source.tasks.length,
      statusCounts: countBy(source.tasks, 'status'),
      priorityCounts: countBy(source.tasks, 'priority'),
    },
    target: {
      categories: target.categories.length,
      tasks: target.tasks.length,
      statusCounts: countBy(target.tasks, 'status'),
      priorityCounts: countBy(target.tasks, 'priority'),
    },
    matches: differences.length === 0,
    differences,
    sequences,
    orphanTasks,
  };
}

export async function importSqliteToPostgres({
  sourcePath = defaultSourcePath(),
  databaseUrl,
  dryRun = false,
  replace = false,
} = {}) {
  const resolvedSourcePath = path.resolve(sourcePath);
  const connectionString = databaseUrl?.trim();

  assertSourceExists(resolvedSourcePath);

  if (!connectionString) {
    throw new Error('DATABASE_URL_UNPOOLED wajib diisi untuk importer.');
  }

  const sourceHashBefore = fileHash(resolvedSourcePath);
  const source = readSqliteSource(resolvedSourcePath);
  const sourceHashAfter = fileHash(resolvedSourcePath);

  if (sourceHashBefore !== sourceHashAfter) {
    throw new Error('File SQLite sumber berubah saat dibaca.');
  }

  const client = new pg.Client({
    connectionString,
    connectionTimeoutMillis: 15000,
  });

  await client.connect();

  try {
    if (dryRun) {
      const target = await readTargetData(client);
      const comparison = compareDatasets(source, target);
      const orphanTasks = await readOrphanTaskCount(client);
      const targetEmpty =
        target.categories.length === 0 && target.tasks.length === 0;

      return {
        ...buildReport({
          source,
          target,
          dryRun,
          replace,
          differences: comparison.differences,
          sequences: null,
          orphanTasks,
        }),
        sourceHash: sourceHashBefore,
        requiresReplace: !targetEmpty && !replace,
      };
    }

    await client.query('BEGIN');

    try {
      const targetBefore = await readTargetData(client);
      const targetEmpty =
        targetBefore.categories.length === 0 && targetBefore.tasks.length === 0;

      if (!targetEmpty && !replace) {
        throw new Error(
          'Target PostgreSQL tidak kosong. Gunakan --replace untuk mengganti seluruh data target.',
        );
      }

      if (replace) {
        await client.query('TRUNCATE TABLE tasks, categories CASCADE');
      }

      await insertCategories(client, source.categories);
      await insertTasks(client, source.tasks);

      const sequences = {
        categories: await resetSequence(client, 'categories'),
        tasks: await resetSequence(client, 'tasks'),
      };
      const target = await readTargetData(client);
      const comparison = compareDatasets(source, target);
      const orphanTasks = await readOrphanTaskCount(client);

      if (!comparison.matches || orphanTasks !== 0) {
        const details = comparison.differences.join('; ');
        throw new Error(
          `Verifikasi impor gagal.${details ? ` ${details}` : ''}${
            orphanTasks !== 0 ? ` Tugas orphan: ${orphanTasks}.` : ''
          }`,
        );
      }

      await client.query('COMMIT');

      return {
        ...buildReport({
          source,
          target,
          dryRun,
          replace,
          differences: comparison.differences,
          sequences,
          orphanTasks,
        }),
        sourceHash: sourceHashBefore,
        requiresReplace: false,
      };
    } catch (error) {
      await client.query('ROLLBACK').catch(() => {});
      throw error;
    }
  } finally {
    await client.end().catch(() => {});
  }
}

const usage = `Penggunaan: node scripts/import-sqlite.js [opsi]

Opsi:
  --source <path>   Path file SQLite sumber (default: server/data/tasks.db)
  --dry-run         Bandingkan sumber dan target tanpa menulis
  --replace         Ganti seluruh data target dalam satu transaksi
  --help            Tampilkan bantuan

Koneksi target dibaca dari DATABASE_URL_UNPOOLED.`;

export function parseImporterArgs(argv = []) {
  let sourcePath;
  let dryRun = false;
  let replace = false;
  let help = false;

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];

    if (argument === '--dry-run') {
      dryRun = true;
    } else if (argument === '--replace') {
      replace = true;
    } else if (argument === '--help' || argument === '-h') {
      help = true;
    } else if (argument === '--source') {
      sourcePath = argv[index + 1];

      if (!sourcePath) {
        throw new Error('Opsi --source membutuhkan path file SQLite.');
      }

      index += 1;
    } else if (argument.startsWith('--source=')) {
      sourcePath = argument.slice('--source='.length);

      if (!sourcePath) {
        throw new Error('Opsi --source membutuhkan path file SQLite.');
      }
    } else if (argument.startsWith('-')) {
      throw new Error(`Opsi tidak dikenal: ${argument}`);
    } else if (sourcePath) {
      throw new Error('Path sumber SQLite hanya boleh diberikan sekali.');
    } else {
      sourcePath = argument;
    }
  }

  return { sourcePath, dryRun, replace, help };
}

function printReport(report) {
  const mode = report.dryRun ? 'Dry run' : 'Impor';
  console.log(
    `${mode}: ${report.source.categories} kategori dan ${report.source.tasks} tugas pada sumber.`,
  );
  console.log(
    `Target saat ini: ${report.target.categories} kategori dan ${report.target.tasks} tugas.`,
  );

  if (report.dryRun) {
    console.log(
      report.matches
        ? 'Target sudah sesuai dengan sumber.'
        : 'Target belum sesuai dengan sumber.',
    );

    if (report.requiresReplace) {
      console.log('Target berisi data; gunakan --replace saat menjalankan impor.');
    }

    return;
  }

  console.log(
    `Impor selesai. Target berisi ${report.target.categories} kategori dan ${report.target.tasks} tugas.`,
  );
}

export async function main(argv = process.argv.slice(2), env = process.env) {
  const options = parseImporterArgs(argv);

  if (options.help) {
    console.log(usage);
    return { help: true };
  }

  const sourcePath = path.resolve(options.sourcePath ?? defaultSourcePath());
  assertSourceExists(sourcePath);

  const databaseUrl = env.DATABASE_URL_UNPOOLED?.trim();

  if (!databaseUrl) {
    throw new Error('DATABASE_URL_UNPOOLED wajib diisi untuk importer.');
  }

  const report = await importSqliteToPostgres({
    sourcePath,
    databaseUrl,
    dryRun: options.dryRun,
    replace: options.replace,
  });

  printReport(report);

  return report;
}

const isMainModule =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isMainModule) {
  main().catch((error) => {
    console.error(`Impor gagal: ${error.message}`);
    process.exitCode = 1;
  });
}
