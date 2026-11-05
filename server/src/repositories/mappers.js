import { isOverdue } from '../validation.js';

function toDate(value) {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);

    if (!Number.isNaN(date.getTime())) {
      return date;
    }
  }

  return null;
}

export function formatTimestamp(value) {
  if (value === null || value === undefined) {
    return null;
  }

  if (
    typeof value === 'string' &&
    /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value)
  ) {
    return value;
  }

  const date = toDate(value);

  if (!date) {
    return null;
  }

  return date.toISOString().slice(0, 19).replace('T', ' ');
}

export function formatDateOnly(value) {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'string') {
    return value.slice(0, 10);
  }

  const date = toDate(value);

  return date ? date.toISOString().slice(0, 10) : null;
}

export function mapTaskRecord(row) {
  const deadline = formatDateOnly(row.deadline);

  return {
    id: row.id,
    title: row.title,
    description: row.description ?? null,
    status: row.status,
    priority: row.priority,
    deadline,
    category_id: row.categoryId ?? null,
    category_name: row.categoryName ?? null,
    created_at: formatTimestamp(row.createdAt),
    overdue: isOverdue(deadline, row.status),
  };
}

export function mapCategoryRecord(row) {
  return {
    id: row.id,
    name: row.name,
    is_default: Boolean(row.isDefault),
    sort_order: row.sortOrder,
    created_at: formatTimestamp(row.createdAt),
  };
}
