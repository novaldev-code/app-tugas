import { describe, expect, it } from 'vitest';
import {
  formatDate,
  priorityLabel,
  statusLabel,
  STATUS_OPTIONS,
  PRIORITY_OPTIONS,
} from './labels.js';

describe('status labels', () => {
  it('maps status values to Indonesian labels', () => {
    expect(statusLabel('Todo')).toBe('Belum Dikerjakan');
    expect(statusLabel('In Progress')).toBe('Sedang Dikerjakan');
    expect(statusLabel('Done')).toBe('Selesai');
  });

  it('exposes ordered options', () => {
    expect(STATUS_OPTIONS.map((option) => option.value)).toEqual([
      'Todo',
      'In Progress',
      'Done',
    ]);
  });
});

describe('priority labels', () => {
  it('maps priority values to Indonesian labels', () => {
    expect(priorityLabel('Low')).toBe('Rendah');
    expect(priorityLabel('Medium')).toBe('Sedang');
    expect(priorityLabel('High')).toBe('Tinggi');
    expect(priorityLabel('Urgent')).toBe('Mendesak');
  });

  it('exposes ordered options', () => {
    expect(PRIORITY_OPTIONS.map((option) => option.value)).toEqual([
      'Low',
      'Medium',
      'High',
      'Urgent',
    ]);
  });
});

describe('formatDate', () => {
  it('formats YYYY-MM-DD as DD/MM/YYYY', () => {
    expect(formatDate('2026-11-01')).toBe('01/11/2026');
  });

  it('returns empty string for missing values', () => {
    expect(formatDate(null)).toBe('');
    expect(formatDate('')).toBe('');
  });
});
