import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import Icon from '../components/ui/Icon.jsx';
import { adminNav } from '../components/admin/adminNav.js';
import { ToastProvider } from '../components/admin/Toast.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import '../styles/admin.css';

const LOGO_WHITE = 'https://alumni.mcu.edu.ph/wp-content/uploads/2023/12/mcu-logo-white.png';

const initials = (user) =>
  String(user?.fullname || user?.email || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

export default function AdminLayout() {
  const { user, isSuperAdmin, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();

  useEffect(() => setOpen(false), [pathname]);

  const signOut = async () => {
    await logout();
    navigate('/admin/login', { replace: true });
  };

  return (
    <div className={`admin ${open ? 'is-nav-open' : ''}`}>
      <aside className="admin-sidebar" aria-label="Admin navigation">
        <div className="admin-sidebar__brand">
          <img src={LOGO_WHITE} alt="Manila Central University" />
          <span>Alumni Admin</span>
        </div>
        <nav className="admin-sidebar__nav">
          {adminNav.map((section) => {
            const items = section.items.filter((i) => !i.superAdminOnly || isSuperAdmin);
            if (!items.length) return null;
            return (
              <div key={section.group} className="admin-sidebar__group">
                <p>{section.group}</p>
                {items.map((item) => (
                  <NavLink key={item.to} to={item.to} end={item.end} className="admin-sidebar__link">
                    <Icon name={item.icon} size={18} /> {item.label}
                  </NavLink>
                ))}
              </div>
            );
          })}
        </nav>
        <Link to="/" className="admin-sidebar__site" target="_blank" rel="noreferrer">
          <Icon name="external" size={16} /> View website
        </Link>
      </aside>
      <div className="admin-backdrop" onClick={() => setOpen(false)} aria-hidden="true" />

      <div className="admin-main">
        <header className="admin-topbar">
          <button type="button" className="admin-topbar__menu" onClick={() => setOpen(true)} aria-label="Open navigation">
            <Icon name="menu" size={22} />
          </button>
          <div className="admin-topbar__spacer" />
          <Link to="/admin/profile" className="admin-user">
            <span className="admin-user__avatar" aria-hidden="true">{initials(user)}</span>
            <span className="admin-user__meta">
              <strong>{user?.fullname}</strong>
              <small>{user?.role}</small>
            </span>
          </Link>
          <button type="button" className="btn btn-sm admin-btn-ghost" onClick={signOut}>
            Sign out
          </button>
        </header>
        <main className="admin-content" id="main">
          <ToastProvider>
            <Outlet />
          </ToastProvider>
        </main>
      </div>
    </div>
  );
}
