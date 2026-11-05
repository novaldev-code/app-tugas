import { sql } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import {
  closePostgresPool,
  createPostgresDb,
  createPostgresPool,
} from '../src/db.js';
import { testConfig } from './helpers/test-db.js';

describe('PostgreSQL connection factory', () => {
  it('connects to the test branch, runs SELECT 1, and closes cleanly', async () => {
    const pool = createPostgresPool({
      connectionString: testConfig.databaseUrl,
      max: 1,
      connectionTimeoutMillis: 15000,
      idleTimeoutMillis: 1000,
    });
    const db = createPostgresDb(pool);
    let result;

    for (let attempt = 1; attempt <= 5; attempt += 1) {
      try {
        result = await db.execute(sql`SELECT 1 AS value`);
        break;
      } catch (error) {
        if (attempt === 5) {
          throw error;
        }

        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    expect(result?.rows[0].value).toBe(1);

    await closePostgresPool(pool);

    expect(pool.ended).toBe(true);
    expect(pool.totalCount).toBe(0);
    expect(pool.idleCount).toBe(0);
  });
});
