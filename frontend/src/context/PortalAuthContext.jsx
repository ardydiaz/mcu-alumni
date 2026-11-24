import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { portalApi, portalSession } from '../api/portal.js';

const PortalAuthContext = createContext(null);

/**
 * Alumni Portal session (not the staff admin session).
 *   loading        checking a saved session on page load
 *   anonymous      not logged in
 *   authenticated  logged in; account.status is "pending" (waiting for review) or "verified"
 */
export function PortalAuthProvider({ children }) {
  const [state, setState] = useState(() => ({ account: null, status: portalSession.get() ? 'loading' : 'anonymous' }));

  const refresh = useCallback(async () => {
    if (!portalSession.get()) return setState({ account: null, status: 'anonymous' });
    try {
      const { data } = await portalApi.me();
      setState({ account: data, status: 'authenticated' });
    } catch {
      portalSession.set(null); // expired, rejected or removed
      setState({ account: null, status: 'anonymous' });
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(async (credentials) => {
    const { data } = await portalApi.login(credentials);
    portalSession.set(data.token);
    setState({ account: data.account, status: 'authenticated' });
    return data.account;
  }, []);

  // Activating from an invitation signs the graduate in straight away.
  const activate = useCallback(async (data) => {
    const res = await portalApi.activate(data);
    portalSession.set(res.data.token);
    setState({ account: res.data.account, status: 'authenticated' });
    return res;
  }, []);

  // loggedOut: when the alumnus logged out on purpose (vs. never logged in / session expired). Portal pages
  // then go to the homepage with a "You've been logged out" message instead of asking to log in again.
  const logout = useCallback(() => {
    portalSession.set(null);
    setState({ account: null, status: 'anonymous', loggedOut: Date.now() });
  }, []);

  const value = useMemo(() => ({ ...state, login, activate, logout, refresh }), [state, login, activate, logout, refresh]);
  return <PortalAuthContext.Provider value={value}>{children}</PortalAuthContext.Provider>;
}

export const usePortalAuth = () => useContext(PortalAuthContext);
