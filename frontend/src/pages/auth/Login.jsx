import { useEffect, useState } from 'react';
import { Navigate, useLocation, useSearchParams } from 'react-router-dom';
import MicrosoftButton, { MicrosoftLogo } from '../../components/admin/MicrosoftButton.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { getAuthProviders, m365LoginUrl } from '../../api/client.js';
import Icon from '../../components/ui/Icon.jsx';

// Error codes sent back by the backend after a failed Microsoft 365 sign-in.
export const M365_ERRORS = {
  access_denied: 'Microsoft sign-in was cancelled.',
  pending_approval: 'Your access request has been sent. A Super Admin will review it; you can sign in once it is approved.',
  not_authorized: "Your Microsoft 365 account doesn't have access to the admin panel. Ask an administrator to add you.",
  account_disabled: 'Your account has been disabled. Please contact an administrator.',
  domain_not_allowed: 'Please sign in with your MCU Microsoft 365 account.',
  wrong_tenant: 'Please sign in with your MCU Microsoft 365 account.',
  account_mismatch: 'This email is linked to a different Microsoft account. Please contact an administrator.',
  invalid_state: 'Your sign-in session expired. Please try again.',
  not_configured: 'Microsoft 365 sign-in is not set up yet. Please contact the ICT office.',
  too_many_attempts: 'Too many sign-in attempts. Please wait a few minutes and try again.',
  sign_in_failed: 'Microsoft sign-in failed. Please try again.',
};

// Staff sign in with their MCU Microsoft 365 account only.
export default function Login() {
  const { status } = useAuth();
  const location = useLocation();
  const [params] = useSearchParams();
  const redirectTo = location.state?.from?.pathname || '/admin';
  const errorCode = params.get('error');

  const [enabled, setEnabled] = useState(null); // null while checking
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    getAuthProviders()
      .then((p) => setEnabled(Boolean(p.microsoft)))
      .catch(() => setEnabled(false));
  }, []);

  if (status === 'authenticated') return <Navigate to={redirectTo} replace />;

  const message = errorCode ? M365_ERRORS[errorCode] || M365_ERRORS.sign_in_failed : '';

  return (
    <>
      <span className="auth-card__badge"><Icon name="shield" size={14} /> Authorized staff only</span>
      <h1 className="auth-card__title">Welcome back</h1>
      <p className="auth-card__lead">Sign in with your MCU Microsoft 365 account to manage the alumni portal.</p>

      {message && (
        <div className={`alert mt-md ${errorCode === 'pending_approval' ? 'alert--warning' : 'alert--error'}`} role={errorCode === 'pending_approval' ? 'status' : 'alert'}>
          {message}
        </div>
      )}

      <div className="auth-card__sso">
        {enabled === null ? (
          <div className="auth-card__loading" aria-busy="true"><span className="spinner spinner--dark spinner--sm" /></div>
        ) : enabled ? (
          <MicrosoftButton href={m365LoginUrl(redirectTo)} busy={redirecting} onClick={() => setRedirecting(true)} />
        ) : (
          <>
            <span className="btn-microsoft is-disabled" aria-disabled="true">
              <MicrosoftLogo /> <span>Sign in with Microsoft 365</span>
            </span>
            {!message && (
              <div className="alert alert--warning mt-md" role="status">
                Microsoft 365 sign-in is not set up yet. An administrator needs to add the Entra ID app settings
                (<code>M365_*</code>) to the backend configuration.
              </div>
            )}
          </>
        )}
      </div>

      <ul className="auth-card__trust">
        <li><Icon name="check" size={14} /> Single sign-on with your @mcu.edu.ph account</li>
        <li><Icon name="check" size={14} /> No separate password to remember</li>
        <li><Icon name="check" size={14} /> Every sign-in and change is recorded in the activity log</li>
      </ul>

      <p className="auth-card__note">
        New staff? Sign in once to request access; a Super Admin approves it. Having trouble? Contact the{' '}
        <a href="mailto:ict@mcu.edu.ph">ICT office</a>.
      </p>
    </>
  );
}
