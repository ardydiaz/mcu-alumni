import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import Icon from '../../components/ui/Icon.jsx';
import Field from '../../components/forms/Field.jsx';
import { usePortalAuth } from '../../context/PortalAuthContext.jsx';
import CheckEmail from './CheckEmail.jsx';
import '../../styles/portal.css';

export default function PortalLogin() {
  const { status, login } = usePortalAuth();
  const navigate = useNavigate();
  const [values, setValues] = useState({ email: '', password: '' });
  const [state, setState] = useState({ busy: false, error: '', fields: {}, reason: null });

  if (status === 'authenticated') return <Navigate to="/portal/account" replace />;

  const onChange = (e) => setValues((v) => ({ ...v, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setState({ busy: true, error: '', fields: {}, reason: null });
    try {
      await login(values);
      navigate('/portal/account', { replace: true });
    } catch (err) {
      setState({ busy: false, error: err.message, fields: err.fields?.reason ? {} : err.fields || {}, reason: err.fields?.reason || null });
    }
  };

  return (
    <div className="portal portal-page portal-page--center">
      <div className="portal-card portal-card--narrow">
        {state.reason === 'email_unverified' ? (
          <CheckEmail email={values.email} title="Verify your email first" />
        ) : (
          <>
            <Link to="/portal" className="portal-back"><Icon name="arrowRight" size={14} /> Alumni Portal</Link>
            <div className="portal-card__head">
              <span className="portal-card__icon" aria-hidden="true"><Icon name="users" size={24} /></span>
              <h1>Alumni Login</h1>
              <p>Log in to your MCU Alumni Portal account.</p>
            </div>
            <form onSubmit={onSubmit} className="form portal-form" noValidate>
              {state.error && (
                <div className={`alert ${state.reason === 'rejected' ? 'alert--warning' : 'alert--error'}`} role="alert">{state.error}</div>
              )}
              <Field label="Email Address" type="email" name="email" autoComplete="email" required value={values.email} onChange={onChange} error={state.fields.email} />
              <Field label="Password" type="password" name="password" autoComplete="current-password" required value={values.password} onChange={onChange} error={state.fields.password} />
              <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={state.busy}>
                {state.busy ? <span className="spinner" aria-hidden="true" /> : <Icon name="users" size={18} />} Log in
              </button>
              <p className="portal-form__alt">
                Forgot your password? Email <a href="mailto:alumni@mcu.edu.ph?subject=Alumni%20Portal%20password">alumni@mcu.edu.ph</a>
              </p>
            </form>
            <div className="portal-card__foot">
              New to the Alumni Portal? <Link to="/portal/register">Register / Create Account</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
