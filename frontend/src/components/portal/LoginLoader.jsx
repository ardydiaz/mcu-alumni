import { useEffect, useRef } from 'react';
import Icon from '../ui/Icon.jsx';
import PortalAvatar from './PortalAvatar.jsx';
import { firstName } from '../../pages/portal/portalShared.jsx';

const LOGO = 'https://alumni.mcu.edu.ph/wp-content/uploads/2023/12/mcu-logo-white.png';

/**
 * Full-screen "Welcome back" screen shown for a moment after a successful login, while the portal opens.
 * A native <dialog> so it sits above everything, including an event modal underneath. It can't be dismissed.
 * leaving: fades out (the page behind is already the next one).
 */
export default function LoginLoader({ account, stay = false, leaving = false, duration }) {
  const ref = useRef(null);

  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
    document.documentElement.classList.add('pll-lock');
    return () => {
      document.documentElement.classList.remove('pll-lock');
      if (dialog?.open) dialog.close();
    };
  }, []);

  const name = firstName(account?.fullName || '') || 'Centralino';
  return (
    <dialog
      ref={ref}
      className={`pll${leaving ? ' is-leaving' : ''}`}
      aria-label="Logging you in"
      onCancel={(e) => e.preventDefault()}
      style={{ '--pll-duration': `${duration}ms` }}
    >
      <div className="pll__glow pll__glow--a" aria-hidden="true" />
      <div className="pll__glow pll__glow--b" aria-hidden="true" />
      <div className="pll__inner" role="status" aria-live="polite">
        <img className="pll__logo" src={LOGO} alt="Manila Central University" />

        <div className="pll__ring" aria-hidden="true">
          <span className="pll__spin" />
          <PortalAvatar account={account} className="pll__avatar" />
          <span className="pll__check"><Icon name="check" size={14} /></span>
        </div>

        <span className="pll__eyebrow">Login successful</span>
        <h2>Welcome back, {name}!</h2>
        <p>{stay ? 'Taking you back where you left off…' : 'Preparing your Alumni Portal…'}</p>

        <div className="pll__bar" aria-hidden="true"><i /></div>
      </div>
    </dialog>
  );
}
