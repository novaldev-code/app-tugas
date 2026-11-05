import argon2 from 'argon2';
import { ValidationError } from '../errors.js';

export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 128;

const DUMMY_PASSWORD_HASH =
  '$argon2id$v=19$m=19456,t=2,p=1$36Li70GHErE5CE9sFNa6kA$77KFVF8oV/kHrw9jy6wOJjoIPrUqVGXI9k0xHXIbyjo';

function passwordError(message) {
  return new ValidationError(message, { password: message });
}

export function validatePassword(password) {
  if (typeof password !== 'string') {
    throw passwordError('Password wajib diisi.');
  }

  if (
    password.length < MIN_PASSWORD_LENGTH ||
    password.length > MAX_PASSWORD_LENGTH
  ) {
    throw passwordError('Password harus 8-128 karakter.');
  }

  return password;
}

export async function hashPassword(password) {
  validatePassword(password);

  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });
}

export async function verifyPassword(hash, password) {
  if (typeof hash !== 'string' || typeof password !== 'string') {
    return false;
  }

  try {
    return await argon2.verify(hash, password);
  } catch {
    return false;
  }
}

export async function verifyDummyPassword(password) {
  return verifyPassword(
    DUMMY_PASSWORD_HASH,
    typeof password === 'string' ? password : '',
  );
}
