import { useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import Icon from '../../components/ui/Icon.jsx';
import Field from '../../components/forms/Field.jsx';
import { usePortalAuth } from '../../context/PortalAuthContext.jsx';
import { portalApi } from '../../api/portal.js';
import '../../styles/portal.css';

// /portal/forgot-password: enter the account email; if it's registered, a reset link (valid 1 hour) is emailed.
export default function ForgotPassword() {
  const { status } = usePortalAuth();
  const [params] = useSearchParams();
  const [email, setEmail] = useState(params.get('email') || '');
  const [state, setState] = useState({ busy: false, error: '', notFound: false, sent: null });

  if (status === 'authenticated') return <Navigate to="/portal/account" replace />;

  const onSubmit = async (e) => {
    e.preventDefault();
    setState({ busy: true, error: '', notFound: false, sent: null });
    try {
      const res = await portalApi.forgotPassword(email.trim());
      setState({ busy: false, error: '', notFound: false, sent: { ...res.data, message: res.message } });
    } catch (err) {
      setState({ busy: false, error: err.status === 404 ? '' : err.message, notFound: err.status === 404, sent: null, fieldError: err.status === 404 ? err.fields?.email : err.fields?.email });
    }
  };

  return (
    <div className="portal portal-page portal-page--center">
      <div className="portal-card portal-card--narrow">
        {state.sent ? (
          <div className="portal-notice">
            <span className="portal-notice__icon portal-notice__icon--ok" aria-hidden="true"><Icon name="mail" size={28} /></span>
            <h2>{state.sent.status === 'invited' ? 'Check your email to activate' : 'Check your email'}</h2>
            <p>{state.sent.message}</p>
            <p className="muted">The email comes from the MCU Alumni Relations Office. Didn't get it after a few minutes? Check Spam, or send it again.</p>
            <div className="portal-notice__actions">
              <button type="button" className="btn btn-outline" onClick={() => setState({ busy: false, error: '', notFound: false, sent: null })}>Send again</button>
              <Link to="/portal/login" className="btn btn-primary">Back to log in</Link>
            </div>
          </div>
        ) : (
          <>
            <Link to="/portal/login" className="portal-back"><Icon name="arrowRight" size={14} /> Back to log in</Link>
            <div className="portal-card__head">
              <span className="portal-card__icon" aria-hidden="true"><Icon name="shield" size={24} /></span>
              <h1>Forgot your password?</h1>
              <p>Enter the email address of your Alumni Portal account and we'll send you a link to set a new password.</p>
            </div>
            <form onSubmit={onSubmit} className="form portal-form" noValidate>
              {state.error && <div className="alert alert--error" role="alert">{state.error}</div>}
              <Field label="Email Address" type="email" name="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} error={state.fieldError} />
              {state.notFound && (
                <div className="portal-notfound" role="alert">
                  <strong>This email is not registered in the Alumni Portal.</strong>
                  <span>Check the spelling, or try another email you may have used. New to the portal?</span>
                  <Link to="/portal/register" className="btn btn-outline btn-sm">Create an account</Link>
                </div>
              )}
              <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={state.busy || !email.trim()}>
                {state.busy ? <span className="spinner" aria-hidden="true" /> : <Icon name="mail" size={18} />} Send reset link
              </button>
              <p className="portal-form__alt">
                No longer have access to that email? Contact <a href="mailto:alumni@mcu.edu.ph?subject=Alumni%20Portal%20account%20email">alumni@mcu.edu.ph</a> and we'll update it for you.
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
