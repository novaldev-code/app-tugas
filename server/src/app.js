import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sql } from 'drizzle-orm';
import cors from 'cors';
import express from 'express';
import {
  serializeClearedSessionCookie,
  serializeSessionCookie,
} from './auth/cookies.js';
import { matchesCsrfToken } from './auth/csrf.js';
import { createRateLimiter } from './auth/rate-limit.js';
import { createAuthMiddleware } from './auth/middleware.js';
import {
  ConflictError,
  ForbiddenError,
  HttpError,
  NotFoundError,
  RateLimitError,
  ValidationError,
} from './errors.js';
import {
  createCategory,
  deleteCategory,
  getCategoryById,
  listCategories,
  renameCategory,
} from './repositories/categories.js';
import {
  mapCategoryRecord,
  mapTaskRecord,
} from './repositories/mappers.js';
import { getTaskStats } from './repositories/stats.js';
import {
  createTask,
  deleteTask,
  getTaskById,
  listTasks,
  updateTask,
} from './repositories/tasks.js';
import { mapUser } from './repositories/users.js';
import {
  loginUser,
  logoutUser,
  registerUser,
} from './services/auth.js';
import {
  PRIORITIES,
  STATUSES,
  normalizeCategoryId,
  normalizeCategoryName,
  normalizeDeadline,
  normalizeDescription,
  normalizePriority,
  normalizeStatus,
  normalizeTitle,
} from './validation.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function parseId(value, entity) {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    throw new NotFoundError(`${entity} tidak ditemukan.`);
  }

  return id;
}

async function ensureCategoryExists(db, userId, id) {
  if (id === null) {
    return;
  }

  const category = await getCategoryById(db, userId, id);

  if (!category) {
    throw new ValidationError('Kategori tidak ditemukan.', {
      category_id: 'Kategori tidak ditemukan.',
    });
  }
}

function withTimeout(promise, timeoutMs) {
  let timeoutId;

  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timeoutId = setTimeout(
        () => reject(new Error('Health check timeout')),
        timeoutMs,
      );
    }),
  ]).finally(() => clearTimeout(timeoutId));
}

function translateDatabaseError(error) {
  if (!error || typeof error !== 'object') {
    return null;
  }

  if (error.code === '23505') {
    return new ConflictError('Nama kategori sudah digunakan.', {
      name: 'Nama kategori sudah digunakan.',
    });
  }

  if (
    error.code === '23503' ||
    error.code === '23514' ||
    error.code === '22P02' ||
    error.code === '22007' ||
    error.code === '22008' ||
    error.code === '22001'
  ) {
    return new ValidationError('Data tidak valid.', {});
  }

  return null;
}

function rateLimitKey(req, email) {
  const address = req.ip || req.socket?.remoteAddress || 'unknown';
  return `${address}:${String(email ?? '').trim().toLowerCase()}`;
}

function sessionResponse(user, session) {
  return {
    user: mapUser(user),
    csrf_token: session.csrfToken,
    expires_at: session.expiresAt.toISOString(),
  };
}

export function createApp(
  db,
  {
    corsOrigins = [],
    healthCheckTimeoutMs = 2000,
    auth = {},
    serveClient = true,
  } = {},
) {
  const app = express();
  const allowedOrigins = corsOrigins.filter((origin) => origin !== '*');
  const allowedOriginSet = new Set(allowedOrigins);
  const {
    cookieName = 'ptm_session',
    cookieSecure = false,
    cookieSameSite = 'Lax',
    sessionTtlHours = 168,
    rateLimitOptions = {},
  } = auth;
  const authMiddleware = createAuthMiddleware({
    db,
    cookieName,
    allowedOrigins,
  });
  const authRateLimiter = createRateLimiter(rateLimitOptions);

  function setSessionCookie(res, session) {
    res.append(
      'Set-Cookie',
      serializeSessionCookie({
        name: cookieName,
        value: session.token,
        maxAge: sessionTtlHours * 60 * 60,
        secure: cookieSecure,
        sameSite: cookieSameSite,
      }),
    );
  }

  function clearSessionCookie(res) {
    res.append(
      'Set-Cookie',
      serializeClearedSessionCookie({
        name: cookieName,
        secure: cookieSecure,
        sameSite: cookieSameSite,
      }),
    );
  }

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || allowedOriginSet.has(origin)) {
          return callback(null, true);
        }

        return callback(null, false);
      },
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'X-CSRF-Token'],
      optionsSuccessStatus: 204,
    }),
  );

  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', async (_req, res) => {
    res.set('Cache-Control', 'no-store');

    try {
      await withTimeout(db.execute(sql`SELECT 1`), healthCheckTimeoutMs);
      return res.status(200).json({ status: 'ok' });
    } catch {
      console.error('Health check database gagal.');
      return res.status(503).json({ status: 'unhealthy' });
    }
  });

  app.post(
    '/api/auth/register',
    authMiddleware.requireTrustedOrigin,
    authMiddleware.requireJsonContentType,
    async (req, res) => {
      const body = req.body ?? {};
      const rate = authRateLimiter.check(rateLimitKey(req, body.email));

      if (!rate.allowed) {
        throw new RateLimitError(
          'Terlalu banyak percobaan. Coba lagi nanti.',
          Math.ceil(rate.retryAfterMs / 1000),
        );
      }

      const result = await registerUser(db, body, { sessionTtlHours });
      setSessionCookie(res, result.session);

      res.status(201).json({
        success: true,
        data: sessionResponse(result.user, result.session),
      });
    },
  );

  app.post(
    '/api/auth/login',
    authMiddleware.requireTrustedOrigin,
    authMiddleware.requireJsonContentType,
    async (req, res) => {
      const body = req.body ?? {};
      const rate = authRateLimiter.check(rateLimitKey(req, body.email));

      if (!rate.allowed) {
        throw new RateLimitError(
          'Terlalu banyak percobaan. Coba lagi nanti.',
          Math.ceil(rate.retryAfterMs / 1000),
        );
      }

      const result = await loginUser(db, body, { sessionTtlHours });
      setSessionCookie(res, result.session);

      res.json({
        success: true,
        data: sessionResponse(result.user, result.session),
      });
    },
  );

  app.post(
    '/api/auth/logout',
    authMiddleware.requireTrustedOrigin,
    async (req, res) => {
      const authResult = await authMiddleware.loadSession(req);

      if (authResult) {
        const provided = req.get('X-CSRF-Token');

        if (!matchesCsrfToken(authResult.session.csrfToken, provided)) {
          throw new ForbiddenError('Token CSRF tidak valid.');
        }

        await logoutUser(db, authResult.session);
      }

      clearSessionCookie(res);
      res.json({ success: true, data: {} });
    },
  );

  app.get('/api/auth/me', authMiddleware.requireAuth, (req, res) => {
    res.json({
      success: true,
      data: sessionResponse(req.auth.user, req.auth.session),
    });
  });

  app.use('/api', (req, res, next) => {
    if (req.method === 'OPTIONS') {
      return next();
    }

    return authMiddleware.requireAuth(req, res, next);
  });

  app.use('/api', (req, res, next) => {
    if (!['POST', 'PATCH', 'DELETE'].includes(req.method)) {
      return next();
    }

    return authMiddleware.requireTrustedOrigin(req, res, () => {
      authMiddleware.requireCsrf(req, res, next);
    });
  });

  app.get('/api/tasks', async (req, res) => {
    const userId = req.auth.user.id;
    const search =
      typeof req.query.search === 'string' ? req.query.search.trim() : '';

    const categoryFilter =
      typeof req.query.category_id === 'string'
        ? req.query.category_id.trim()
        : '';
    let categoryId;

    if (categoryFilter && categoryFilter !== 'all') {
      categoryId =
        categoryFilter === 'none' || categoryFilter === 'null'
          ? null
          : normalizeCategoryId(categoryFilter);
    }

    const statusFilter =
      typeof req.query.status === 'string' ? req.query.status : '';
    let status;

    if (statusFilter && statusFilter !== 'all') {
      if (!STATUSES.includes(statusFilter)) {
        throw new ValidationError('Filter status tidak valid.', {
          status: 'Filter status tidak valid.',
        });
      }

      status = statusFilter;
    }

    const priorityFilter =
      typeof req.query.priority === 'string' ? req.query.priority : '';
    let priority;

    if (priorityFilter && priorityFilter !== 'all') {
      if (!PRIORITIES.includes(priorityFilter)) {
        throw new ValidationError('Filter prioritas tidak valid.', {
          priority: 'Filter prioritas tidak valid.',
        });
      }

      priority = priorityFilter;
    }

    const sort =
      typeof req.query.sort === 'string' ? req.query.sort : 'created_desc';

    if (sort !== 'deadline_asc' && sort !== 'created_desc' && sort !== '') {
      throw new ValidationError('Urutan tidak valid.', {
        sort: 'Urutan tidak valid.',
      });
    }

    const rows = await listTasks(db, userId, {
      search,
      categoryId,
      status,
      priority,
      sort,
    });

    res.json({ success: true, data: rows.map(mapTaskRecord) });
  });

  app.post('/api/tasks', async (req, res) => {
    const userId = req.auth.user.id;
    const body = req.body ?? {};
    const title = normalizeTitle(body.title);
    const description = normalizeDescription(body.description);
    const status = normalizeStatus(body.status, { defaultValue: 'Todo' });
    const priority = normalizePriority(body.priority);
    const deadline = normalizeDeadline(body.deadline);
    const categoryId = normalizeCategoryId(body.category_id);

    await ensureCategoryExists(db, userId, categoryId);

    const created = await createTask(db, userId, {
      title,
      description,
      status,
      priority,
      deadline,
      categoryId,
    });

    res.status(201).json({
      success: true,
      data: mapTaskRecord(created),
    });
  });

  app.patch('/api/tasks/:id', async (req, res) => {
    const userId = req.auth.user.id;
    const id = parseId(req.params.id, 'Tugas');
    const existing = await getTaskById(db, userId, id);

    if (!existing) {
      throw new NotFoundError('Tugas tidak ditemukan.');
    }

    const body = req.body ?? {};
    const updates = {};

    if (Object.hasOwn(body, 'title')) {
      updates.title = normalizeTitle(body.title);
    }

    if (Object.hasOwn(body, 'description')) {
      updates.description = normalizeDescription(body.description);
    }

    if (Object.hasOwn(body, 'status')) {
      updates.status = normalizeStatus(body.status);
    }

    if (Object.hasOwn(body, 'priority')) {
      updates.priority = normalizePriority(body.priority);
    }

    if (Object.hasOwn(body, 'deadline')) {
      updates.deadline = normalizeDeadline(body.deadline);
    }

    if (Object.hasOwn(body, 'category_id')) {
      const categoryId = normalizeCategoryId(body.category_id);
      await ensureCategoryExists(db, userId, categoryId);
      updates.categoryId = categoryId;
    }

    const updated = await updateTask(db, userId, id, updates);

    res.json({ success: true, data: mapTaskRecord(updated) });
  });

  app.delete('/api/tasks/:id', async (req, res) => {
    const userId = req.auth.user.id;
    const id = parseId(req.params.id, 'Tugas');
    const existing = await getTaskById(db, userId, id);

    if (!existing) {
      throw new NotFoundError('Tugas tidak ditemukan.');
    }

    await deleteTask(db, userId, id);

    res.json({ success: true, data: { id } });
  });

  app.get('/api/categories', async (req, res) => {
    const rows = await listCategories(db, req.auth.user.id);
    res.json({ success: true, data: rows.map(mapCategoryRecord) });
  });

  app.post('/api/categories', async (req, res) => {
    const userId = req.auth.user.id;
    const body = req.body ?? {};
    const name = normalizeCategoryName(body.name);
    const created = await createCategory(db, userId, { name });

    res.status(201).json({
      success: true,
      data: mapCategoryRecord(created),
    });
  });

  app.patch('/api/categories/:id', async (req, res) => {
    const userId = req.auth.user.id;
    const id = parseId(req.params.id, 'Kategori');
    const existing = await getCategoryById(db, userId, id);

    if (!existing) {
      throw new NotFoundError('Kategori tidak ditemukan.');
    }

    const body = req.body ?? {};
    const name = normalizeCategoryName(body.name);
    const updated = await renameCategory(db, userId, id, { name });

    res.json({ success: true, data: mapCategoryRecord(updated) });
  });

  app.delete('/api/categories/:id', async (req, res) => {
    const userId = req.auth.user.id;
    const id = parseId(req.params.id, 'Kategori');
    const existing = await getCategoryById(db, userId, id);

    if (!existing) {
      throw new NotFoundError('Kategori tidak ditemukan.');
    }

    await deleteCategory(db, userId, id);

    res.json({ success: true, data: { id } });
  });

  app.get('/api/dashboard/stats', async (req, res) => {
    const stats = await getTaskStats(db, req.auth.user.id);
    res.json({ success: true, data: stats });
  });

  app.use('/api', (_req, res) => {
    res.status(404).json({
      success: false,
      message: 'Endpoint tidak ditemukan.',
      errors: {},
    });
  });

  const clientDist = path.resolve(__dirname, '../../client/dist');

  if (serveClient && fs.existsSync(clientDist)) {
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

    if (err instanceof RateLimitError) {
      res.set('Retry-After', String(err.retryAfterSeconds));
    }

    const httpError = err instanceof HttpError ? err : translateDatabaseError(err);

    if (httpError) {
      return res.status(httpError.status).json({
        success: false,
        message: httpError.message,
        errors: httpError.errors ?? {},
      });
    }

    console.error('Terjadi kesalahan internal pada server.');

    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server.',
      errors: {},
    });
  });

  return app;
}
