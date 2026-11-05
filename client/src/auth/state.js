export const AUTH_STATUS = {
  loading: 'loading',
  authenticated: 'authenticated',
  unauthenticated: 'unauthenticated',
};

export function initialAuthState() {
  return {
    status: AUTH_STATUS.loading,
    user: null,
    error: '',
  };
}

export function authReducer(state, action) {
  switch (action.type) {
    case 'AUTH_LOADING':
      return { ...state, status: AUTH_STATUS.loading, error: '' };
    case 'AUTH_AUTHENTICATED':
      return {
        status: AUTH_STATUS.authenticated,
        user: action.user,
        error: '',
      };
    case 'AUTH_UNAUTHENTICATED':
      return {
        status: AUTH_STATUS.unauthenticated,
        user: null,
        error: '',
      };
    case 'AUTH_ERROR':
      return {
        ...state,
        error: action.message ?? 'Terjadi kesalahan.',
      };
    default:
      return state;
  }
}
