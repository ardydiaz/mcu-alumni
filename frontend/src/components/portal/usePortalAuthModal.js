import { useCallback } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

export const AUTH_MODES = ['login', 'register', 'forgot'];
export const AUTH_PATHS = { login: '/portal/login', register: '/portal/register', forgot: '/portal/forgot-password' };
const EXTRA_PARAMS = ['email', 'next']; // only meaningful while the modal is open

// "/events/x?event=y" -> itself; anything that isn't a path on this site -> null.
export const safeNext = (value) => (/^\/(?!\/)/.test(value || '') ? value : null);

/**
 * onClick for a <Link to="/portal/login"> (or register / forgot) that should open the modal instead.
 * A plain click opens the modal; Ctrl/Cmd/Shift/middle-click still follows the link (e.g. in a new tab).
 */
export const modalLink = (openModal) => (e) => {
  if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  e.preventDefault();
  e.currentTarget.blur(); // closes a hover/focus dropdown behind the modal
  openModal();
};

/**
 * Alumni Portal login / register / forgot password open in a modal on the current page, kept in the address bar
 * as ?portal=login|register|forgot: Back closes it, and switching between them replaces the entry.
 *
 * History state: portalModal = opened from this page (so closing goes Back); stay = after logging in, stay on
 * this page (e.g. "Log in to register" on an event) instead of going to the dashboard.
 */
export function usePortalAuthModal() {
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const mode = AUTH_MODES.includes(params.get('portal')) ? params.get('portal') : null;

  // open('login'), open('forgot', { email }), open('login', { stay: true })
  const open = useCallback(
    (next, { stay, email } = {}) => {
      const switching = Boolean(mode); // already open: replace the entry, keep how it was opened
      setParams(
        (p) => {
          const q = new URLSearchParams(p);
          q.set('portal', next);
          if (email) q.set('email', email);
          else q.delete('email');
          return q;
        },
        {
          replace: switching,
          preventScrollReset: true,
          state: switching
            ? { portalModal: Boolean(location.state?.portalModal), stay: stay ?? Boolean(location.state?.stay) }
            : { portalModal: true, stay: Boolean(stay) },
        }
      );
    },
    [mode, setParams, location.state]
  );

  // Removes ?portal (and its helpers) without adding a history entry.
  const dismiss = useCallback(
    () =>
      setParams(
        (p) => {
          const q = new URLSearchParams(p);
          ['portal', ...EXTRA_PARAMS].forEach((k) => q.delete(k));
          return q;
        },
        { replace: true, preventScrollReset: true }
      ),
    [setParams]
  );

  const close = useCallback(() => {
    if (location.state?.portalModal) navigate(-1); // opened here: going back closes it
    else dismiss(); // arrived with ?portal in the URL (email link, typed address)
  }, [location.state, navigate, dismiss]);

  return { mode, open, close, dismiss, stay: Boolean(location.state?.stay), next: safeNext(params.get('next')), email: params.get('email') || '' };
}
