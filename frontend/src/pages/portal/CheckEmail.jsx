import { useState } from 'react';
import PortalAuthLink from '../../components/portal/PortalAuthLink.jsx';
import Icon from '../../components/ui/Icon.jsx';
import { portalApi } from '../../api/portal.js';

// "Check your email" panel, with a button to send the verification link again.
// onLogin: in the login modal, switch to the login view instead of opening the login page.
export default function CheckEmail({ email, title = 'Check your email', onLogin }) {
  const [state, setState] = useState({ busy: false, message: '' });

  const resend = async () => {
    setState({ busy: true, message: '' });
    try {
      const res = await portalApi.resendVerification(email);
      setState({ busy: false, message: res.message });
    } catch (err) {
      setState({ busy: false, message: err.message });
    }
  };

  return (
    <div className="portal-notice">
      <span className="portal-notice__icon" aria-hidden="true"><Icon name="mail" size={28} /></span>
      <h2>{title}</h2>
      <p>
        We sent a verification link to <strong>{email}</strong>. Click the link to confirm your email address. It expires in 24 hours.
      </p>
      <p className="muted">Didn't get it? Check your spam folder, or send the link again.</p>
      <div className="portal-notice__actions">
        <button type="button" className="btn btn-outline" onClick={resend} disabled={state.busy}>
          {state.busy ? 'Sending...' : 'Resend verification link'}
        </button>
        {onLogin ? (
          <button type="button" className="btn btn-primary" onClick={onLogin}>Go to login</button>
        ) : (
          <PortalAuthLink mode="login" className="btn btn-primary">Go to login</PortalAuthLink>
        )}
      </div>
      {state.message && <p className="portal-notice__msg" role="status"><Icon name="check" size={15} /> {state.message}</p>}
    </div>
  );
}
