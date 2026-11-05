import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

const databaseUrl = process.env.DATABASE_URL_UNPOOLED;

export default defineConfig({
  schema: './src/schema.js',
  out: './drizzle',
  dialect: 'postgresql',
  ...(databaseUrl ? { dbCredentials: { url: databaseUrl } } : {}),
});
