import { parse, serialize } from 'cookie';

function sameSiteValue(value) {
  return String(value).toLowerCase();
}

export function parseCookieHeader(header) {
  if (!header) {
    return {};
  }

  return parse(header);
}

export function serializeSessionCookie({
  name,
  value,
  maxAge,
  secure,
  sameSite,
  path = '/',
}) {
  return serialize(name, value, {
    httpOnly: true,
    secure,
    sameSite: sameSiteValue(sameSite),
    path,
    maxAge,
  });
}

export function serializeClearedSessionCookie({
  name,
  secure,
  sameSite,
  path = '/',
}) {
  return serialize(name, '', {
    httpOnly: true,
    secure,
    sameSite: sameSiteValue(sameSite),
    path,
    maxAge: 0,
    expires: new Date(0),
  });
}
