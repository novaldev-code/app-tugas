import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const defaultMigrationsFolder = path.resolve(__dirname, '../drizzle');

export async function runMigrations({
  databaseUrl,
  migrationsFolder = defaultMigrationsFolder,
  pool,
} = {}) {
  if (!pool && !databaseUrl) {
    throw new Error('DATABASE_URL_UNPOOLED wajib diisi untuk migration.');
  }

  const migrationPool =
    pool ?? new pg.Pool({ connectionString: databaseUrl, max: 1 });

  try {
    await migrate(drizzle(migrationPool), {
      migrationsFolder,
      migrationsTable: 'schema_migrations',
    });
  } finally {
    if (!pool) {
      await migrationPool.end();
    }
  }
}
