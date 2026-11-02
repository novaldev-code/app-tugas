import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import {
  ConflictError,
  HttpError,
  NotFoundError,
  ValidationError,
} from './errors.js';
import {
  PRIORITIES,
  STATUSES,
  isOverdue,
  normalizeCategoryId,
  normalizeCategoryName,
  normalizeDeadline,
  normalizeDescription,
  normalizePriority,
  normalizeStatus,
  normalizeTitle,
} from './validation.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const TASK_SELECT = `
  SELECT t.*, c.name AS category_name
  FROM tasks t
  LEFT JOIN categories c ON c.id = t.category_id
`;

function mapTask(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    deadline: row.deadline,
    category_id: row.category_id,
    category_name: row.category_name ?? null,
    created_at: row.created_at,
    overdue: isOverdue(row.deadline, row.status),
  };
}

function mapCategory(row) {
  return {
    id: row.id,
    name: row.name,
    is_default: Boolean(row.is_default),
    sort_order: row.sort_order,
    created_at: row.created_at,
  };
}

function parseId(value, entity) {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    throw new NotFoundError(`${entity} tidak ditemukan.`);
  }

  return id;
}

function getTaskRow(db, id) {
  const row = db.prepare(`${TASK_SELECT} WHERE t.id = ?`).get(id);

  if (!row) {
    throw new NotFoundError('Tugas tidak ditemukan.');
  }

  return row;
}

function getTask(db, id) {
  return mapTask(getTaskRow(db, id));
}

function getCategoryRow(db, id) {
  const row = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);

  if (!row) {
    throw new NotFoundError('Kategori tidak ditemukan.');
  }

  return row;
}

function getCategory(db, id) {
  return mapCategory(getCategoryRow(db, id));
}

function ensureCategory(db, id) {
  if (id === null) {
    return;
  }

  const row = db.prepare('SELECT id FROM categories WHERE id = ?').get(id);

  if (!row) {
    throw new ValidationError('Kategori tidak ditemukan.', {
      category_id: 'Kategori tidak ditemukan.',
    });
  }
}

function escapeLike(value) {
  return value.replace(/[\\%_]/g, '\\$&');
}

const categoryCollator = new Intl.Collator('id', { sensitivity: 'base' });

function sortCategories(rows) {
  return [...rows].sort((left, right) => {
    if (left.is_default !== right.is_default) {
      return right.is_default - left.is_default;
    }

    if (left.is_default) {
      const bySortOrder = left.sort_order - right.sort_order;

      if (bySortOrder !== 0) {
        return bySortOrder;
      }
    }

    const byName = categoryCollator.compare(left.name, right.name);

    if (byName !== 0) {
      return byName;
    }

    return left.id - right.id;
  });
}

export function createApp(db) {
  const app = express();

  app.use(express.json({ limit: '1mb' }));

  app.get('/api/tasks', (req, res) => {
    const where = [];
    const params = [];

    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';

    if (search) {
      const pattern = `%${escapeLike(search)}%`;
      where.push(
        `(t.title LIKE ? ESCAPE '\\' OR IFNULL(t.description, '') LIKE ? ESCAPE '\\')`,
      );
      params.push(pattern, pattern);
    }

    const categoryFilter =
      typeof req.query.category_id === 'string' ? req.query.category_id.trim() : '';

    if (categoryFilter && categoryFilter !== 'all') {
      if (categoryFilter === 'none' || categoryFilter === 'null') {
        where.push('t.category_id IS NULL');
      } else {
        where.push('t.category_id = ?');
        params.push(normalizeCategoryId(categoryFilter));
      }
    }

    const statusFilter = typeof req.query.status === 'string' ? req.query.status : '';

    if (statusFilter && statusFilter !== 'all') {
      if (!STATUSES.includes(statusFilter)) {
        throw new ValidationError('Filter status tidak valid.', {
          status: 'Filter status tidak valid.',
        });
      }

      where.push('t.status = ?');
      params.push(statusFilter);
    }

    const priorityFilter =
      typeof req.query.priority === 'string' ? req.query.priority : '';

    if (priorityFilter && priorityFilter !== 'all') {
      if (!PRIORITIES.includes(priorityFilter)) {
        throw new ValidationError('Filter prioritas tidak valid.', {
          priority: 'Filter prioritas tidak valid.',
        });
      }

      where.push('t.priority = ?');
      params.push(priorityFilter);
    }

    const sort = typeof req.query.sort === 'string' ? req.query.sort : 'created_desc';
    let orderBy;

    if (sort === 'deadline_asc') {
      orderBy =
        'ORDER BY (t.deadline IS NULL) ASC, t.deadline ASC, t.created_at DESC, t.id DESC';
    } else if (sort === 'created_desc' || sort === '') {
      orderBy = 'ORDER BY t.created_at DESC, t.id DESC';
    } else {
      throw new ValidationError('Urutan tidak valid.', {
        sort: 'Urutan tidak valid.',
      });
    }

    const sql = `${TASK_SELECT}${
      where.length > 0 ? ` WHERE ${where.join(' AND ')}` : ''
    } ${orderBy}`;

    const rows = db.prepare(sql).all(...params);

    res.json({ success: true, data: rows.map(mapTask) });
  });

  app.post('/api/tasks', (req, res) => {
    const body = req.body ?? {};
    const title = normalizeTitle(body.title);
    const description = normalizeDescription(body.description);
    const status = normalizeStatus(body.status, { defaultValue: 'Todo' });
    const priority = normalizePriority(body.priority);
    const deadline = normalizeDeadline(body.deadline);
    const categoryId = normalizeCategoryId(body.category_id);

    ensureCategory(db, categoryId);

    const info = db
      .prepare(
        `INSERT INTO tasks (title, description, status, priority, deadline, category_id)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(title, description, status, priority, deadline, categoryId);

    res.status(201).json({
      success: true,
      data: getTask(db, info.lastInsertRowid),
    });
  });

  app.patch('/api/tasks/:id', (req, res) => {
    const id = parseId(req.params.id, 'Tugas');
    getTaskRow(db, id);

    const body = req.body ?? {};
    const fields = [];
    const values = [];

    if (Object.hasOwn(body, 'title')) {
      fields.push('title = ?');
      values.push(normalizeTitle(body.title));
    }

    if (Object.hasOwn(body, 'description')) {
      fields.push('description = ?');
      values.push(normalizeDescription(body.description));
    }

    if (Object.hasOwn(body, 'status')) {
      fields.push('status = ?');
      values.push(normalizeStatus(body.status));
    }

    if (Object.hasOwn(body, 'priority')) {
      fields.push('priority = ?');
      values.push(normalizePriority(body.priority));
    }

    if (Object.hasOwn(body, 'deadline')) {
      fields.push('deadline = ?');
      values.push(normalizeDeadline(body.deadline));
    }

    if (Object.hasOwn(body, 'category_id')) {
      const categoryId = normalizeCategoryId(body.category_id);
      ensureCategory(db, categoryId);
      fields.push('category_id = ?');
      values.push(categoryId);
    }

    if (fields.length > 0) {
      db.prepare(`UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`).run(
        ...values,
        id,
      );
    }

    res.json({ success: true, data: getTask(db, id) });
  });

  app.delete('/api/tasks/:id', (req, res) => {
    const id = parseId(req.params.id, 'Tugas');
    getTaskRow(db, id);
    db.prepare('DELETE FROM tasks WHERE id = ?').run(id);

    res.json({ success: true, data: { id } });
  });

  app.get('/api/categories', (_req, res) => {
    const rows = db.prepare('SELECT * FROM categories').all();
    res.json({ success: true, data: sortCategories(rows).map(mapCategory) });
  });

  app.post('/api/categories', (req, res) => {
    const body = req.body ?? {};
    const name = normalizeCategoryName(body.name);

    const existing = db
      .prepare('SELECT id FROM categories WHERE name = ? COLLATE NOCASE')
      .get(name);

    if (existing) {
      throw new ConflictError('Nama kategori sudah digunakan.', {
        name: 'Nama kategori sudah digunakan.',
      });
    }

    const maxSort = db
      .prepare('SELECT COALESCE(MAX(sort_order), 0) AS max FROM categories')
      .get().max;

    const info = db
      .prepare(
        'INSERT INTO categories (name, is_default, sort_order) VALUES (?, 0, ?)',
      )
      .run(name, maxSort + 1);

    res.status(201).json({
      success: true,
      data: getCategory(db, info.lastInsertRowid),
    });
  });

  app.patch('/api/categories/:id', (req, res) => {
    const id = parseId(req.params.id, 'Kategori');
    getCategoryRow(db, id);

    const body = req.body ?? {};
    const name = normalizeCategoryName(body.name);

    const existing = db
      .prepare(
        'SELECT id FROM categories WHERE name = ? COLLATE NOCASE AND id <> ?',
      )
      .get(name, id);

    if (existing) {
      throw new ConflictError('Nama kategori sudah digunakan.', {
        name: 'Nama kategori sudah digunakan.',
      });
    }

    db.prepare('UPDATE categories SET name = ? WHERE id = ?').run(name, id);

    res.json({ success: true, data: getCategory(db, id) });
  });

  app.delete('/api/categories/:id', (req, res) => {
    const id = parseId(req.params.id, 'Kategori');
    getCategoryRow(db, id);
    db.prepare('DELETE FROM categories WHERE id = ?').run(id);

    res.json({ success: true, data: { id } });
  });

  app.get('/api/dashboard/stats', (_req, res) => {
    const byStatus = Object.fromEntries(STATUSES.map((status) => [status, 0]));
    const byPriority = Object.fromEntries(
      PRIORITIES.map((priority) => [priority, 0]),
    );

    for (const row of db
      .prepare('SELECT status, COUNT(*) AS count FROM tasks GROUP BY status')
      .all()) {
      byStatus[row.status] = row.count;
    }

    for (const row of db
      .prepare('SELECT priority, COUNT(*) AS count FROM tasks GROUP BY priority')
      .all()) {
      byPriority[row.priority] = row.count;
    }

    const total = db.prepare('SELECT COUNT(*) AS count FROM tasks').get().count;

    res.json({
      success: true,
      data: { total, byStatus, byPriority },
    });
  });

  app.use('/api', (_req, res) => {
    res.status(404).json({
      success: false,
      message: 'Endpoint tidak ditemukan.',
      errors: {},
    });
  });

  const clientDist = path.resolve(__dirname, '../../client/dist');

  if (fs.existsSync(clientDist)) {
    app.use(express.static(clientDist));

    app.use((req, res, next) => {
      if (req.method === 'GET' && !req.path.startsWith('/api')) {
        return res.sendFile(path.join(clientDist, 'index.html'));
      }

      return next();
    });
  }

  app.use((err, _req, res, _next) => {
    if (err?.type === 'entity.parse.failed') {
      return res.status(400).json({
        success: false,
        message: 'Body JSON tidak valid.',
        errors: {},
      });
    }

    if (err instanceof HttpError) {
      return res.status(err.status).json({
        success: false,
        message: err.message,
        errors: err.errors ?? {},
      });
    }

    console.error(err);

    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server.',
      errors: {},
    });
  });

  return app;
}
