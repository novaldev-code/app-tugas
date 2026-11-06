import { createApp } from '../server/src/app.js';
import { loadServerConfig } from '../server/src/config.js';
import {
  createPostgresDb,
  createPostgresPool,
} from '../server/src/db.js';

const config = loadServerConfig();
const pool = createPostgresPool({
  connectionString: config.databaseUrl,
  max: 1,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 10000,
});
const db = createPostgresDb(pool);

const app = createApp(db, {
  corsOrigins: config.corsOrigins,
  auth: {
    cookieName: config.authCookie.name,
    cookieSecure: config.authCookie.secure,
    cookieSameSite: config.authCookie.sameSite,
    sessionTtlHours: config.sessionTtlHours,
  },
  serveClient: false,
});

function normalizeRequestUrl(url) {
  if (!url) {
    return '/api';
  }

  if (url === '/api' || url.startsWith('/api?') || url.startsWith('/api/')) {
    return url;
  }

  return `/api${url.startsWith('/') ? '' : '/'}${url}`;
}

export default function handler(req, res) {
  req.url = normalizeRequestUrl(req.url);
  return app(req, res);
}
