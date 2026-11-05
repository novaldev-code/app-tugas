import 'dotenv/config';
import { runMigrations } from './migrate.js';

const databaseUrl = process.env.DATABASE_URL_UNPOOLED?.trim();

if (!databaseUrl) {
  throw new Error('DATABASE_URL_UNPOOLED wajib diisi untuk migration.');
}

await runMigrations({ databaseUrl });

console.log('Migrasi selesai.');
