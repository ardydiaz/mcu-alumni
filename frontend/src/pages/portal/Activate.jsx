import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Icon from '../../components/ui/Icon.jsx';
import Field from '../../components/forms/Field.jsx';
import { usePortalAuth } from '../../context/PortalAuthContext.jsx';
import { portalApi } from '../../api/portal.js';
import '../../styles/portal.css';

// Landing page for the portal invitation email: /portal/activate?token=...
// The graduate's record is already in the alumni database (imported by the Alumni Office), so they only
// confirm it's them and set a password. The account is active immediately; no review needed.
export default function Activate() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const navigate = useNavigate();
  const { activate } = usePortalAuth();
  const [invite, setInvite] = useState(null);
  const [loadError, setLoadError] = useState(token ? null : 'This activation link is incomplete.');
  const [values, setValues] = useState({ phone: '', password: '', confirmPassword: '', consent: false });
  const [state, setState] = useState({ busy: false, error: '', fields: {} });

  useEffect(() => {
    if (!token) return;
    portalApi.invitePreview(token).then(setInvite).catch((err) => setLoadError(err.message));
  }, [token]);

  const field = (name) => ({
    name,
    value: values[name],
    error: state.fields[name],
    onChange: (e) => setValues((v) => ({ ...v, [name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })),
  });

  const onSubmit = async (e) => {
    e.preventDefault();
    setState({ busy: true, error: '', fields: {} });
    try {
      await activate({ token, ...values, phone: invite.phone ? undefined : values.phone });
      navigate('/portal/account', { replace: true, state: { welcome: true } });
    } catch (err) {
      setState({ busy: false, error: err.fields?.reason === 'exists' || !err.fields ? err.message : '', fields: err.fields || {} });
    }
  };

  return (
    <div className="portal portal-page portal-page--center">
      <div className="portal-card portal-card--narrow">
        {loadError && (
          <div className="portal-notice">
            <span className="portal-notice__icon portal-notice__icon--error" aria-hidden="true"><Icon name="close" size={28} /></span>
            <h2>This link can't be used</h2>
            <p>{loadError}</p>
            <div className="portal-notice__actions">
              <Link to="/portal/login" className="btn btn-primary">Log in</Link>
              <Link to="/portal/register" className="btn btn-outline">Register instead</Link>
            </div>
          </div>
        )}

        {!loadError && !invite && (
          <div className="portal-notice">
            <span className="spinner spinner--dark" aria-hidden="true" />
            <h2>Opening your invitation…</h2>
          </div>
        )}

        {invite && (
          <>
            <div className="portal-card__head">
              <span className="portal-card__icon" aria-hidden="true"><Icon name="award" size={24} /></span>
              <h1>Welcome, {invite.firstName.split(/\s+/)[0]}!</h1>
              <p>Your record is already in the MCU alumni database. Set a password to activate your Alumni Portal account.</p>
            </div>

            <dl className="portal-activate__record">
              <div><dt>Name</dt><dd>{invite.firstName} {invite.surname}</dd></div>
              <div><dt>Student No.</dt><dd>{invite.studentNumber}</dd></div>
              <div><dt>Program</dt><dd>{invite.program}, {invite.yearGraduated}</dd></div>
              {invite.alumniNumber && <div><dt>Alumni No.</dt><dd>{invite.alumniNumber}</dd></div>}
              <div><dt>You'll log in with</dt><dd>{invite.email}</dd></div>
            </dl>

            <form onSubmit={onSubmit} className="form portal-form" noValidate>
              {state.error && <div className="alert alert--error" role="alert">{state.error}</div>}
              {!invite.phone && (
                <Field label="Mobile number" type="tel" autoComplete="tel" placeholder="09XX XXX XXXX" hint="We don't have your number yet." required {...field('phone')} />
              )}
              <Field label="Password" type="password" autoComplete="new-password" hint="At least 8 characters, with a letter and a number." required {...field('password')} />
              <Field label="Confirm password" type="password" autoComplete="new-password" required {...field('confirmPassword')} />
              <Field
                as="checkbox"
                label="I agree to let Manila Central University process my personal data for my Alumni Portal account, in accordance with the Data Privacy Act of 2012."
                required
                {...field('consent')}
              />
              <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={state.busy}>
                {state.busy ? <span className="spinner" aria-hidden="true" /> : <Icon name="check" size={18} />} Activate my account
              </button>
              <p className="portal-form__alt">
                Not you, or some details are wrong? Email <a href="mailto:alumni@mcu.edu.ph?subject=Alumni%20Portal%20invitation">alumni@mcu.edu.ph</a>
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
