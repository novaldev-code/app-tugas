import { describe, expect, it } from 'vitest';
import { createRateLimiter } from './rate-limit.js';

describe('rate limiter', () => {
  it('allows requests up to the limit and rejects the next one', () => {
    let time = 1000;
    const limiter = createRateLimiter({
      limit: 2,
      windowMs: 1000,
      now: () => time,
    });

    expect(limiter.check('key').allowed).toBe(true);
    expect(limiter.check('key').allowed).toBe(true);
    const limited = limiter.check('key');

    expect(limited.allowed).toBe(false);
    expect(limited.retryAfterMs).toBe(1000);
  });

  it('resets after the window and isolates keys', () => {
    let time = 0;
    const limiter = createRateLimiter({
      limit: 1,
      windowMs: 100,
      now: () => time,
    });

    expect(limiter.check('a').allowed).toBe(true);
    expect(limiter.check('b').allowed).toBe(true);
    expect(limiter.check('a').allowed).toBe(false);

    time = 100;
    expect(limiter.check('a').allowed).toBe(true);
  });

  it('supports reset and clear', () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 1000 });

    expect(limiter.check('key').allowed).toBe(true);
    limiter.reset('key');
    expect(limiter.check('key').allowed).toBe(true);
    limiter.clear();
    expect(limiter.check('key').allowed).toBe(true);
  });
});
