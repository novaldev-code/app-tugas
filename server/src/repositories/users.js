import { eq, sql } from 'drizzle-orm';
import { users } from '../schema.js';

export async function createUser(db, { id, email, passwordHash }) {
  const [row] = await db
    .insert(users)
    .values({ id, email, passwordHash })
    .returning();

  return row;
}

export async function findUserByEmail(db, email) {
  const [row] = await db
    .select()
    .from(users)
    .where(eq(sql`lower(${users.email})`, email.toLowerCase()))
    .limit(1);

  return row ?? null;
}

export async function findUserById(db, id) {
  const [row] = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  return row ?? null;
}

export function mapUser(row) {
  return {
    id: row.id,
    email: row.email,
  };
}
