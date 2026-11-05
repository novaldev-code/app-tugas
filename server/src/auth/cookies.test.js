import { describe, expect, it } from 'vitest';
import {
  parseCookieHeader,
  serializeClearedSessionCookie,
  serializeSessionCookie,
} from './cookies.js';

describe('auth cookies', () => {
  it('parses request cookie headers', () => {
    expect(parseCookieHeader('a=1; ptm_session=token')).toEqual({
      a: '1',
      ptm_session: 'token',
    });
    expect(parseCookieHeader(undefined)).toEqual({});
  });

  it('serializes development cookies without Secure', () => {
    const cookie = serializeSessionCookie({
      name: 'ptm_session',
      value: 'token',
      maxAge: 3600,
      secure: false,
      sameSite: 'Lax',
    });

    expect(cookie).toContain('ptm_session=token');
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Lax');
    expect(cookie).toContain('Max-Age=3600');
    expect(cookie).not.toContain('Secure');
  });

  it('serializes cross-site production cookies with Secure and SameSite=None', () => {
    const cookie = serializeSessionCookie({
      name: 'ptm_session',
      value: 'token',
      maxAge: 60,
      secure: true,
      sameSite: 'None',
    });

    expect(cookie).toContain('Secure');
    expect(cookie).toContain('SameSite=None');
  });

  it('clears the cookie', () => {
    const cookie = serializeClearedSessionCookie({
      name: 'ptm_session',
      secure: true,
      sameSite: 'Lax',
    });

    expect(cookie).toContain('ptm_session=');
    expect(cookie).toContain('Max-Age=0');
    expect(cookie).toContain('Expires=Thu, 01 Jan 1970');
  });
});
