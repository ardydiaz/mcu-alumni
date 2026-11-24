import { useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../ui/Icon.jsx';
import Field from '../forms/Field.jsx';
import { usePortalAuth } from '../../context/PortalAuthContext.jsx';
import CheckEmail from '../../pages/portal/CheckEmail.jsx';

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
