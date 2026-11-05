import { eq, sql } from 'drizzle-orm';
import { PRIORITIES, STATUSES } from '../validation.js';
import { tasks } from '../schema.js';

export async function getTaskStats(db, userId) {
  const ownerCondition = eq(tasks.userId, userId);

  const [totalRow] = await db
    .select({ count: sql`count(*)::int` })
    .from(tasks)
    .where(ownerCondition);

  const statusRows = await db
    .select({
      status: tasks.status,
      count: sql`count(*)::int`,
    })
    .from(tasks)
    .where(ownerCondition)
    .groupBy(tasks.status);

  const priorityRows = await db
    .select({
      priority: tasks.priority,
      count: sql`count(*)::int`,
    })
    .from(tasks)
    .where(ownerCondition)
    .groupBy(tasks.priority);

  const byStatus = Object.fromEntries(STATUSES.map((status) => [status, 0]));
  const byPriority = Object.fromEntries(
    PRIORITIES.map((priority) => [priority, 0]),
  );

  for (const row of statusRows) {
    byStatus[row.status] = row.count;
  }

  for (const row of priorityRows) {
    byPriority[row.priority] = row.count;
  }

  return {
    total: totalRow.count,
    byStatus,
    byPriority,
  };
}
