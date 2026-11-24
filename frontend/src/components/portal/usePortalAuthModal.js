import { useCallback } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

const MODES = ['login', 'register'];

/**
 * onClick for a <Link to="/portal/login"> (or register) that should open the modal instead.
 * A plain click opens the modal; Ctrl/Cmd/Shift/middle-click still opens the full page (e.g. in a new tab).
 */
export const modalLink = (openModal) => (e) => {
  if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  e.preventDefault();
  e.currentTarget.blur(); // closes a hover/focus dropdown behind the modal
  openModal();
};

/**
 * Header "Alumni Login" / "Create Account" open in a modal on the current page, kept in the address bar as
 * ?portal=login|register: Back closes it, and switching between login and register replaces the entry.
 */
export function usePortalAuthModal() {
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const mode = MODES.includes(params.get('portal')) ? params.get('portal') : null;

  const setMode = useCallback(
    (next, { replace = false } = {}) =>
      setParams(
        (p) => {
          const q = new URLSearchParams(p);
          if (next) q.set('portal', next);
          else q.delete('portal');
          return q;
        },
        { replace, preventScrollReset: true, state: next ? { portalModal: true } : undefined }
      ),
    [setParams]
  );

  const open = useCallback((next) => setMode(next, { replace: Boolean(mode) }), [setMode, mode]);
  const close = useCallback(() => {
    if (location.state?.portalModal) navigate(-1); // opened here: going back closes it
    else setMode(null, { replace: true });
  }, [location.state, navigate, setMode]);

  // Drops ?portal without touching history (used when the visitor is already logged in).
  const dismiss = useCallback(() => setMode(null, { replace: true }), [setMode]);

  return { mode, open, close, dismiss };
}
