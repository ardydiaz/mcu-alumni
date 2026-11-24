import { useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../ui/Icon.jsx';
import Field from '../forms/Field.jsx';
import { usePortalAuth } from '../../context/PortalAuthContext.jsx';
import CheckEmail from '../../pages/portal/CheckEmail.jsx';
import { Journey } from '../../pages/portal/portalShared.jsx';

// Correct password, but the Alumni Relations Office hasn't verified the account yet: the portal stays closed
// until then (the approval email tells them they can log in).
function UnderReview({ onBack }) {
  return (
    <div className="portal-notice portal-notice--review">
      <span className="portal-notice__icon portal-notice__icon--wait" aria-hidden="true"><Icon name="clock" size={28} /></span>
      <h2>Your account is under review</h2>
      <p>
        Thank you for registering! The Alumni Relations Office is confirming your record as an MCU graduate.
        We will email you once your account is verified, and then you can log in to the Alumni Portal.
      </p>
      <Journey current={2} />
      <p className="muted">Questions? Email <a href="mailto:alumni@mcu.edu.ph">alumni@mcu.edu.ph</a>.</p>
      <div className="portal-notice__actions">
        <button type="button" className="btn btn-outline" onClick={onBack}>Back to log in</button>
      </div>
    </div>
  );
}

/**
 * Alumni Portal login form (in the login modal).
 * onSuccess(): after a successful login. onRegister / onForgot / onLogin: switch views inside the modal.
 */
export default function LoginForm({ initialEmail = '', onSuccess, onRegister, onForgot, onLogin, submitLabel = 'Log in', placeholders = false }) {
  const { login } = usePortalAuth();
  const [values, setValues] = useState({ email: initialEmail, password: '' });
  const [state, setState] = useState({ busy: false, error: '', fields: {}, reason: null });

  const onChange = (e) => setValues((v) => ({ ...v, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setState({ busy: true, error: '', fields: {}, reason: null });
    try {
      const account = await login(values);
      onSuccess?.(account);
    } catch (err) {
      setState({ busy: false, error: err.message, fields: err.fields?.reason ? {} : err.fields || {}, reason: err.fields?.reason || null });
    }
  };

  if (state.reason === 'email_unverified') return <CheckEmail email={values.email} title="Verify your email first" onLogin={onLogin} />;
  if (state.reason === 'pending') return <UnderReview onBack={() => setState({ busy: false, error: '', fields: {}, reason: null })} />;

  const forgot = `/portal/forgot-password${values.email ? `?email=${encodeURIComponent(values.email)}` : ''}`;
  return (
    <form onSubmit={onSubmit} className="form portal-form" noValidate>
      {state.error && <div className={`alert ${state.reason === 'rejected' ? 'alert--warning' : 'alert--error'}`} role="alert">{state.error}</div>}
      <Field
        label="Email Address"
        type="email"
        name="email"
        autoComplete="email"
        placeholder={placeholders ? 'juan.delacruz@email.com' : undefined}
        required
        value={values.email}
        onChange={onChange}
        error={state.fields.email}
      />
      <Field
        label="Password"
        type="password"
        name="password"
        autoComplete="current-password"
        placeholder={placeholders ? '••••••••' : undefined}
        required
        value={values.password}
        onChange={onChange}
        error={state.fields.password}
      />
      <p className="portal-form__forgot">
        {onForgot ? <button type="button" className="link-btn" onClick={() => onForgot(values.email.trim())}>Forgot your password?</button> : <Link to={forgot}>Forgot your password?</Link>}
      </p>
      <button type="submit" className="btn btn-primary btn-lg btn-block portal-form__submit" disabled={state.busy}>
        {state.busy && <span className="spinner" aria-hidden="true" />} {submitLabel}
      </button>
      <p className="portal-form__alt">
        Don&apos;t have an account yet?{' '}
        {onRegister ? <button type="button" className="link-btn" onClick={onRegister}>Register now</button> : <Link to="/portal/register">Register now</Link>}
      </p>
    </form>
  );
}
