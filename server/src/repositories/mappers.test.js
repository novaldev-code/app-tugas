import { describe, expect, it } from 'vitest';
import {
  formatDateOnly,
  formatTimestamp,
  mapCategoryRecord,
  mapTaskRecord,
} from './mappers.js';

describe('repository mappers', () => {
  it('formats timestamps as UTC YYYY-MM-DD HH:MM:SS', () => {
    expect(formatTimestamp(new Date('2026-01-02T03:04:05.678Z'))).toBe(
      '2026-01-02 03:04:05',
    );
    expect(formatTimestamp('2026-01-02 03:04:05')).toBe(
      '2026-01-02 03:04:05',
    );
    expect(formatTimestamp(null)).toBeNull();
  });

  it('formats date-only values and preserves null', () => {
    expect(formatDateOnly('2026-01-02')).toBe('2026-01-02');
    expect(formatDateOnly(new Date('2026-01-02T00:00:00.000Z'))).toBe(
      '2026-01-02',
    );
    expect(formatDateOnly(null)).toBeNull();
  });

  it('maps a task record to the API contract', () => {
    const mapped = mapTaskRecord({
      id: 7,
      userId: null,
      title: 'Tugas',
      description: null,
      status: 'Todo',
      priority: 'High',
      deadline: '2000-01-01',
      categoryId: 3,
      createdAt: new Date('2026-01-02T03:04:05.678Z'),
      categoryName: 'Pekerjaan',
    });

    expect(mapped).toEqual({
      id: 7,
      title: 'Tugas',
      description: null,
      status: 'Todo',
      priority: 'High',
      deadline: '2000-01-01',
      category_id: 3,
      category_name: 'Pekerjaan',
      created_at: '2026-01-02 03:04:05',
      overdue: true,
    });
  });

  it('maps null task fields without leaking database column names', () => {
    const mapped = mapTaskRecord({
      id: 8,
      userId: null,
      title: 'Tanpa kategori',
      description: '',
      status: 'Done',
      priority: 'Low',
      deadline: null,
      categoryId: null,
      createdAt: new Date('2026-01-02T03:04:05.000Z'),
      categoryName: null,
    });

    expect(mapped).toMatchObject({
      deadline: null,
      category_id: null,
      category_name: null,
      overdue: false,
    });
    expect(mapped).not.toHaveProperty('categoryId');
    expect(mapped).not.toHaveProperty('userId');
  });

  it('maps a category record with boolean and snake_case fields', () => {
    const mapped = mapCategoryRecord({
      id: 1,
      userId: null,
      name: 'Pribadi',
      isDefault: true,
      sortOrder: 1,
      createdAt: new Date('2026-01-02T03:04:05.000Z'),
    });

    expect(mapped).toEqual({
      id: 1,
      name: 'Pribadi',
      is_default: true,
      sort_order: 1,
      created_at: '2026-01-02 03:04:05',
    });
    expect(mapped).not.toHaveProperty('userId');
    expect(mapped).not.toHaveProperty('isDefault');
  });
});
