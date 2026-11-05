import { describe, expect, it } from 'vitest';
import { authReducer, initialAuthState } from './state.js';

describe('authReducer', () => {
  it('starts in loading state', () => {
    expect(initialAuthState()).toEqual({
      status: 'loading',
      user: null,
      error: '',
    });
  });

  it('stores an authenticated user and clears errors', () => {
    const state = authReducer(
      { status: 'loading', user: null, error: 'old' },
      { type: 'AUTH_AUTHENTICATED', user: { id: 'u1', email: 'a@example.com' } },
    );

    expect(state).toEqual({
      status: 'authenticated',
      user: { id: 'u1', email: 'a@example.com' },
      error: '',
    });
  });

  it('clears the user when unauthenticated', () => {
    const state = authReducer(
      {
        status: 'authenticated',
        user: { id: 'u1', email: 'a@example.com' },
        error: '',
      },
      { type: 'AUTH_UNAUTHENTICATED' },
    );

    expect(state).toEqual({
      status: 'unauthenticated',
      user: null,
      error: '',
    });
  });

  it('keeps the current status when an error is recorded', () => {
    const state = authReducer(
      { status: 'authenticated', user: { id: 'u1' }, error: '' },
      { type: 'AUTH_ERROR', message: 'Gagal' },
    );

    expect(state).toMatchObject({
      status: 'authenticated',
      user: { id: 'u1' },
      error: 'Gagal',
    });
  });

  it('returns the same state for unknown actions', () => {
    const state = { status: 'loading', user: null, error: '' };
    expect(authReducer(state, { type: 'UNKNOWN' })).toBe(state);
  });
});
