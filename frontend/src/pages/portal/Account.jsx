import { useState } from 'react';
import { Link, useLocation, useOutletContext } from 'react-router-dom';
import Field from '../../components/forms/Field.jsx';
import { portalApi, portalSession } from '../../api/portal.js';
import Icon from '../../components/ui/Icon.jsx';
import { StatusBadge, Journey, firstName } from './portalShared.jsx';
import { displayName } from './PortalLayout.jsx';
import EventCard from '../../components/events/EventCard.jsx';
import EventModal, { useEventModal } from '../../components/events/EventModal.jsx';
import { useUpcomingEvents } from '../../components/events/useUpcomingEvents.js';
import '../../styles/events.css';

// Portal dashboard (inside PortalLayout, which provides the sidebar and the signed-in account).
const ACTIONS = [
  { icon: 'id', title: 'Alumni ID', text: 'Request your ID card and enjoy partner discounts', to: '/portal/alumni-id', tone: 'gold' },
  { icon: 'users', title: 'My profile', text: 'Your details, address, education, work and more', to: '/portal/profile', tone: 'purple' },
  { icon: 'file', title: 'Graduate Tracer', text: 'Tell us where your MCU journey has taken you', to: '/portal/graduate-tracer', tone: 'purple' },
  { icon: 'tag', title: 'Alumni perks', text: 'Discounts from MCU merchant partners', to: '/portal/perks', tone: 'purple' },
];

const memberSince = (date) => new Date(date).toLocaleDateString('en-PH', { month: 'long', year: 'numeric' });

export default function Account() {
  const { account } = useOutletContext();
  const welcome = useLocation().state?.welcome; // just activated from an invitation
  const events = useUpcomingEvents(3);
  const modal = useEventModal(); // event details open in a modal (?event=slug)
  const verified = account.status === 'verified';
  const details = [
    { icon: 'users', label: 'Full name', value: account.fullName },
    { icon: 'id', label: 'Student ID number', value: account.studentNumber },
    { icon: 'book', label: 'Course / program', value: account.program },
    { icon: 'award', label: 'Year graduated', value: account.yearGraduated },
    { icon: 'mail', label: 'Email address', value: account.email },
    { icon: 'phone', label: 'Contact number', value: account.phone },
  ];

  return (
    <>
      <section className="portal-hello">
        <div>
          <span className="portal-hello__eyebrow">My Alumni Account</span>
          <h1>{welcome ? 'Welcome to the Alumni Portal' : 'Welcome back'}, {firstName(account.fullName)}!</h1>
          <p>{welcome ? 'Your account is active and your profile is already filled in from your records. Check it and complete what is missing.' : `${account.program} · Batch ${account.yearGraduated}`}</p>
        </div>
        <div className="portal-hello__card" aria-hidden="true">
          <span className="portal-hello__card-brand">MCU · ALUMNI</span>
          <strong>{displayName(account.fullName)}</strong>
          <span>ID No. {account.studentNumber}</span>
          <span className="portal-hello__card-status">
            <Icon name={verified ? 'check' : 'clock'} size={13} /> {verified ? 'Verified alumni' : 'Pending review'}
          </span>
        </div>
      </section>

      {!verified && (
        <div className="portal-review">
          <span className="portal-review__icon" aria-hidden="true"><Icon name="clock" size={22} /></span>
          <div>
            <strong>Your registration is being reviewed</strong>
            <p>The Alumni Relations Office is confirming your record as an MCU graduate. We will email you once your account is verified.</p>
          </div>
        </div>
      )}

      <section>
        <h2 className="portal-section-title">Quick actions</h2>
        <div className="portal-actions">
          {ACTIONS.map((a) => (
            <Link key={a.title} to={a.to} className={`portal-action portal-action--${a.tone}`}>
              <span className="portal-action__icon" aria-hidden="true"><Icon name={a.icon} size={22} /></span>
              <strong>{a.title}</strong>
              <span>{a.text}</span>
              <span className="portal-action__go" aria-hidden="true"><Icon name="arrowRight" size={16} /></span>
            </Link>
          ))}
        </div>
      </section>

      <div className="portal-dash__grid">
        <section className="portal-card">
          <div className="portal-card__row">
            <h2 className="portal-card__title">My profile</h2>
            <Link to="/portal/profile" className="portal-card__link">Open my profile <Icon name="arrowRight" size={14} /></Link>
          </div>
          <dl className="portal-profile">
            {details.map((d) => (
              <div key={d.label}>
                <span className="portal-profile__icon" aria-hidden="true"><Icon name={d.icon} size={16} /></span>
                <div>
                  <dt>{d.label}</dt>
                  <dd>{d.value}</dd>
                </div>
              </div>
            ))}
          </dl>
          <p className="muted portal-details__note">
            To correct your registered details, email <a href="mailto:alumni@mcu.edu.ph">alumni@mcu.edu.ph</a>.
          </p>
        </section>

        <section className="portal-card">
          <h2 className="portal-card__title">Account status</h2>
          <Journey current={verified ? 4 : 2} />
          <div className="portal-meta">
            <div><small>Member since</small><strong>{memberSince(account.createdAt)}</strong></div>
            <div><small>Status</small><StatusBadge status={account.status} /></div>
          </div>
        </section>
      </div>

      {events.data?.length ? (
        <section className="portal-card">
          <div className="portal-card__row">
            <h2 className="portal-card__title">Upcoming alumni events</h2>
            <Link to="/events" className="portal-card__link">View calendar <Icon name="arrowRight" size={14} /></Link>
          </div>
          <div className="portal-events">
            {events.data.map((e) => <EventCard key={e.id} event={e} compact onOpen={modal.open} />)}
          </div>
          <EventModal slug={modal.slug} preview={modal.preview} onClose={modal.close} />
        </section>
      ) : (
        <section className="portal-soon">
          <span className="portal-soon__icon" aria-hidden="true"><Icon name="calendar" size={22} /></span>
          <div>
            <strong>Alumni events and activities</strong>
            <p>{events.loading ? 'Checking for upcoming events…' : 'No upcoming events yet. Meanwhile, join a chapter or volunteer.'}</p>
          </div>
          <div className="portal-soon__links">
            <Link to="/events" className="btn btn-outline btn-sm">Events calendar</Link>
            <Link to="/networks" className="btn btn-primary btn-sm">Find your chapter</Link>
          </div>
        </section>
      )}

      <ChangePassword />
    </>
  );
}

// Account security: change the password (current one required). Other devices are signed out.
function ChangePassword() {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState({ currentPassword: '', password: '', confirmPassword: '' });
  const [state, setState] = useState({ busy: false, fields: {}, message: null });
  const field = (name) => ({ name, value: values[name], error: state.fields[name], onChange: (e) => setValues((v) => ({ ...v, [name]: e.target.value })) });

  const onSubmit = async (e) => {
    e.preventDefault();
    setState({ busy: true, fields: {}, message: null });
    try {
      const res = await portalApi.changePassword(values);
      portalSession.set(res.data.token); // this device stays signed in
      setValues({ currentPassword: '', password: '', confirmPassword: '' });
      setState({ busy: false, fields: {}, message: { ok: true, text: res.message } });
      setOpen(false);
    } catch (err) {
      setState({ busy: false, fields: err.fields || {}, message: err.fields ? null : { ok: false, text: err.message } });
    }
  };

  return (
    <section className="portal-card portal-security">
      <div className="portal-security__head">
        <div>
          <h2 className="portal-card__title" style={{ margin: 0 }}>Password and security</h2>
          <p>Change your password anytime. Forgot it? Use “Forgot your password?” on the log-in page.</p>
        </div>
        {!open && <button type="button" className="btn btn-outline btn-sm" onClick={() => { setOpen(true); setState({ busy: false, fields: {}, message: null }); }}><Icon name="shield" size={14} /> Change password</button>}
      </div>
      {state.message && !open && <p className={`portal-security__msg ${state.message.ok ? 'is-ok' : 'is-error'}`} role="status">{state.message.text}</p>}
      {open && (
        <form onSubmit={onSubmit} className="form" noValidate>
          <Field label="Current password" type="password" autoComplete="current-password" required {...field('currentPassword')} />
          <Field label="New password" type="password" autoComplete="new-password" hint="At least 8 characters, with a letter and a number." required {...field('password')} />
          <Field label="Confirm new password" type="password" autoComplete="new-password" required {...field('confirmPassword')} />
          <div className="portal-security__actions">
            <button type="submit" className="btn btn-primary btn-sm" disabled={state.busy}>{state.busy ? 'Saving…' : 'Save new password'}</button>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setOpen(false)} disabled={state.busy}>Cancel</button>
            {state.message && <p className={`portal-security__msg ${state.message.ok ? 'is-ok' : 'is-error'}`} role="status">{state.message.text}</p>}
          </div>
        </form>
      )}
    </section>
  );
}
