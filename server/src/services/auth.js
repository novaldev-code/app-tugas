import { randomUUID } from 'node:crypto';
import {
  hashPassword,
  validatePassword,
  verifyDummyPassword,
  verifyPassword,
} from '../auth/password.js';
import { hashToken, randomToken } from '../auth/tokens.js';
import {
  ConflictError,
  UnauthorizedError,
  ValidationError,
} from '../errors.js';
import { createDefaultCategories } from '../repositories/categories.js';
import {
  createSession,
  deleteSessionById,
} from '../repositories/sessions.js';
import { createUser, findUserByEmail } from '../repositories/users.js';
import { normalizeEmail } from '../validation.js';

export const DEFAULT_SESSION_TTL_HOURS = 168;

function validateRegistrationInput(email, password) {
  const errors = {};
  let normalizedEmail;

  try {
    normalizedEmail = normalizeEmail(email);
  } catch (error) {
    Object.assign(errors, error.errors ?? {});
  }

  try {
    validatePassword(password);
  } catch (error) {
    Object.assign(errors, error.errors ?? {});
  }

  if (Object.keys(errors).length > 0) {
    throw new ValidationError('Data registrasi tidak valid.', errors);
  }

  return normalizedEmail;
}

function buildSession(userId, sessionTtlHours) {
  const token = randomToken();
  const csrfToken = randomToken();
  const id = randomUUID();
  const expiresAt = new Date(
    Date.now() + sessionTtlHours * 60 * 60 * 1000,
  );

  return {
    row: {
      id,
      userId,
      tokenHash: hashToken(token),
      csrfToken,
      expiresAt,
    },
    public: {
      id,
      token,
      csrfToken,
      expiresAt,
    },
  };
}

export async function registerUser(
  db,
  { email, password },
  { sessionTtlHours = DEFAULT_SESSION_TTL_HOURS } = {},
) {
  const normalizedEmail = validateRegistrationInput(email, password);
  const passwordHash = await hashPassword(password);
  const userId = randomUUID();
  const session = buildSession(userId, sessionTtlHours);

  try {
    await db.transaction(async (tx) => {
      await createUser(tx, {
        id: userId,
        email: normalizedEmail,
        passwordHash,
      });
      await createDefaultCategories(tx, userId);
      await createSession(tx, session.row);
    });
  } catch (error) {
    const cause = error?.cause ?? error;

    if (cause?.code === '23505') {
      throw new ConflictError('Email sudah terdaftar.', {
        email: 'Email sudah terdaftar.',
      });
    }

    throw cause;
  }

  return {
    user: { id: userId, email: normalizedEmail },
    session: session.public,
  };
}

export async function loginUser(
  db,
  { email, password },
  { sessionTtlHours = DEFAULT_SESSION_TTL_HOURS } = {},
) {
  const normalizedEmail = normalizeEmail(email);
  const user = await findUserByEmail(db, normalizedEmail);
  const passwordMatches = user
    ? await verifyPassword(user.passwordHash, password)
    : await verifyDummyPassword(password);

  if (!user || !passwordMatches) {
    throw new UnauthorizedError('Email atau password salah.');
  }

  const session = buildSession(user.id, sessionTtlHours);
  await createSession(db, session.row);

  return {
    user: { id: user.id, email: user.email },
    session: session.public,
  };
}

export async function logoutUser(db, session) {
  if (session) {
    await deleteSessionById(db, session.id);
  }
}
