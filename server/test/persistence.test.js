import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { createDatabase } from '../src/db.js';
import { runMigrations } from '../src/migrate.js';

let tempDir;
let dbPath;

beforeEach(() => {
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ptm-persistence-'));
  dbPath = path.join(tempDir, 'tasks.db');
});

afterEach(() => {
  fs.rmSync(tempDir, { recursive: true, force: true });
});

describe('persistence', () => {
  it('keeps tasks and renamed default categories after restart', async () => {
    let db = createDatabase(dbPath);
    runMigrations(db);
    let app = createApp(db);

    const renamed = await request(app)
      .patch('/api/categories/1')
      .send({ name: 'Keluarga' })
      .expect(200);

    expect(renamed.body.data).toMatchObject({
      name: 'Keluarga',
      is_default: true,
    });

    await request(app)
      .post('/api/tasks')
      .send({ title: 'Tugas persisten', priority: 'High', category_id: 1 })
      .expect(201);

    db.close();

    db = createDatabase(dbPath);
    runMigrations(db);
    app = createApp(db);

    const categories = await request(app).get('/api/categories').expect(200);

    expect(categories.body.data).toHaveLength(3);
    expect(categories.body.data[0]).toMatchObject({
      name: 'Keluarga',
      is_default: true,
    });

    const tasks = await request(app).get('/api/tasks').expect(200);

    expect(tasks.body.data).toHaveLength(1);
    expect(tasks.body.data[0]).toMatchObject({
      title: 'Tugas persisten',
      category_name: 'Keluarga',
    });

    db.close();
  });
});
