import { useEffect } from 'react';
import { NavLink, Navigate, Outlet, useLocation } from 'react-router-dom';
import Icon from '../../components/ui/Icon.jsx';
import { FullPageLoader } from '../../routes/ProtectedRoute.jsx';
import { usePortalAuth } from '../../context/PortalAuthContext.jsx';
import { StatusBadge } from './portalShared.jsx';
import PortalAvatar from '../../components/portal/PortalAvatar.jsx';
import '../../styles/portal.css';

// Pages that open inside the portal (sidebar stays on the left).
export const PORTAL_NAV = [
  { icon: 'compass', label: 'Dashboard', to: '/portal/account', end: true },
  { icon: 'users', label: 'My profile', to: '/portal/profile' },
  { icon: 'file', label: 'Graduate Tracer', to: '/portal/graduate-tracer' },
  { icon: 'id', label: 'Alumni ID', to: '/portal/alumni-id' },
  { icon: 'tag', label: 'Alumni perks', to: '/portal/perks' },
  { icon: 'heart', label: 'Give back', to: '/portal/give' },
];

// "Diaz, Ardy P." -> "AD"
export function initials(fullName = '') {
  const [last = '', given = ''] = fullName.split(',').map((s) => s.trim());
  return `${given[0] || ''}${last[0] || ''}`.toUpperCase() || 'MCU';
}

// "Diaz, Ardy P." -> "Ardy P. Diaz"
export function displayName(fullName = '') {
  const [last, given] = fullName.split(',').map((s) => s.trim());
  return given ? `${given} ${last}` : fullName;
}

// Shell for signed-in portal pages: sidebar + the current page.
export default function PortalLayout() {
  const { status, account, logout, refresh, loggedOut } = usePortalAuth();
  const { pathname } = useLocation();

  // Pick up a review that happened since login (pending -> verified).
  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  if (status === 'loading') return <FullPageLoader />;
  // Just logged out: the homepage (with a "logged out" message), not a login prompt.
  if (status !== 'authenticated' && loggedOut) return <Navigate to="/" replace />;
  // Not logged in (e.g. a bookmarked portal page): the login modal over the Alumni Portal page, then back here.
  if (status !== 'authenticated') return <Navigate to={`/portal/login?next=${encodeURIComponent(pathname)}`} replace />;

  return (
    <div className="portal portal-page portal-dash-page">
      <div className="container portal-dash">
        <aside className="portal-side">
          <div className="portal-side__profile">
            <PortalAvatar account={account} className="portal-avatar" />
            <div className="portal-side__who">
              <strong>{displayName(account.fullName)}</strong>
              <small>{account.email}</small>
            </div>
            <StatusBadge status={account.status} />
          </div>
          <nav className="portal-side__nav" aria-label="Alumni Portal">
            {PORTAL_NAV.map((n) => (
              <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => `portal-side__link ${isActive ? 'is-active' : ''}`}>
                <Icon name={n.icon} size={18} /> {n.label}
              </NavLink>
            ))}
          </nav>
          <button type="button" className="portal-side__logout" onClick={logout}>
            <Icon name="arrowRight" size={16} /> Log out
          </button>
        </aside>

        <div className="portal-main">
          <Outlet context={{ account }} />
        </div>
      </div>
    </div>
  );
}

// Title block at the top of a portal page.
export function PortalPageHead({ icon, eyebrow, title, text }) {
  return (
    <header className="portal-head">
      <span className="portal-head__icon" aria-hidden="true"><Icon name={icon} size={24} /></span>
      <div>
        {eyebrow && <span className="portal-head__eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        {text && <p>{text}</p>}
      </div>
    </header>
  );
}
