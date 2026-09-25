import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  authRequest,
  exchangeM365Ticket,
  logout as logoutRequest,
  refreshSession,
  setSession,
  clearSession,
  hasStoredSession,
  getRefreshToken,
} from '../api/client.js';

export const ADMIN_PANEL_ROLES = ['Super Admin', 'Administrator'];

const AuthContext = createContext(null);

/**
 * Session status:
 *   loading        restoring a saved session on page load
 *   anonymous      not signed in
 *   authenticated  signed in and GET /auth/profile allowed (Super Admin / Administrator)
 *   forbidden      signed in with Microsoft, but the role has no dashboard access (403)
 */
export function AuthProvider({ children }) {
  const [state, setState] = useState(() => ({ user: null, status: hasStoredSession() ? 'loading' : 'anonymous' }));

  // After Microsoft sign-in or a session refresh, ask the backend whether this
  // role may use the dashboard: JWT -> role -> Super Admin / Administrator, else 403.
  const loadProfile = useCallback(async (tokenUser) => {
    try {
      const { data } = await authRequest('/auth/profile');
      setState({ user: data, status: 'authenticated' });
      return data;
    } catch (err) {
      if (err.status === 403) {
        setState({ user: tokenUser, status: 'forbidden' });
        return tokenUser;
      }
      clearSession();
      setState({ user: null, status: 'anonymous' });
      throw err;
    }
  }, []);

  useEffect(() => {
    if (!hasStoredSession()) return;
    refreshSession()
      .then(({ user }) => loadProfile(user))
      .catch(() => setState({ user: null, status: 'anonymous' }));
  }, [loadProfile]);

  // Refresh token expired or was revoked while using the admin panel.
  useEffect(() => {
    const onExpired = () => setState({ user: null, status: 'anonymous' });
    window.addEventListener('auth:expired', onExpired);
    return () => window.removeEventListener('auth:expired', onExpired);
  }, []);

  const loginWithTicket = useCallback(
    async (ticket) => {
      const { data } = await exchangeM365Ticket(ticket);
      setSession(data);
      return loadProfile(data.user);
    },
    [loadProfile]
  );

  const logout = useCallback(async () => {
    const token = getRefreshToken();
    clearSession();
    setState({ user: null, status: 'anonymous' });
    if (token) await logoutRequest(token);
  }, []);

  const updateUser = useCallback((user) => setState((s) => ({ ...s, user })), []);

  const value = useMemo(
    () => ({ ...state, isSuperAdmin: state.user?.role === 'Super Admin', loginWithTicket, logout, updateUser }),
    [state, loginWithTicket, logout, updateUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
