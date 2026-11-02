import { createApp } from './app.js';
import { createDatabase } from './db.js';
import { runMigrations } from './migrate.js';

const db = createDatabase();
runMigrations(db);

const app = createApp(db);
const port = Number(process.env.PORT || 3001);

const server = app.listen(port, () => {
  console.log(`Server berjalan di http://localhost:${port}`);
});

function shutdown() {
  server.close(() => {
    db.close();
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
