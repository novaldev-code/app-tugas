import { describe, expect, it } from 'vitest';
import {
  isOverdue,
  localDateISO,
  normalizeCategoryId,
  normalizeCategoryName,
  normalizeDeadline,
  normalizeDescription,
  normalizePriority,
  normalizeStatus,
  normalizeTitle,
} from './validation.js';

describe('normalizeTitle', () => {
  it('trims surrounding whitespace', () => {
    expect(normalizeTitle('  Beli susu  ')).toBe('Beli susu');
  });

  it('rejects empty or whitespace-only titles', () => {
    expect(() => normalizeTitle('   ')).toThrow('Judul tugas harus 1-120 karakter.');
  });

  it('rejects titles longer than 120 characters', () => {
    expect(() => normalizeTitle('a'.repeat(121))).toThrow(
      'Judul tugas harus 1-120 karakter.',
    );
  });

  it('accepts exactly 120 characters', () => {
    expect(normalizeTitle('a'.repeat(120))).toHaveLength(120);
  });
});

describe('normalizeDescription', () => {
  it('trims descriptions', () => {
    expect(normalizeDescription('  detail  ')).toBe('detail');
  });

  it('converts empty or whitespace-only descriptions to null', () => {
    expect(normalizeDescription('   ')).toBeNull();
    expect(normalizeDescription('')).toBeNull();
    expect(normalizeDescription(null)).toBeNull();
    expect(normalizeDescription(undefined)).toBeNull();
  });

  it('rejects descriptions longer than 1000 characters', () => {
    expect(() => normalizeDescription('a'.repeat(1001))).toThrow(
      'Deskripsi tugas maksimal 1000 karakter.',
    );
  });
});

describe('normalizeStatus', () => {
  it('accepts known statuses', () => {
    expect(normalizeStatus('Todo')).toBe('Todo');
    expect(normalizeStatus('In Progress')).toBe('In Progress');
    expect(normalizeStatus('Done')).toBe('Done');
  });

  it('uses the provided default when empty', () => {
    expect(normalizeStatus(undefined, { defaultValue: 'Todo' })).toBe('Todo');
    expect(normalizeStatus('', { defaultValue: 'Todo' })).toBe('Todo');
  });

  it('rejects unknown statuses', () => {
    expect(() => normalizeStatus('Selesai')).toThrow('Status tugas tidak valid.');
  });
});

describe('normalizePriority', () => {
  it('accepts known priorities', () => {
    expect(normalizePriority('Low')).toBe('Low');
    expect(normalizePriority('Urgent')).toBe('Urgent');
  });

  it('rejects missing or unknown priorities', () => {
    expect(() => normalizePriority(undefined)).toThrow(
      'Prioritas tugas tidak valid.',
    );
    expect(() => normalizePriority('Tinggi')).toThrow(
      'Prioritas tugas tidak valid.',
    );
  });
});

describe('normalizeDeadline', () => {
  it('accepts valid YYYY-MM-DD dates', () => {
    expect(normalizeDeadline('2026-02-28')).toBe('2026-02-28');
    expect(normalizeDeadline('2024-02-29')).toBe('2024-02-29');
  });

  it('converts empty values to null', () => {
    expect(normalizeDeadline('')).toBeNull();
    expect(normalizeDeadline(null)).toBeNull();
  });

  it('rejects invalid formats and dates', () => {
    expect(() => normalizeDeadline('28/02/2026')).toThrow(
      'Tanggal tenggat harus berformat YYYY-MM-DD.',
    );
    expect(() => normalizeDeadline('2026-02-30')).toThrow(
      'Tanggal tenggat tidak valid.',
    );
    expect(() => normalizeDeadline('2025-02-29')).toThrow(
      'Tanggal tenggat tidak valid.',
    );
  });
});

describe('normalizeCategoryName', () => {
  it('trims names', () => {
    expect(normalizeCategoryName('  Hobi  ')).toBe('Hobi');
  });

  it('rejects empty or too-long names', () => {
    expect(() => normalizeCategoryName('   ')).toThrow(
      'Nama kategori harus 1-50 karakter.',
    );
    expect(() => normalizeCategoryName('a'.repeat(51))).toThrow(
      'Nama kategori harus 1-50 karakter.',
    );
  });
});

describe('normalizeCategoryId', () => {
  it('converts ids and empty values', () => {
    expect(normalizeCategoryId('3')).toBe(3);
    expect(normalizeCategoryId(3)).toBe(3);
    expect(normalizeCategoryId(null)).toBeNull();
    expect(normalizeCategoryId('')).toBeNull();
  });

  it('rejects invalid ids', () => {
    expect(() => normalizeCategoryId('abc')).toThrow('Kategori tidak valid.');
    expect(() => normalizeCategoryId(0)).toThrow('Kategori tidak valid.');
  });
});

describe('isOverdue', () => {
  const now = new Date(2026, 4, 10, 12, 0, 0);

  it('is true for past deadlines on unfinished tasks', () => {
    expect(isOverdue('2026-05-09', 'Todo', now)).toBe(true);
    expect(isOverdue('2026-05-09', 'In Progress', now)).toBe(true);
  });

  it('is false for today, future, missing, or done tasks', () => {
    expect(isOverdue('2026-05-10', 'Todo', now)).toBe(false);
    expect(isOverdue('2026-05-11', 'Todo', now)).toBe(false);
    expect(isOverdue(null, 'Todo', now)).toBe(false);
    expect(isOverdue('2026-05-09', 'Done', now)).toBe(false);
  });

  it('uses local dates for today', () => {
    expect(localDateISO(now)).toBe('2026-05-10');
  });
});
