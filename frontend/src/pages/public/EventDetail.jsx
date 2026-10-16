import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Icon from '../../components/ui/Icon.jsx';
import { getEvent, eventIcsUrl, assetUrl } from '../../api/client.js';
import { portalApi } from '../../api/portal.js';
import { usePortalAuth } from '../../context/PortalAuthContext.jsx';
import { categoryOf, longDate, timeRange, deadlineInfo, isPast, shortDate, time } from '../../components/events/eventUtils.js';
import '../../styles/events.css';

// `version` reloads quietly (keeps the page) after registering, so the slot count updates.
function useEvent(slug, version = 0) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const [loaded, setLoaded] = useState(null);
  useEffect(() => {
    let active = true;
    if (loaded !== slug) setState({ data: null, loading: true, error: null });
    getEvent(slug)
      .then((data) => {
        if (!active) return;
        setState({ data, loading: false, error: null });
        setLoaded(slug);
      })
      .catch((error) => active && setState({ data: null, loading: false, error }));
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, version]);
  return state;
}

function CopyLink() {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };
  return (
    <button type="button" className="btn btn-outline btn-block" onClick={copy}>
      <Icon name={copied ? 'check' : 'copy'} size={16} /> {copied ? 'Link copied' : 'Copy link to share'}
    </button>
  );
}

// Registration through the Alumni Portal: register / cancel, spots left, or why it's closed.
function PortalRegistration({ event, onChange }) {
  const { status, account } = usePortalAuth();
  const [registered, setRegistered] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (status !== 'authenticated') return setRegistered(false);
    portalApi.myEvents().then((rows) => setRegistered(rows.some((r) => r.eventId === event.id))).catch(() => setRegistered(false));
  }, [status, event.id]);

  const act = async (fn) => {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fn(event.id);
      setRegistered(fn === portalApi.registerEvent);
      setMessage({ ok: true, text: res.message });
      onChange();
    } catch (err) {
      setMessage({ ok: false, text: err.message });
    } finally {
      setBusy(false);
    }
  };

  const spots = event.capacity ? `${event.spotsLeft.toLocaleString()} of ${event.capacity.toLocaleString()} slots left` : `${event.registeredCount.toLocaleString()} registered`;
  const next = encodeURIComponent(`/events/${event.slug}`);

  return (
    <div className="ev-register">
      <div className="ev-register__head">
        <Icon name="users" size={16} />
        <span>{spots}</span>
        {registered && <span className="ev-chip ev-chip--ok"><Icon name="check" size={12} /> You're registered</span>}
      </div>
      {status !== 'authenticated' ? (
        event.registrationClosed ? (
          <p className="ev-register__closed">{event.registrationClosed}</p>
        ) : (
          <>
            <Link to={`/portal/login?next=${next}`} className="btn btn-gold btn-lg btn-block">Log in to register</Link>
            <p className="ev-register__hint">Registration is for MCU alumni with an Alumni Portal account. <Link to="/portal/register">Create one</Link></p>
          </>
        )
      ) : account?.status !== 'verified' ? (
        <p className="ev-register__closed">You can register once the Alumni Relations Office verifies your account.</p>
      ) : registered ? (
        <button type="button" className="btn btn-outline btn-block" disabled={busy} onClick={() => act(portalApi.cancelEvent)}>
          {busy ? 'Cancelling…' : 'Cancel my registration'}
        </button>
      ) : event.registrationClosed ? (
        <p className="ev-register__closed">{event.registrationClosed}</p>
      ) : (
        <button type="button" className="btn btn-gold btn-lg btn-block" disabled={busy || registered === null} onClick={() => act(portalApi.registerEvent)}>
          {busy ? 'Registering…' : 'Register for this event'}
        </button>
      )}
      {message && <p className={`ev-register__msg ${message.ok ? 'is-ok' : 'is-error'}`} role="status">{message.text}</p>}
    </div>
  );
}

export default function EventDetail() {
  const { slug } = useParams();
  const [version, setVersion] = useState(0);
  const { data: e, loading, error } = useEvent(slug, version);

  if (loading) {
    return (
      <div className="ev-detail-loading container">
        <div className="skeleton" style={{ height: 320 }} />
      </div>
    );
  }
  if (error || !e) {
    return (
      <section className="ev-section">
        <div className="container ev-empty">
          <span className="ev-empty__icon" aria-hidden="true"><Icon name="calendar" size={26} /></span>
          <strong>{error?.status === 404 ? 'This event could not be found' : "We couldn't load this event"}</strong>
          <p>It may have been removed or the link is incomplete.</p>
          <div className="ev-empty__actions"><Link to="/events" className="btn btn-primary">See all events</Link></div>
        </div>
      </section>
    );
  }

  const cat = categoryOf(e.category);
  const deadline = deadlineInfo(e);
  const cancelled = e.status === 'cancelled';
  const past = isPast(e);
  const canRegister = e.registrationUrl && !cancelled && !past && !(deadline && deadline.closed);

  return (
    <div className="ev-detail" style={{ '--cat': cat.color }}>
      <header className="ev-hero" style={e.image ? { '--ev-image': `url("${assetUrl(e.image)}")` } : undefined}>
        <div className="container ev-hero__inner">
          <Link to="/events" className="ev-hero__back"><Icon name="arrowRight" size={14} /> All events</Link>
          <div className="ev-hero__chips">
            <span className="ev-chip ev-chip--light"><Icon name={cat.icon} size={12} /> {cat.label}</span>
            {cancelled && <span className="ev-chip ev-chip--cancelled">Cancelled</span>}
            {past && !cancelled && <span className="ev-chip ev-chip--light">Past event</span>}
            {e.network && <span className="ev-chip ev-chip--light"><Icon name="users" size={12} /> {e.network.name}</span>}
          </div>
          <h1 className={cancelled ? 'is-cancelled' : ''}>{e.title}</h1>
          {e.summary && <p>{e.summary}</p>}
          <div className="ev-hero__when">
            <span><Icon name="calendar" size={16} /> {longDate(e.startAt)}</span>
            <span><Icon name="clock" size={16} /> {timeRange(e)}</span>
            {e.venue && <span><Icon name="pin" size={16} /> {e.venue}</span>}
          </div>
        </div>
      </header>

      <section className="ev-section ev-section--detail">
        <div className="container ev-detail__grid">
          <article className="ev-detail__body">
            {cancelled && (
              <div className="ev-notice ev-notice--cancelled">
                <Icon name="close" size={18} />
                <p><strong>This event has been cancelled.</strong> Please contact the Alumni Relations Office for details.</p>
              </div>
            )}
            <h2>About this event</h2>
            {e.description ? (
              e.description.split(/\n{2,}/).map((para, i) => <p key={i}>{para}</p>)
            ) : (
              <p className="muted">More details will be posted soon.</p>
            )}
          </article>

          <aside className="ev-detail__side">
            <div className="ev-info">
              <h3>Event details</h3>
              <dl>
                <div><dt><Icon name="calendar" size={16} /> Date</dt><dd>{longDate(e.startAt)}{e.endAt && longDate(e.endAt) !== longDate(e.startAt) ? ` to ${longDate(e.endAt)}` : ''}</dd></div>
                <div><dt><Icon name="clock" size={16} /> Time</dt><dd>{timeRange(e)} <small>(Philippine time)</small></dd></div>
                {e.venue && <div><dt><Icon name="pin" size={16} /> Venue</dt><dd>{e.venue}</dd></div>}
                {e.onlineUrl && <div><dt><Icon name="external" size={16} /> Online</dt><dd><a href={e.onlineUrl} target="_blank" rel="noreferrer">Join online</a></dd></div>}
                {e.capacity && <div><dt><Icon name="users" size={16} /> Slots</dt><dd>{e.capacity.toLocaleString()} participants</dd></div>}
                {e.registrationDeadline && (
                  <div>
                    <dt><Icon name="clock" size={16} /> Registration</dt>
                    <dd>
                      Until {shortDate(e.registrationDeadline)}, {time(e.registrationDeadline)}
                      {deadline && <span className={`ev-chip ${deadline.closed ? 'ev-chip--cancelled' : deadline.soon ? 'ev-chip--soon' : 'ev-chip--ok'}`}>{deadline.closed ? 'Closed' : deadline.countdown}</span>}
                    </dd>
                  </div>
                )}
              </dl>
              {e.portalRegistration && !cancelled && !past && <PortalRegistration event={e} onChange={() => setVersion((v) => v + 1)} />}
              <div className="ev-info__actions">
                {canRegister && !e.portalRegistration && (
                  <a href={e.registrationUrl} target="_blank" rel="noreferrer" className="btn btn-gold btn-lg btn-block">
                    Register now <Icon name="external" size={16} />
                  </a>
                )}
                {!cancelled && !past && (
                  <a href={eventIcsUrl(e.slug)} className="btn btn-primary btn-block" download>
                    <Icon name="calendar" size={16} /> Add to my calendar
                  </a>
                )}
                <CopyLink />
              </div>
            </div>
            <div className="ev-help">
              <Icon name="mail" size={18} />
              <p>Questions about this event? Email <a href="mailto:alumni@mcu.edu.ph">alumni@mcu.edu.ph</a> or call (+63) 917 104 6520.</p>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
