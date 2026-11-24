import { Navigate, useSearchParams } from 'react-router-dom';
import { usePortalAuth } from '../../context/PortalAuthContext.jsx';
import { safeNext } from './usePortalAuthModal.js';

/**
 * /portal/login, /portal/register and /portal/forgot-password (links in emails, typed addresses, new tabs):
 * there are no separate pages any more, so open the modal over the page in ?next=, or the Alumni Portal page.
 * Portal pages behind a login can't be the background (they would redirect back here), so those use /portal.
 */
export default function PortalAuthRoute({ mode }) {
  const { status } = usePortalAuth();
  const [params] = useSearchParams();
  const next = safeNext(params.get('next'));

  if (status === 'loading') return null;
  if (status === 'authenticated') return <Navigate to={next || '/portal/account'} replace />;

  const base = next && !/^\/portal(\/|$|\?)/.test(next) ? next : '/portal';
  const url = new URL(base, window.location.origin);
  url.searchParams.set('portal', mode);
  if (params.get('email')) url.searchParams.set('email', params.get('email'));
  if (next) url.searchParams.set('next', next);
  return <Navigate to={`${url.pathname}${url.search}`} replace />;
}
