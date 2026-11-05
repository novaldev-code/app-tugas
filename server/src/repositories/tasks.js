import { and, asc, desc, eq, isNull, sql } from 'drizzle-orm';
import { categories, tasks } from '../schema.js';

const taskSelection = {
  id: tasks.id,
  userId: tasks.userId,
  title: tasks.title,
  description: tasks.description,
  status: tasks.status,
  priority: tasks.priority,
  deadline: tasks.deadline,
  categoryId: tasks.categoryId,
  createdAt: tasks.createdAt,
  categoryName: categories.name,
};

function escapeLike(value) {
  return value.replace(/[\\%_]/g, '\\$&');
}

function searchCondition(search) {
  const pattern = `%${escapeLike(search)}%`;

  return sql`(${tasks.title} ILIKE ${pattern} ESCAPE '\\' OR coalesce(${tasks.description}, '') ILIKE ${pattern} ESCAPE '\\')`;
}

function buildFilters(userId, { search, categoryId, status, priority } = {}) {
  const conditions = [eq(tasks.userId, userId)];

  if (search) {
    conditions.push(searchCondition(search));
  }

  if (categoryId !== undefined) {
    conditions.push(
      categoryId === null ? isNull(tasks.categoryId) : eq(tasks.categoryId, categoryId),
    );
  }

  if (status) {
    conditions.push(eq(tasks.status, status));
  }

  if (priority) {
    conditions.push(eq(tasks.priority, priority));
  }

  return conditions;
}

function buildOrder(sort) {
  if (sort === 'deadline_asc') {
    return [
      sql`(${tasks.deadline} IS NULL) ASC`,
      asc(tasks.deadline),
      desc(tasks.createdAt),
      desc(tasks.id),
    ];
  }

  return [desc(tasks.createdAt), desc(tasks.id)];
}

export async function listTasks(db, userId, filters = {}) {
  const conditions = buildFilters(userId, filters);
  const query = db
    .select(taskSelection)
    .from(tasks)
    .leftJoin(
      categories,
      and(
        eq(categories.id, tasks.categoryId),
        eq(categories.userId, userId),
      ),
    );

  if (conditions.length > 0) {
    query.where(sql.join(conditions, sql` AND `));
  }

  return query.orderBy(...buildOrder(filters.sort));
}

export async function getTaskById(db, userId, id) {
  const [row] = await db
    .select(taskSelection)
    .from(tasks)
    .leftJoin(
      categories,
      and(
        eq(categories.id, tasks.categoryId),
        eq(categories.userId, userId),
      ),
    )
    .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
    .limit(1);

  return row ?? null;
}

export async function createTask(db, userId, data) {
  const [created] = await db
    .insert(tasks)
    .values({
      userId,
      title: data.title,
      description: data.description ?? null,
      status: data.status ?? 'Todo',
      priority: data.priority,
      deadline: data.deadline ?? null,
      categoryId: data.categoryId ?? null,
    })
    .returning({ id: tasks.id });

  return getTaskById(db, userId, created.id);
}

export async function updateTask(db, userId, id, updates) {
  const patch = {};

  if (Object.hasOwn(updates, 'title')) {
    patch.title = updates.title;
  }

  if (Object.hasOwn(updates, 'description')) {
    patch.description = updates.description;
  }

  if (Object.hasOwn(updates, 'status')) {
    patch.status = updates.status;
  }

  if (Object.hasOwn(updates, 'priority')) {
    patch.priority = updates.priority;
  }

  if (Object.hasOwn(updates, 'deadline')) {
    patch.deadline = updates.deadline;
  }

  if (Object.hasOwn(updates, 'categoryId')) {
    patch.categoryId = updates.categoryId;
  }

  if (Object.keys(patch).length > 0) {
    await db
      .update(tasks)
      .set(patch)
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
  }

  return getTaskById(db, userId, id);
}

export async function deleteTask(db, userId, id) {
  const deleted = await db
    .delete(tasks)
    .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
    .returning({ id: tasks.id });

  return deleted.length > 0;
}
