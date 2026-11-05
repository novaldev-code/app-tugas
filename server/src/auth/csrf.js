import { safeEqual } from './tokens.js';

export function isOriginAllowed(origin, allowedOrigins) {
  return (
    typeof origin === 'string' &&
    origin.length > 0 &&
    allowedOrigins.includes(origin)
  );
}

export function matchesCsrfToken(expected, provided) {
  return safeEqual(expected, provided);
}
