import 'dotenv/config';
import { createApp } from './app.js';
import { loadServerConfig } from './config.js';
import {
  closePostgresPool,
  createPostgresDb,
  createPostgresPool,
} from './db.js';

const config = loadServerConfig();
const pool = createPostgresPool({ connectionString: config.databaseUrl });
const db = createPostgresDb(pool);

const app = createApp(db, {
  corsOrigins: config.corsOrigins,
  auth: {
    cookieName: config.authCookie.name,
    cookieSecure: config.authCookie.secure,
    cookieSameSite: config.authCookie.sameSite,
    sessionTtlHours: config.sessionTtlHours,
  },
});
const port = config.port;

const server = app.listen(port, () => {
  console.log(`Server berjalan di http://localhost:${port}`);
});

function shutdown() {
  server.close(async () => {
    await closePostgresPool(pool);
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
