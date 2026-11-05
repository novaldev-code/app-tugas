const ENVIRONMENTS = new Set(['development', 'test', 'production']);

function required(env, name) {
  const value = env[name]?.trim();

  if (!value) {
    throw new Error(`${name} wajib diisi.`);
  }

  return value;
}

function postgresUrl(value, name) {
  let parsed;

  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`${name} harus berupa URL PostgreSQL yang valid.`);
  }

  if (parsed.protocol !== 'postgres:' && parsed.protocol !== 'postgresql:') {
    throw new Error(`${name} harus berupa URL PostgreSQL yang valid.`);
  }

  return value;
}

function environment(env) {
  const value = env.NODE_ENV || 'development';

  if (!ENVIRONMENTS.has(value)) {
    throw new Error('NODE_ENV harus development, test, atau production.');
  }

  return value;
}

function port(value) {
  const parsed = Number(value ?? 3001);

  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
    throw new Error('PORT harus berupa angka antara 1 dan 65535.');
  }

  return parsed;
}

function corsOrigins(value) {
  const origins = required({ CORS_ORIGIN: value }, 'CORS_ORIGIN')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (origins.length === 0 || origins.includes('*')) {
    throw new Error('CORS_ORIGIN harus berisi origin eksplisit, bukan wildcard.');
  }

  return origins.map((origin) => {
    let parsed;

    try {
      parsed = new URL(origin);
    } catch {
      throw new Error('CORS_ORIGIN harus berisi URL origin yang valid.');
    }

    if (parsed.origin !== origin) {
      throw new Error('CORS_ORIGIN harus berisi URL origin tanpa path.');
    }

    return origin;
  });
}

function parseBoolean(value, name) {
  if (value === 'true' || value === '1') {
    return true;
  }

  if (value === 'false' || value === '0') {
    return false;
  }

  throw new Error(`${name} harus berupa boolean true atau false.`);
}

function cookieSecure(value, nodeEnv) {
  if (value === undefined || value === null || value === '') {
    return nodeEnv === 'production';
  }

  const secure = parseBoolean(value, 'AUTH_COOKIE_SECURE');

  if (nodeEnv === 'production' && !secure) {
    throw new Error('AUTH_COOKIE_SECURE wajib bernilai true pada production.');
  }

  return secure;
}

function cookieName(value) {
  const name = value?.trim() || 'ptm_session';

  if (!/^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/.test(name)) {
    throw new Error('AUTH_COOKIE_NAME harus berupa nama cookie yang valid.');
  }

  return name;
}

function cookieSameSite(value, secure) {
  const normalized = value?.trim().toLowerCase() || 'lax';

  if (normalized !== 'lax' && normalized !== 'strict' && normalized !== 'none') {
    throw new Error('AUTH_COOKIE_SAME_SITE harus Lax, Strict, atau None.');
  }

  if (normalized === 'none' && !secure) {
    throw new Error(
      'AUTH_COOKIE_SAME_SITE=None memerlukan AUTH_COOKIE_SECURE=true.',
    );
  }

  if (normalized === 'strict') {
    return 'Strict';
  }

  if (normalized === 'none') {
    return 'None';
  }

  return 'Lax';
}

function sessionTtlHours(value) {
  if (value === undefined || value === null || value === '') {
    return 168;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 8760) {
    throw new Error(
      'SESSION_TTL_HOURS harus berupa integer antara 1 dan 8760.',
    );
  }

  return parsed;
}

export function loadServerConfig(env = process.env) {
  const nodeEnv = environment(env);
  const secure = cookieSecure(env.AUTH_COOKIE_SECURE, nodeEnv);

  return {
    nodeEnv,
    port: port(env.PORT),
    databaseUrl: postgresUrl(required(env, 'DATABASE_URL'), 'DATABASE_URL'),
    databaseUrlUnpooled: postgresUrl(
      required(env, 'DATABASE_URL_UNPOOLED'),
      'DATABASE_URL_UNPOOLED',
    ),
    corsOrigins: corsOrigins(env.CORS_ORIGIN),
    sessionTtlHours: sessionTtlHours(env.SESSION_TTL_HOURS),
    authCookie: {
      name: cookieName(env.AUTH_COOKIE_NAME),
      secure,
      sameSite: cookieSameSite(env.AUTH_COOKIE_SAME_SITE, secure),
    },
  };
}

export function loadTestConfig(env = process.env) {
  if (env.NODE_ENV === 'production') {
    throw new Error('Test tidak boleh dijalankan dengan NODE_ENV=production.');
  }

  const databaseUrl = postgresUrl(
    required(env, 'TEST_DATABASE_URL'),
    'TEST_DATABASE_URL',
  );
  const databaseUrlUnpooled = postgresUrl(
    required(env, 'TEST_DATABASE_URL_UNPOOLED'),
    'TEST_DATABASE_URL_UNPOOLED',
  );

  if (env.DATABASE_URL && env.DATABASE_URL === databaseUrl) {
    throw new Error('TEST_DATABASE_URL tidak boleh sama dengan DATABASE_URL.');
  }

  if (
    env.DATABASE_URL_UNPOOLED &&
    env.DATABASE_URL_UNPOOLED === databaseUrlUnpooled
  ) {
    throw new Error(
      'TEST_DATABASE_URL_UNPOOLED tidak boleh sama dengan DATABASE_URL_UNPOOLED.',
    );
  }

  return {
    nodeEnv: 'test',
    databaseUrl,
    databaseUrlUnpooled,
  };
}
