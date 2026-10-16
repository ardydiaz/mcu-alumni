import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import Icon from '../ui/Icon.jsx';
import { navigation, updateInfo } from './navigation.js';
import { usePortalAuth } from '../../context/PortalAuthContext.jsx';
import SiteSearch from './SiteSearch.jsx';

const LOGO = 'https://alumni.mcu.edu.ph/wp-content/uploads/2023/11/header-logo.png';

function Dropdown({ label, items, align = 'left', cta = false, icon }) {
  const { pathname } = useLocation();
  const active = items.some((i) => i.to === pathname);
  return (
    <div className={`nav-dropdown ${align === 'right' ? 'nav-dropdown--right' : ''}`}>
      <button type="button" className={cta ? 'navbar__update' : `nav-link ${active ? 'active' : ''}`} aria-haspopup="true">
        {icon && <span className="navbar__update-icon" aria-hidden="true"><Icon name={icon} size={16} /></span>}
        {label} <Icon name="chevronDown" size={16} />
      </button>
      <div className="nav-dropdown__menu" role="menu">
        {items.map((item) => (
          <NavLink key={item.to} to={item.to} className="nav-dropdown__item" role="menuitem">
            <strong>{item.label}</strong>
            <span>{item.description}</span>
          </NavLink>
        ))}
      </div>
    </div>
  );
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();
  const portal = usePortalAuth();
  const portalLink = portal.status === 'authenticated'
    ? { to: '/portal/account', label: 'My Alumni Account' }
    : { to: '/portal/login', label: 'Alumni Portal Login' };

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
  }, [open]);

  return (
    <header className={`site-header ${scrolled ? 'is-scrolled' : ''}`}>
      <div className="topbar">
        <div className="container topbar__inner">
          <div className="topbar__contact">
            <span><Icon name="pin" size={14} /> EDSA, Caloocan City 1400</span>
            <a href="tel:+639171046520"><Icon name="phone" size={14} /> (+63) 917 104 6520</a>
            <a href="mailto:alumni@mcu.edu.ph" className="hide-sm"><Icon name="mail" size={14} /> alumni@mcu.edu.ph</a>
          </div>
          <Link to={portalLink.to} className="topbar__portal">
            <Icon name="id" size={15} /> {portalLink.label}
          </Link>
        </div>
      </div>

      <nav className="container navbar" aria-label="Main">
        <Link to="/" className="navbar__brand" aria-label="MCU Alumni home">
          <img src={LOGO} alt="Manila Central University" />
          <span className="navbar__badge">Alumni</span>
        </Link>

        <div className="navbar__links">
          {navigation.map((item) =>
            item.children ? (
              <Dropdown key={item.label} label={item.label} items={item.children} />
            ) : (
              <NavLink key={item.to} to={item.to} end className="nav-link">
                {item.label}
              </NavLink>
            )
          )}
        </div>

        <div className="navbar__actions">
          <SiteSearch />
          <div className="navbar__cta">
            <Dropdown label="Update Your Info" items={updateInfo} align="right" cta icon="id" />
          </div>
          <button type="button" className="navbar__toggle" onClick={() => setOpen(true)} aria-label="Open menu" aria-expanded={open}>
            <Icon name="menu" size={24} />
          </button>
        </div>
      </nav>

      <div className={`drawer ${open ? 'is-open' : ''}`} aria-hidden={!open}>
        <div className="drawer__backdrop" onClick={() => setOpen(false)} />
        <div className="drawer__panel" role="dialog" aria-label="Menu">
          <div className="drawer__head">
            <img src={LOGO} alt="" />
            <button type="button" onClick={() => setOpen(false)} aria-label="Close menu">
              <Icon name="close" size={24} />
            </button>
          </div>
          <Link to={portalLink.to} className="btn btn-gold btn-block drawer__portal">
            <Icon name="users" size={18} /> {portalLink.label}
          </Link>
          <div className="drawer__links">
            {navigation.flatMap((item) => (item.children ? item.children : [item])).map((item) => (
              <NavLink key={item.to} to={item.to} end className="drawer__link">
                {item.label}
              </NavLink>
            ))}
            <p className="drawer__label">Update Your Info Now</p>
            {updateInfo.map((item) => (
              <NavLink key={item.to} to={item.to} className="drawer__link">
                {item.label}
              </NavLink>
            ))}
          </div>
          <Link to="/give" className="btn btn-primary btn-block">
            <Icon name="heart" size={18} /> Give Now
          </Link>
        </div>
      </div>
    </header>
  );
}
