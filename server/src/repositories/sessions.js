import { and, eq, gt, lte } from 'drizzle-orm';
import { sessions } from '../schema.js';

export async function createSession(db, data) {
  const [row] = await db.insert(sessions).values(data).returning();
  return row;
}

export async function findValidSessionByTokenHash(
  db,
  tokenHash,
  now = new Date(),
) {
  const [row] = await db
    .select()
    .from(sessions)
    .where(
      and(eq(sessions.tokenHash, tokenHash), gt(sessions.expiresAt, now)),
    )
    .limit(1);

  return row ?? null;
}

export async function deleteSessionById(db, id) {
  const deleted = await db
    .delete(sessions)
    .where(eq(sessions.id, id))
    .returning({ id: sessions.id });

  return deleted.length > 0;
}

export async function deleteExpiredSessions(db, now = new Date()) {
  const deleted = await db
    .delete(sessions)
    .where(lte(sessions.expiresAt, now))
    .returning({ id: sessions.id });

  return deleted.length;
}
