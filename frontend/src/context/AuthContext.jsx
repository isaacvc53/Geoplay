import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, setUnauthorizedHandler } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [loggedIn, setLoggedIn] = useState(api.isLoggedIn());
  const [user, setUser] = useState(null);

  // A 401 from any API call clears the token (api.js) and lands here.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      setLoggedIn(false);
      setUser(null);
      const page = window.location.pathname;
      if (page !== '/login' && page !== '/register') {
        window.location.href = '/login?expired=1';
      }
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  useEffect(() => {
    if (!loggedIn) return;
    api.getCurrentUser().then(setUser).catch(() => {});
  }, [loggedIn]);

  const login = useCallback(async (email, password) => {
    await api.login(email, password);
    setLoggedIn(true);
  }, []);

  const register = useCallback(async (email, username, password) => {
    await api.register(email, username, password);
    await api.login(email, password);
    setLoggedIn(true);
  }, []);

  const logout = useCallback(() => {
    api.logout();
    setLoggedIn(false);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ loggedIn, user, updateUser: setUser, login, register, logout }),
    [loggedIn, user, login, register, logout]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
