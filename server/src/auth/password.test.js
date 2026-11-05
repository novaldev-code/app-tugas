import { describe, expect, it } from 'vitest';
import {
  MAX_PASSWORD_LENGTH,
  MIN_PASSWORD_LENGTH,
  hashPassword,
  validatePassword,
  verifyDummyPassword,
  verifyPassword,
} from './password.js';

describe('password hashing', () => {
  it('hashes passwords with Argon2id and verifies them', async () => {
    const password = 'correct horse battery staple';
    const hash = await hashPassword(password);

    expect(hash.startsWith('$argon2id$')).toBe(true);
    await expect(verifyPassword(hash, password)).resolves.toBe(true);
    await expect(verifyPassword(hash, 'wrong password')).resolves.toBe(false);
    await expect(verifyPassword('not-a-hash', password)).resolves.toBe(false);
  });

  it('produces a unique salt for every hash', async () => {
    const mismatch = await Promise.all([
      hashPassword('same password'),
      hashPassword('same password'),
    ]);

    expect(mismatch[0]).not.toBe(mismatch[1]);
  });

  it('enforces password length limits', async () => {
    expect(() => validatePassword('a'.repeat(MIN_PASSWORD_LENGTH - 1))).toThrow(
      'Password harus 8-128 karakter.',
    );
    expect(() => validatePassword('a'.repeat(MAX_PASSWORD_LENGTH + 1))).toThrow(
      'Password harus 8-128 karakter.',
    );
    expect(() => validatePassword(12345678)).toThrow('Password wajib diisi.');
    await expect(hashPassword('short')).rejects.toThrow(
      'Password harus 8-128 karakter.',
    );
  });

  it('verifies against the same dummy hash for unknown accounts', async () => {
    await expect(verifyDummyPassword('anything')).resolves.toBe(false);
    await expect(verifyDummyPassword(null)).resolves.toBe(false);
  });
});
