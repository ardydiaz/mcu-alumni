import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import Icon from '../ui/Icon.jsx';
import { navigation, portalMenu } from './navigation.js';
import { usePortalAuth } from '../../context/PortalAuthContext.jsx';
import PortalAvatar from '../portal/PortalAvatar.jsx';
import { usePortalAuthModal, modalLink } from '../portal/usePortalAuthModal.js';

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

// "Diaz, Ardy P." -> { first: "Ardy", initials: "AD" }
function who(fullName = '') {
  const [last = '', given = ''] = fullName.split(',').map((s) => s.trim());
  const first = given.split(/\s+/)[0] || last;
  return { first, initials: `${given[0] || ''}${last[0] || ''}`.toUpperCase() || 'MCU' };
}

// One account button for everything alumni do on the site.
//   Logged out: "Alumni Portal" -> what you can do + Log in / Create an account.
//   Logged in:  "Hi, Ardy" -> portal pages + Log out.
function AccountMenu({ portal, onLogout, onOpenModal }) {
  const { pathname } = useLocation();
  const signedIn = portal.status === 'authenticated';
  const me = signedIn ? who(portal.account?.fullName) : null;
  const pending = signedIn && portal.account?.status !== 'verified';

  return (
    <div className="nav-dropdown nav-dropdown--right nav-account">
      <button type="button" className={`navbar__update${signedIn ? ' is-signed-in' : ''}`} aria-haspopup="true">
        {signedIn ? <PortalAvatar account={portal.account} className="navbar__update-icon" /> : <span className="navbar__update-icon" aria-hidden="true"><Icon name="userCheck" size={16} /></span>}
        {signedIn ? `Hi, ${me.first}` : 'Alumni Portal'} <Icon name="chevronDown" size={16} className="nav-account__chevron" />
      </button>
      <div className="nav-dropdown__menu nav-account__menu" role="menu">
        {signedIn ? (
          <>
            <div className="nav-account__head">
              <strong>{portal.account.fullName}</strong>
              <span className={`nav-account__status${pending ? ' is-pending' : ''}`}>{pending ? 'Waiting for verification' : 'Verified alumni'}</span>
            </div>
            {portalMenu.map((item) => (
              <NavLink key={item.to} to={item.to} end className={`nav-account__item${item.to === pathname ? ' active' : ''}`} role="menuitem">
                <Icon name={item.icon} size={16} />
                <span><strong>{item.label}</strong><small>{item.description}</small></span>
              </NavLink>
            ))}
            <button type="button" className="nav-account__logout" onClick={onLogout} role="menuitem">
              <Icon name="arrowRight" size={16} className="flip" /> Log out
            </button>
          </>
        ) : (
          <>
            <div className="nav-account__intro">
              <strong>Centralino access</strong>
              <span>Manage your alumni credentials</span>
            </div>
            <Link to="/portal/login" onClick={modalLink(() => onOpenModal('login'))} className="nav-account__action" role="menuitem" aria-haspopup="dialog">
              <span className="nav-account__tile" aria-hidden="true"><Icon name="login" size={18} /></span>
              <span><strong>Alumni Login</strong><small>Access dashboard &amp; perks</small></span>
            </Link>
            <Link to="/portal/register" onClick={modalLink(() => onOpenModal('register'))} className="nav-account__action" role="menuitem" aria-haspopup="dialog">
              <span className="nav-account__tile nav-account__tile--gold" aria-hidden="true"><Icon name="userPlus" size={18} /></span>
              <span><strong>Create Account</strong><small>New graduate registration</small></span>
            </Link>
            <p className="nav-account__hint">Got an activation email from the Alumni Office? Use the link in it.</p>
          </>
        )}
      </div>
    </div>
  );
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const portal = usePortalAuth();
  const authModal = usePortalAuthModal();
  const signedIn = portal.status === 'authenticated';
  const me = signedIn ? who(portal.account?.fullName) : null;
  const logout = () => {
    portal.logout();
    setOpen(false);
    navigate('/');
  };

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
          <div className="navbar__cta">
            <AccountMenu portal={portal} onLogout={logout} onOpenModal={authModal.open} />
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
          {signedIn ? (
            <div className="drawer__account">
              <div className="drawer__me">
                <PortalAvatar account={portal.account} className="drawer__avatar" />
                <div>
                  <strong>Hi, {me.first}</strong>
                  <small>{portal.account?.status === 'verified' ? 'Verified alumni' : 'Waiting for verification'}</small>
                </div>
              </div>
              <div className="drawer__portal-links">
                {portalMenu.map((item) => (
                  <NavLink key={item.to} to={item.to} end className="drawer__portal-link">
                    <Icon name={item.icon} size={16} /> {item.label}
                  </NavLink>
                ))}
              </div>
              <button type="button" className="drawer__logout" onClick={logout}>Log out</button>
            </div>
          ) : (
            <div className="drawer__account">
              <p className="drawer__account-text"><strong>MCU graduate?</strong> Log in to update your information, answer the Graduate Tracer and register for events.</p>
              <div className="drawer__account-actions">
                <Link to="/portal/login" onClick={modalLink(() => { setOpen(false); authModal.open('login'); })} className="btn btn-gold" aria-haspopup="dialog">Log in</Link>
                <Link to="/portal/register" onClick={modalLink(() => { setOpen(false); authModal.open('register'); })} className="btn btn-outline" aria-haspopup="dialog">Create an account</Link>
              </div>
            </div>
          )}
          <div className="drawer__links">
            {navigation.flatMap((item) => (item.children ? item.children : [item])).map((item) => (
              <NavLink key={item.to} to={item.to} end className="drawer__link">
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
