import { createDatabase, defaultDbPath } from './db.js';
import { runMigrations } from './migrate.js';

const db = createDatabase();
runMigrations(db);
db.close();

console.log(`Migrasi selesai: ${defaultDbPath()}`);
