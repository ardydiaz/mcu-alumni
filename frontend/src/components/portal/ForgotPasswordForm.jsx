import { useState } from 'react';
import Icon from '../ui/Icon.jsx';
import Field from '../forms/Field.jsx';
import { portalApi } from '../../api/portal.js';
import { useCaptcha } from '../../hooks/useCaptcha.jsx';

/**
 * "Forgot your password?" in the Alumni Portal modal: enter the account email; if it's registered, a reset link
 * (valid 1 hour) is emailed. Unregistered emails are told so (the office chose this; the endpoint is rate-limited).
 */
export default function ForgotPasswordForm({ initialEmail = '', onLogin, onRegister }) {
  const [email, setEmail] = useState(initialEmail);
  const [state, setState] = useState({ busy: false, error: '', notFound: false, sent: null, fieldError: undefined });
  const captcha = useCaptcha();

  const onSubmit = async (e) => {
    e.preventDefault();
    setState({ busy: true, error: '', notFound: false, sent: null });
    let extra;
    try {
      extra = await captcha.payload();
    } catch {
      return setState({ busy: false, error: '', notFound: false, sent: null }); // message shown under the check
    }
    try {
      const res = await portalApi.forgotPassword(email.trim(), extra);
      setState({ busy: false, error: '', notFound: false, sent: { ...res.data, message: res.message } });
      captcha.reset();
    } catch (err) {
      const notFound = err.status === 404;
      const captchaError = err.fields?.reason === 'captcha';
      setState({ busy: false, error: notFound || captchaError ? '' : err.fields ? '' : err.message, notFound, sent: null, fieldError: notFound ? undefined : err.fields?.email });
      captcha.fail(err);
    }
  };

  if (state.sent) {
    return (
      <div className="portal-notice">
        <span className="portal-notice__icon portal-notice__icon--ok" aria-hidden="true"><Icon name="mail" size={28} /></span>
        <h2>{state.sent.status === 'invited' ? 'Check your email to activate' : 'Check your email'}</h2>
        <p>{state.sent.message}</p>
        <p className="muted">The email comes from the MCU Alumni Relations Office. Didn&apos;t get it after a few minutes? Check Spam, or send it again.</p>
        <div className="portal-notice__actions">
          <button type="button" className="btn btn-outline" onClick={() => setState({ busy: false, error: '', notFound: false, sent: null })}>Send again</button>
          <button type="button" className="btn btn-primary" onClick={onLogin}>Back to log in</button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="form portal-form" noValidate>
      <p className="portal-form__intro">Enter the email address of your Alumni Portal account and we&apos;ll send you a link to set a new password.</p>
      {state.error && <div className="alert alert--error" role="alert">{state.error}</div>}
      <Field
        label="Email Address"
        type="email"
        name="email"
        autoComplete="email"
        placeholder="juan.delacruz@email.com"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={state.fieldError}
      />
      {state.notFound && (
        <div className="portal-notfound" role="alert">
          <strong>This email is not registered in the Alumni Portal.</strong>
          <span>Check the spelling, or try another email you may have used. New to the portal?</span>
          <button type="button" className="btn btn-outline btn-sm" onClick={onRegister}>Create an account</button>
        </div>
      )}
      {captcha.element}
      <button type="submit" className="btn btn-primary btn-lg btn-block portal-form__submit" disabled={state.busy || !email.trim()}>
        {state.busy && <span className="spinner" aria-hidden="true" />} Send reset link
      </button>
      <p className="portal-form__alt">
        Remembered it? <button type="button" className="link-btn" onClick={onLogin}>Back to log in</button>
      </p>
      <p className="portal-form__alt portal-form__alt--small">
        No longer have access to that email? Contact <a href="mailto:alumni@mcu.edu.ph?subject=Alumni%20Portal%20account%20email">alumni@mcu.edu.ph</a> and we&apos;ll update it for you.
      </p>
    </form>
  );
}
