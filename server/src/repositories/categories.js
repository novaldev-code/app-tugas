import { and, eq, ne, sql } from 'drizzle-orm';
import { ConflictError } from '../errors.js';
import { categories } from '../schema.js';

const categoryCollator = new Intl.Collator('id', { sensitivity: 'base' });

export function sortCategoryRecords(rows) {
  return [...rows].sort((left, right) => {
    if (left.isDefault !== right.isDefault) {
      return Number(right.isDefault) - Number(left.isDefault);
    }

    if (left.isDefault) {
      const bySortOrder = left.sortOrder - right.sortOrder;

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

function categoryConflict() {
  return new ConflictError('Nama kategori sudah digunakan.', {
    name: 'Nama kategori sudah digunakan.',
  });
}

export function mapCategoryWriteError(error) {
  if (error?.code === '23505') {
    return categoryConflict();
  }

  return error;
}

export async function listCategories(db, userId) {
  const rows = await db
    .select()
    .from(categories)
    .where(eq(categories.userId, userId));

  return sortCategoryRecords(rows);
}

export async function getCategoryById(db, userId, id) {
  const [row] = await db
    .select()
    .from(categories)
    .where(and(eq(categories.id, id), eq(categories.userId, userId)))
    .limit(1);

  return row ?? null;
}

export async function findCategoryByName(
  db,
  userId,
  name,
  { excludeId } = {},
) {
  const nameCondition = eq(sql`lower(${categories.name})`, name.toLowerCase());
  const ownerCondition = eq(categories.userId, userId);
  const condition =
    excludeId === undefined
      ? and(ownerCondition, nameCondition)
      : and(ownerCondition, nameCondition, ne(categories.id, excludeId));

  const [row] = await db
    .select()
    .from(categories)
    .where(condition)
    .limit(1);

  return row ?? null;
}

export async function createDefaultCategories(db, userId) {
  return db.insert(categories).values([
    { userId, name: 'Pribadi', isDefault: true, sortOrder: 1 },
    { userId, name: 'Pekerjaan', isDefault: true, sortOrder: 2 },
    { userId, name: 'Belajar', isDefault: true, sortOrder: 3 },
  ]);
}

export async function createCategory(db, userId, { name }) {
  const existing = await findCategoryByName(db, userId, name);

  if (existing) {
    throw categoryConflict();
  }

  const [maxRow] = await db
    .select({ value: sql`coalesce(max(${categories.sortOrder}), 0)::int` })
    .from(categories)
    .where(eq(categories.userId, userId));

  try {
    const [created] = await db
      .insert(categories)
      .values({
        userId,
        name,
        isDefault: false,
        sortOrder: maxRow.value + 1,
      })
      .returning();

    return created;
  } catch (error) {
    throw mapCategoryWriteError(error);
  }
}

export async function renameCategory(db, userId, id, { name }) {
  const existing = await findCategoryByName(db, userId, name, {
    excludeId: id,
  });

  if (existing) {
    throw categoryConflict();
  }

  try {
    const [updated] = await db
      .update(categories)
      .set({ name })
      .where(and(eq(categories.id, id), eq(categories.userId, userId)))
      .returning();

    return updated ?? null;
  } catch (error) {
    throw mapCategoryWriteError(error);
  }
}

export async function deleteCategory(db, userId, id) {
  const deleted = await db
    .delete(categories)
    .where(and(eq(categories.id, id), eq(categories.userId, userId)))
    .returning({ id: categories.id });

  return deleted.length > 0;
}
