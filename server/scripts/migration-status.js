import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsFolder = path.resolve(__dirname, '../drizzle');
const journalPath = path.join(migrationsFolder, 'meta/_journal.json');
const databaseUrl = process.env.DATABASE_URL_UNPOOLED?.trim();

if (!databaseUrl) {
  throw new Error('DATABASE_URL_UNPOOLED wajib diisi untuk memeriksa migration.');
}

const journal = JSON.parse(fs.readFileSync(journalPath, 'utf8'));
const client = new pg.Client({
  connectionString: databaseUrl,
  connectionTimeoutMillis: 15000,
});

await client.connect();

try {
  const migrationTable = await client.query(
    "SELECT to_regclass('drizzle.schema_migrations') AS table_name",
  );
  let appliedMarkers = [];

  if (migrationTable.rows[0].table_name) {
    const applied = await client.query(
      'SELECT created_at FROM drizzle.schema_migrations ORDER BY id',
    );
    appliedMarkers = applied.rows.map((row) => String(row.created_at));
  }

  const appliedSet = new Set(appliedMarkers);
  const pending = journal.entries.filter(
    (entry) => !appliedSet.has(String(entry.when)),
  );

  console.log(`Migration tercatat: ${appliedMarkers.length}`);
  console.log(`Migration pending: ${pending.length}`);

  for (const entry of pending) {
    console.log(`- ${entry.tag}`);
  }

  if (pending.length === 0) {
    console.log('Tidak ada migration pending.');
  }

  if (process.argv.includes('--check') && pending.length > 0) {
    process.exitCode = 2;
  }
} finally {
  await client.end();
}
