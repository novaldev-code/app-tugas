import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  date,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

export const users = pgTable(
  'users',
  {
    id: text('id').primaryKey(),
    email: text('email').notNull(),
    passwordHash: text('password_hash').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('idx_users_email_nocase').on(sql`lower(${table.email})`),
  ],
);

export const sessions = pgTable(
  'sessions',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull().unique(),
    csrfToken: text('csrf_token').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('idx_sessions_user_id').on(table.userId),
    index('idx_sessions_expires_at').on(table.expiresAt),
  ],
);

export const categories = pgTable(
  'categories',
  {
    id: integer('id').generatedByDefaultAsIdentity().primaryKey(),
    userId: text('user_id').references(() => users.id, {
      onDelete: 'cascade',
    }),
    name: text('name').notNull(),
    isDefault: boolean('is_default').notNull().default(false),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      'categories_name_length',
      sql`length(trim(${table.name})) BETWEEN 1 AND 50`,
    ),
    index('idx_categories_user_id').on(table.userId),
    index('idx_categories_order').on(
      table.isDefault,
      table.sortOrder,
      table.name,
    ),
  ],
);

export const tasks = pgTable(
  'tasks',
  {
    id: integer('id').generatedByDefaultAsIdentity().primaryKey(),
    userId: text('user_id').references(() => users.id, {
      onDelete: 'cascade',
    }),
    title: text('title').notNull(),
    description: text('description'),
    status: text('status').notNull().default('Todo'),
    priority: text('priority').notNull(),
    deadline: date('deadline', { mode: 'string' }),
    categoryId: integer('category_id').references(() => categories.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      'tasks_title_length',
      sql`length(trim(${table.title})) BETWEEN 1 AND 120`,
    ),
    check(
      'tasks_description_length',
      sql`${table.description} IS NULL OR length(trim(${table.description})) BETWEEN 1 AND 1000`,
    ),
    check(
      'tasks_status_values',
      sql`${table.status} IN ('Todo', 'In Progress', 'Done')`,
    ),
    check(
      'tasks_priority_values',
      sql`${table.priority} IN ('Low', 'Medium', 'High', 'Urgent')`,
    ),
    index('idx_tasks_user_id').on(table.userId),
    index('idx_tasks_status').on(table.status),
    index('idx_tasks_priority').on(table.priority),
    index('idx_tasks_deadline').on(table.deadline),
    index('idx_tasks_category').on(table.categoryId),
    index('idx_tasks_created').on(table.createdAt),
  ],
);
