import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';

export function createPostgresPool({
  connectionString,
  max = 5,
  connectionTimeoutMillis = 10000,
  idleTimeoutMillis = 30000,
} = {}) {
  if (!connectionString) {
    throw new Error('DATABASE_URL wajib diisi untuk koneksi PostgreSQL.');
  }

  return new pg.Pool({
    connectionString,
    max,
    connectionTimeoutMillis,
    idleTimeoutMillis,
  });
}

export function createPostgresDb(pool) {
  return drizzle(pool);
}

export async function closePostgresPool(pool) {
  if (pool && !pool.ended) {
    await pool.end();
  }
}
