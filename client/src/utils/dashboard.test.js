import { describe, expect, it } from 'vitest';
import { calculateCompletionRate, getPriorityValue, getStatusValue } from './dashboard.js';

describe('calculateCompletionRate', () => {
  it('returns 0 when total is 0', () => {
    expect(calculateCompletionRate({ total: 0, byStatus: { Done: 0 } })).toBe(0);
  });

  it('returns 0 when stats missing', () => {
    expect(calculateCompletionRate(null)).toBe(0);
  });

  it('calculates percentage of done tasks', () => {
    expect(
      calculateCompletionRate({ total: 10, byStatus: { Done: 3 } }),
    ).toBe(30);
  });

  it('rounds completion rate', () => {
    expect(
      calculateCompletionRate({ total: 3, byStatus: { Done: 1 } }),
    ).toBe(33);
  });
});

describe('getStatusValue/getPriorityValue', () => {
  it('returns 0 when missing', () => {
    expect(getStatusValue(null, 'Todo')).toBe(0);
    expect(getPriorityValue({}, 'High')).toBe(0);
  });

  it('reads values safely', () => {
    expect(getStatusValue({ byStatus: { Done: 5 } }, 'Done')).toBe(5);
    expect(getPriorityValue({ byPriority: { Urgent: 2 } }, 'Urgent')).toBe(2);
  });
});
