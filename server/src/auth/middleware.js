import { parseCookieHeader } from './cookies.js';
import { isOriginAllowed, matchesCsrfToken } from './csrf.js';
import { hashToken } from './tokens.js';
import { ForbiddenError, UnauthorizedError } from '../errors.js';
import { findValidSessionByTokenHash } from '../repositories/sessions.js';
import { findUserById } from '../repositories/users.js';

export function createAuthMiddleware({ db, cookieName, allowedOrigins }) {
  async function loadSession(req) {
    const cookies = parseCookieHeader(req.headers.cookie);
    const token = cookies[cookieName];

    if (!token) {
      return null;
    }

    const session = await findValidSessionByTokenHash(db, hashToken(token));

    if (!session) {
      return null;
    }

    const user = await findUserById(db, session.userId);

    if (!user) {
      return null;
    }

    return { user, session };
  }

  async function requireAuth(req, _res, next) {
    try {
      const auth = await loadSession(req);

      if (!auth) {
        next(new UnauthorizedError());
        return;
      }

      req.auth = auth;
      next();
    } catch (error) {
      next(error);
    }
  }

  function requireTrustedOrigin(req, _res, next) {
    const origin = req.get('Origin');

    if (!isOriginAllowed(origin, allowedOrigins)) {
      next(new ForbiddenError('Origin tidak diizinkan.'));
      return;
    }

    next();
  }

  function requireJsonContentType(req, _res, next) {
    if (!req.is('application/json')) {
      next(new ForbiddenError('Content-Type harus application/json.'));
      return;
    }

    next();
  }

  function requireCsrf(req, _res, next) {
    const provided = req.get('X-CSRF-Token');

    if (!req.auth || !matchesCsrfToken(req.auth.session.csrfToken, provided)) {
      next(new ForbiddenError('Token CSRF tidak valid.'));
      return;
    }

    next();
  }

  return {
    loadSession,
    requireAuth,
    requireTrustedOrigin,
    requireJsonContentType,
    requireCsrf,
  };
}
