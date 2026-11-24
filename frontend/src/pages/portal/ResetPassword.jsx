import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Icon from '../../components/ui/Icon.jsx';
import Field from '../../components/forms/Field.jsx';
import { portalApi } from '../../api/portal.js';
import PortalAuthLink from '../../components/portal/PortalAuthLink.jsx';
import '../../styles/portal.css';

// /portal/reset-password?token=...: the link from the "Reset your password" email. Works once, for 1 hour.
export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [who, setWho] = useState(null);
  const [linkError, setLinkError] = useState(token ? null : 'This reset link is incomplete.');
  const [values, setValues] = useState({ password: '', confirmPassword: '' });
  const [state, setState] = useState({ busy: false, fields: {}, done: false, error: '' });

  useEffect(() => {
    if (!token) return;
    portalApi.checkResetToken(token).then(setWho).catch((err) => setLinkError(err.message));
  }, [token]);

  const field = (name) => ({ name, value: values[name], error: state.fields[name], onChange: (e) => setValues((v) => ({ ...v, [name]: e.target.value })) });

  const onSubmit = async (e) => {
    e.preventDefault();
    setState({ busy: true, fields: {}, done: false, error: '' });
    try {
      await portalApi.resetPassword({ token, ...values });
      setState({ busy: false, fields: {}, done: true, error: '' });
    } catch (err) {
      if (err.status === 400) setLinkError(err.message);
      setState({ busy: false, fields: err.fields || {}, done: false, error: err.fields ? '' : err.message });
    }
  };

  return (
    <div className="portal portal-page portal-page--center">
      <div className="portal-card portal-card--narrow">
        {linkError ? (
          <div className="portal-notice">
            <span className="portal-notice__icon portal-notice__icon--error" aria-hidden="true"><Icon name="close" size={28} /></span>
            <h2>This link can't be used</h2>
            <p>{linkError}</p>
            <div className="portal-notice__actions">
              <PortalAuthLink mode="forgot" className="btn btn-primary">Request a new link</PortalAuthLink>
              <PortalAuthLink mode="login" className="btn btn-outline">Log in</PortalAuthLink>
            </div>
          </div>
        ) : state.done ? (
          <div className="portal-notice">
            <span className="portal-notice__icon portal-notice__icon--ok" aria-hidden="true"><Icon name="check" size={28} /></span>
            <h2>Password changed</h2>
            <p>You can now log in with your new password. For your security, any device that was logged in has been signed out.</p>
            <div className="portal-notice__actions">
              <PortalAuthLink mode="login" email={who?.email} className="btn btn-primary">Log in</PortalAuthLink>
            </div>
          </div>
        ) : !who ? (
          <div className="portal-notice"><span className="spinner spinner--dark" aria-hidden="true" /><h2>Opening your reset link…</h2></div>
        ) : (
          <>
            <div className="portal-card__head">
              <span className="portal-card__icon" aria-hidden="true"><Icon name="shield" size={24} /></span>
              <h1>Set a new password</h1>
              <p>Hi {who.firstName}! Choose a new password for <b>{who.email}</b>.</p>
            </div>
            <form onSubmit={onSubmit} className="form portal-form" noValidate>
              {state.error && <div className="alert alert--error" role="alert">{state.error}</div>}
              <Field label="New password" type="password" autoComplete="new-password" hint="At least 8 characters, with a letter and a number." required {...field('password')} />
              <Field label="Confirm new password" type="password" autoComplete="new-password" required {...field('confirmPassword')} />
              <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={state.busy}>
                {state.busy ? <span className="spinner" aria-hidden="true" /> : <Icon name="check" size={18} />} Save new password
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
