import { useCallback, useEffect, useReducer, useRef } from 'react';
import { api, setAuthExpiredHandler, setCsrfToken } from '../api.js';
import { authReducer, initialAuthState } from './state.js';

export function useAuth() {
  const [state, dispatch] = useReducer(authReducer, undefined, initialAuthState);
  const bootstrapRef = useRef(true);

  const markAuthenticated = useCallback((data) => {
    bootstrapRef.current = false;
    setCsrfToken(data?.csrf_token);
    dispatch({ type: 'AUTH_AUTHENTICATED', user: data?.user ?? null });
  }, []);

  const markUnauthenticated = useCallback(() => {
    bootstrapRef.current = false;
    setCsrfToken('');
    dispatch({ type: 'AUTH_UNAUTHENTICATED' });
  }, []);

  useEffect(() => {
    let active = true;

    api
      .me()
      .then((data) => {
        if (active && bootstrapRef.current) {
          markAuthenticated(data);
        }
      })
      .catch(() => {
        if (active && bootstrapRef.current) {
          markUnauthenticated();
        }
      });

    return () => {
      active = false;
    };
  }, [markAuthenticated, markUnauthenticated]);

  useEffect(() => {
    setAuthExpiredHandler(markUnauthenticated);
    return () => setAuthExpiredHandler(null);
  }, [markUnauthenticated]);

  const login = useCallback(
    async (payload) => {
      const data = await api.login(payload);
      markAuthenticated(data);
      return data;
    },
    [markAuthenticated],
  );

  const register = useCallback(
    async (payload) => {
      const data = await api.register(payload);
      markAuthenticated(data);
      return data;
    },
    [markAuthenticated],
  );

  const logout = useCallback(async () => {
    await api.logout();
    markUnauthenticated();
  }, [markUnauthenticated]);

  return {
    ...state,
    login,
    register,
    logout,
  };
}
