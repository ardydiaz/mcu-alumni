import { Link, useLocation } from 'react-router-dom';
import { AUTH_PATHS, modalLink, usePortalAuthModal } from './usePortalAuthModal.js';

/**
 * A link that opens the Alumni Portal login / register / forgot-password modal on the current page.
 * - stay: after logging in, stay on this page (events, Graduate Tracer...) instead of going to the dashboard.
 * - email: prefill the email field.
 * - onOpen: called before the modal opens (e.g. close the mobile menu).
 * The href is the real address, so Ctrl+click / "open in new tab" still works (it opens the same modal there).
 */
export default function PortalAuthLink({ mode = 'login', stay = false, email, onOpen, children, ...rest }) {
  const { open } = usePortalAuthModal();
  const { pathname, search } = useLocation();
  const q = new URLSearchParams();
  if (stay) q.set('next', `${pathname}${search}`);
  if (email) q.set('email', email);
  const href = `${AUTH_PATHS[mode]}${q.toString() ? `?${q}` : ''}`;

  return (
    <Link
      to={href}
      aria-haspopup="dialog"
      {...rest}
      onClick={modalLink(() => {
        onOpen?.();
        open(mode, { stay, email });
      })}
    >
      {children}
    </Link>
  );
}
