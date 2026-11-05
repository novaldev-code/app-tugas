import { describe, expect, it } from 'vitest';
import { loadServerConfig, loadTestConfig } from './config.js';

const databaseUrl = 'postgresql://user:pass@localhost:5432/tasks';
const unpooledUrl = 'postgresql://user:pass@localhost:5432/tasks?direct=true';

function validEnv(overrides = {}) {
  return {
    NODE_ENV: 'development',
    PORT: '3001',
    DATABASE_URL: databaseUrl,
    DATABASE_URL_UNPOOLED: unpooledUrl,
    CORS_ORIGIN: 'http://localhost:5173',
    ...overrides,
  };
}

describe('loadServerConfig', () => {
  it('loads valid runtime configuration', () => {
    const config = loadServerConfig(validEnv());

    expect(config).toEqual({
      nodeEnv: 'development',
      port: 3001,
      databaseUrl,
      databaseUrlUnpooled: unpooledUrl,
      corsOrigins: ['http://localhost:5173'],
      sessionTtlHours: 168,
      authCookie: {
        name: 'ptm_session',
        secure: false,
        sameSite: 'Lax',
      },
    });
  });

  it('rejects missing database configuration', () => {
    expect(() => loadServerConfig(validEnv({ DATABASE_URL: '' }))).toThrow(
      'DATABASE_URL wajib diisi.',
    );
    expect(() =>
      loadServerConfig(validEnv({ DATABASE_URL_UNPOOLED: '' })),
    ).toThrow('DATABASE_URL_UNPOOLED wajib diisi.');
  });

  it('rejects missing or wildcard CORS origins', () => {
    expect(() => loadServerConfig(validEnv({ CORS_ORIGIN: '' }))).toThrow(
      'CORS_ORIGIN wajib diisi.',
    );
    expect(() => loadServerConfig(validEnv({ CORS_ORIGIN: '*' }))).toThrow(
      'CORS_ORIGIN harus berisi origin eksplisit, bukan wildcard.',
    );
  });

  it('parses multiple CORS origins', () => {
    const config = loadServerConfig(
      validEnv({
        CORS_ORIGIN: 'http://localhost:5173,https://tasks.example.com',
      }),
    );

    expect(config.corsOrigins).toEqual([
      'http://localhost:5173',
      'https://tasks.example.com',
    ]);
  });

  it('rejects invalid environment, port, and database URLs', () => {
    expect(() => loadServerConfig(validEnv({ NODE_ENV: 'staging' }))).toThrow(
      'NODE_ENV harus development, test, atau production.',
    );
    expect(() => loadServerConfig(validEnv({ PORT: '0' }))).toThrow(
      'PORT harus berupa angka antara 1 dan 65535.',
    );
    expect(() => loadServerConfig(validEnv({ DATABASE_URL: 'sqlite:db' }))).toThrow(
      'DATABASE_URL harus berupa URL PostgreSQL yang valid.',
    );
  });

  it('uses secure production cookie defaults', () => {
    const config = loadServerConfig(validEnv({ NODE_ENV: 'production' }));

    expect(config.sessionTtlHours).toBe(168);
    expect(config.authCookie).toEqual({
      name: 'ptm_session',
      secure: true,
      sameSite: 'Lax',
    });
  });

  it('accepts explicit session and cookie configuration', () => {
    const config = loadServerConfig(
      validEnv({
        SESSION_TTL_HOURS: '24',
        AUTH_COOKIE_SECURE: 'true',
        AUTH_COOKIE_SAME_SITE: 'none',
        AUTH_COOKIE_NAME: 'custom_session',
      }),
    );

    expect(config.sessionTtlHours).toBe(24);
    expect(config.authCookie).toEqual({
      name: 'custom_session',
      secure: true,
      sameSite: 'None',
    });
  });

  it('rejects invalid session and cookie configuration', () => {
    expect(() =>
      loadServerConfig(validEnv({ SESSION_TTL_HOURS: '0' })),
    ).toThrow('SESSION_TTL_HOURS harus berupa integer antara 1 dan 8760.');
    expect(() =>
      loadServerConfig(validEnv({ SESSION_TTL_HOURS: '1.5' })),
    ).toThrow('SESSION_TTL_HOURS harus berupa integer antara 1 dan 8760.');
    expect(() =>
      loadServerConfig(validEnv({ SESSION_TTL_HOURS: 'abc' })),
    ).toThrow('SESSION_TTL_HOURS harus berupa integer antara 1 dan 8760.');
    expect(() =>
      loadServerConfig(validEnv({ AUTH_COOKIE_SECURE: 'yes' })),
    ).toThrow('AUTH_COOKIE_SECURE harus berupa boolean true atau false.');
    expect(() =>
      loadServerConfig(validEnv({ AUTH_COOKIE_SAME_SITE: 'invalid' })),
    ).toThrow('AUTH_COOKIE_SAME_SITE harus Lax, Strict, atau None.');
    expect(() =>
      loadServerConfig(validEnv({ AUTH_COOKIE_SAME_SITE: 'none' })),
    ).toThrow(
      'AUTH_COOKIE_SAME_SITE=None memerlukan AUTH_COOKIE_SECURE=true.',
    );
    expect(() =>
      loadServerConfig(validEnv({ AUTH_COOKIE_NAME: 'bad name' })),
    ).toThrow('AUTH_COOKIE_NAME harus berupa nama cookie yang valid.');
  });

  it('requires secure cookies in production', () => {
    expect(() =>
      loadServerConfig(
        validEnv({ NODE_ENV: 'production', AUTH_COOKIE_SECURE: 'false' }),
      ),
    ).toThrow('AUTH_COOKIE_SECURE wajib bernilai true pada production.');
  });
});

describe('loadTestConfig', () => {
  it('loads valid test configuration and ignores runtime URLs', () => {
    const config = loadTestConfig({
      NODE_ENV: 'test',
      TEST_DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
      TEST_DATABASE_URL_UNPOOLED:
        'postgresql://test:test@localhost:5432/test?direct=true',
      DATABASE_URL: databaseUrl,
      DATABASE_URL_UNPOOLED: unpooledUrl,
    });

    expect(config).toMatchObject({
      nodeEnv: 'test',
      databaseUrl: 'postgresql://test:test@localhost:5432/test',
    });
  });

  it('rejects test execution in production mode', () => {
    expect(() =>
      loadTestConfig({
        NODE_ENV: 'production',
        TEST_DATABASE_URL: databaseUrl,
        TEST_DATABASE_URL_UNPOOLED: unpooledUrl,
      }),
    ).toThrow('Test tidak boleh dijalankan dengan NODE_ENV=production.');
  });

  it('rejects test URLs that match runtime URLs', () => {
    expect(() =>
      loadTestConfig({
        NODE_ENV: 'test',
        TEST_DATABASE_URL: databaseUrl,
        TEST_DATABASE_URL_UNPOOLED: unpooledUrl,
        DATABASE_URL: databaseUrl,
        DATABASE_URL_UNPOOLED: unpooledUrl,
      }),
    ).toThrow('TEST_DATABASE_URL tidak boleh sama dengan DATABASE_URL.');
  });

  it('rejects missing test URLs', () => {
    expect(() =>
      loadTestConfig({
        NODE_ENV: 'test',
        TEST_DATABASE_URL_UNPOOLED: unpooledUrl,
      }),
    ).toThrow('TEST_DATABASE_URL wajib diisi.');
  });
});
