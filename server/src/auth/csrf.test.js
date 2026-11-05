import { describe, expect, it } from 'vitest';
import { isOriginAllowed, matchesCsrfToken } from './csrf.js';

describe('csrf helpers', () => {
  const allowed = ['http://localhost:5173', 'https://app.example.com'];

  it('accepts only explicit allowed origins', () => {
    expect(isOriginAllowed('http://localhost:5173', allowed)).toBe(true);
    expect(isOriginAllowed('https://evil.example', allowed)).toBe(false);
    expect(isOriginAllowed('', allowed)).toBe(false);
    expect(isOriginAllowed(undefined, allowed)).toBe(false);
  });

  it('compares csrf tokens safely', () => {
    expect(matchesCsrfToken('abc', 'abc')).toBe(true);
    expect(matchesCsrfToken('abc', 'abd')).toBe(false);
    expect(matchesCsrfToken('abc', 'abcd')).toBe(false);
    expect(matchesCsrfToken('abc', undefined)).toBe(false);
  });
});
