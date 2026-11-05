import { describe, expect, it } from 'vitest';
import { hashToken, randomToken, safeEqual } from './tokens.js';

describe('tokens', () => {
  it('creates unpredictable base64url tokens', () => {
    const tokens = new Set(Array.from({ length: 20 }, () => randomToken()));

    expect(tokens.size).toBe(20);
    for (const token of tokens) {
      expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
      expect(Buffer.from(token, 'base64url')).toHaveLength(32);
    }
  });

  it('hashes tokens deterministically with sha256', () => {
    const token = randomToken();
    const hash = hashToken(token);

    expect(hash).toMatch(/^[a-f0-9]{64}$/);
    expect(hashToken(token)).toBe(hash);
    expect(hashToken(randomToken())).not.toBe(hash);
  });

  it('compares strings in constant time', () => {
    expect(safeEqual('secret', 'secret')).toBe(true);
    expect(safeEqual('secret', 'secreu')).toBe(false);
    expect(safeEqual('secret', 'secret-longer')).toBe(false);
    expect(safeEqual(null, 'secret')).toBe(false);
    expect(safeEqual('secret', 123)).toBe(false);
  });
});
