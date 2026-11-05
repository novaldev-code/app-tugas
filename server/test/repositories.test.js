import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  closePostgresPool,
  createPostgresDb,
  createPostgresPool,
} from '../src/db.js';
import {
  createCategory,
  deleteCategory,
  findCategoryByName,
  getCategoryById,
  listCategories,
  mapCategoryWriteError,
  renameCategory,
} from '../src/repositories/categories.js';
import { getTaskStats } from '../src/repositories/stats.js';
import {
  createTask,
  deleteTask,
  getTaskById,
  listTasks,
  updateTask,
} from '../src/repositories/tasks.js';
import {
  createAuthenticatedUser,
  resetTestSchema,
  runTestMigrations,
  testConfig,
  truncateTestTables,
} from './helpers/test-db.js';

let pool;
let db;
let userId;

beforeAll(async () => {
  await resetTestSchema();
  await runTestMigrations();
  pool = createPostgresPool({
    connectionString: testConfig.databaseUrl,
    max: 2,
    connectionTimeoutMillis: 15000,
  });
  db = createPostgresDb(pool);
});

beforeEach(async () => {
  await truncateTestTables();
  const auth = await createAuthenticatedUser();
  userId = auth.user.id;
});

afterAll(async () => {
  await closePostgresPool(pool);
  await resetTestSchema();
});

describe('task repository', () => {
  it('creates, reads, partially updates, and deletes a task', async () => {
    const created = await createTask(db, userId, {
      title: 'Tugas awal',
      description: 'Deskripsi',
      priority: 'High',
    });

    expect(created).toMatchObject({
      title: 'Tugas awal',
      description: 'Deskripsi',
      status: 'Todo',
      priority: 'High',
      deadline: null,
      categoryId: null,
      categoryName: null,
    });
    expect(Number.isInteger(created.id)).toBe(true);

    const fetched = await getTaskById(db, userId, created.id);
    expect(fetched.id).toBe(created.id);

    const updated = await updateTask(db, userId, created.id, {
      status: 'Done',
      description: null,
    });

    expect(updated).toMatchObject({
      id: created.id,
      title: 'Tugas awal',
      description: null,
      status: 'Done',
      priority: 'High',
    });

    await expect(deleteTask(db, userId, created.id)).resolves.toBe(true);
    await expect(getTaskById(db, userId, created.id)).resolves.toBeNull();
    await expect(deleteTask(db, userId, created.id)).resolves.toBe(false);
  });

  it('joins category names and searches case-insensitively with escaped wildcards', async () => {
    await createTask(db, userId, {
      title: 'Alpha',
      description: 'Beta gamma',
      priority: 'Medium',
      categoryId: 1,
    });
    await createTask(db, userId, {
      title: 'Diskon 100%',
      priority: 'Low',
    });
    await createTask(db, userId, { title: 'Biasa', priority: 'Low' });

    const withCategory = await listTasks(db, userId, { search: 'ALPHA' });

    expect(withCategory).toHaveLength(1);
    expect(withCategory[0]).toMatchObject({
      title: 'Alpha',
      categoryId: 1,
      categoryName: 'Pribadi',
    });

    const byDescription = await listTasks(db, userId, { search: 'gamma' });
    expect(byDescription.map((task) => task.title)).toEqual(['Alpha']);

    const wildcard = await listTasks(db, userId, { search: '%' });
    expect(wildcard.map((task) => task.title)).toEqual(['Diskon 100%']);
  });

  it('applies category, status, and priority filters with AND semantics', async () => {
    const custom = await createCategory(db, userId, { name: 'Proyek' });

    await createTask(db, userId, {
      title: 'Pribadi penting',
      priority: 'High',
      status: 'Todo',
      categoryId: 1,
    });
    await createTask(db, userId, {
      title: 'Proyek selesai',
      priority: 'Low',
      status: 'Done',
      categoryId: custom.id,
    });
    await createTask(db, userId, {
      title: 'Tanpa kategori',
      priority: 'High',
      status: 'Todo',
    });

    const uncategorized = await listTasks(db, userId, { categoryId: null });
    expect(uncategorized.map((task) => task.title)).toEqual(['Tanpa kategori']);

    const combined = await listTasks(db, userId, {
      status: 'Todo',
      priority: 'High',
    });
    expect(combined.map((task) => task.title).sort()).toEqual([
      'Pribadi penting',
      'Tanpa kategori',
    ]);

    const byCategory = await listTasks(db, userId, {
      categoryId: custom.id,
      status: 'Done',
    });
    expect(byCategory.map((task) => task.title)).toEqual(['Proyek selesai']);
  });

  it('sorts newest first and deadline ascending with nulls last', async () => {
    const first = await createTask(db, userId, {
      title: 'Jauh',
      priority: 'Low',
      deadline: '2099-01-01',
    });
    const second = await createTask(db, userId, {
      title: 'Dekat',
      priority: 'Low',
      deadline: '2098-01-01',
    });
    const third = await createTask(db, userId, {
      title: 'Tanpa deadline',
      priority: 'Low',
    });

    const newest = await listTasks(db, userId);
    expect(newest.map((task) => task.id)).toEqual([
      third.id,
      second.id,
      first.id,
    ]);

    const byDeadline = await listTasks(db, userId, { sort: 'deadline_asc' });
    expect(byDeadline.map((task) => task.id)).toEqual([
      second.id,
      first.id,
      third.id,
    ]);
  });
});

describe('category repository', () => {
  it('lists defaults first and new categories alphabetically after them', async () => {
    await createCategory(db, userId, { name: 'Hobi' });
    await createCategory(db, userId, { name: 'Arsip' });

    const categories = await listCategories(db, userId);

    expect(categories.map((category) => category.name)).toEqual([
      'Pribadi',
      'Pekerjaan',
      'Belajar',
      'Arsip',
      'Hobi',
    ]);
    expect(categories.at(-1).isDefault).toBe(false);
  });

  it('rejects duplicate names case-insensitively and maps unique violations', async () => {
    await createCategory(db, userId, { name: 'Hobi' });

    await expect(createCategory(db, userId, { name: 'hobi' })).rejects.toMatchObject({
      status: 409,
      errors: { name: 'Nama kategori sudah digunakan.' },
    });

    const mapped = mapCategoryWriteError({ code: '23505' });
    expect(mapped).toMatchObject({ status: 409 });
    const original = new Error('lain');
    expect(mapCategoryWriteError(original)).toBe(original);
  });

  it('renames a default category without losing its default flag', async () => {
    const renamed = await renameCategory(db, userId, 1, { name: 'Personal' });

    expect(renamed).toMatchObject({
      id: 1,
      name: 'Personal',
      isDefault: true,
    });
    await expect(
      renameCategory(db, userId, 1, { name: 'Pekerjaan' }),
    ).rejects.toMatchObject({ status: 409 });
  });

  it('finds categories case-insensitively and deletes with task FK nulling', async () => {
    const custom = await createCategory(db, userId, { name: 'Sementara' });
    const task = await createTask(db, userId, {
      title: 'Tugas sementara',
      priority: 'Medium',
      categoryId: custom.id,
    });

    const found = await findCategoryByName(db, userId, 'sementara');
    expect(found.id).toBe(custom.id);
    expect(await getCategoryById(db, userId, 9999)).toBeNull();

    await expect(deleteCategory(db, userId, custom.id)).resolves.toBe(true);

    const updated = await getTaskById(db, userId, task.id);
    expect(updated).toMatchObject({
      categoryId: null,
      categoryName: null,
    });
  });
});

describe('stats repository', () => {
  it('returns totals and status/priority counts as numbers', async () => {
    await createTask(db, userId, { title: 'Satu', priority: 'High', status: 'Todo' });
    await createTask(db, userId, { title: 'Dua', priority: 'High', status: 'Done' });
    await createTask(db, userId, {
      title: 'Tiga',
      priority: 'Low',
      status: 'In Progress',
    });

    const stats = await getTaskStats(db, userId);

    expect(stats).toEqual({
      total: 3,
      byStatus: { Todo: 1, 'In Progress': 1, Done: 1 },
      byPriority: { Low: 1, Medium: 0, High: 2, Urgent: 0 },
    });
    expect(typeof stats.total).toBe('number');
    expect(typeof stats.byStatus.Todo).toBe('number');
    expect(typeof stats.byPriority.High).toBe('number');
  });
});
