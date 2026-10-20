import { useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../ui/Icon.jsx';
import { eventIcsUrl } from '../../api/client.js';
import { categoryOf, deadlineInfo, isPast, longDate, shortDate, time, timeRange, monthShort, dayNumber, weekdayShort } from './eventUtils.js';
import { PortalRegistration, eventUrl } from './EventDetailParts.jsx';

// Event layout pieces shared by the event modal and the event page (/events/:slug):
// date tile, chips, the key-facts row and the registration card. Styles: .evm__* in events.css.
// Calendar-style date tile in the header.
export function DateTile({ event: e }) {
  const multiDay = e.endAt && dayNumber(e.endAt) !== dayNumber(e.startAt);
  return (
    <div className="evm__date" aria-hidden="true">
      <small>{monthShort(e.startAt)}</small>
      <strong>{dayNumber(e.startAt)}{multiDay ? <span>–{dayNumber(e.endAt)}</span> : null}</strong>
      <small>{weekdayShort(e.startAt)}</small>
    </div>
  );
}

export function Chips({ event: e }) {
  const cat = categoryOf(e.category);
  return (
    <div className="evm__chips">
      <span className="ev-chip ev-chip--light"><Icon name={cat.icon} size={12} /> {cat.label}</span>
      {e.status === 'cancelled' && <span className="ev-chip ev-chip--cancelled">Cancelled</span>}
      {isPast(e) && e.status !== 'cancelled' && <span className="ev-chip ev-chip--light">Past event</span>}
      {e.network && <span className="ev-chip ev-chip--light"><Icon name="users" size={12} /> {e.network.name}</span>}
    </div>
  );
}

// Key facts in one row: date, time, venue, registration deadline.
export function Facts({ event: e }) {
  const deadline = deadlineInfo(e);
  const facts = [
    { icon: 'calendar', label: 'Date', value: longDate(e.startAt), sub: e.endAt && longDate(e.endAt) !== longDate(e.startAt) ? `to ${longDate(e.endAt)}` : null },
    { icon: 'clock', label: 'Time', value: timeRange(e), sub: 'Philippine time' },
    e.venue || e.onlineUrl
      ? { icon: 'pin', label: e.venue ? 'Venue' : 'Online', value: e.venue || 'Online event', sub: e.venue && e.onlineUrl ? <a href={e.onlineUrl} target="_blank" rel="noreferrer">Also online</a> : !e.venue ? <a href={e.onlineUrl} target="_blank" rel="noreferrer">Join link</a> : null }
      : null,
    e.registrationDeadline
      ? { icon: 'flag', label: 'Register by', value: `${shortDate(e.registrationDeadline)}, ${time(e.registrationDeadline)}`, sub: deadline && <span className={`evm__tag ${deadline.closed ? 'is-closed' : deadline.soon ? 'is-soon' : 'is-ok'}`}>{deadline.closed ? 'Closed' : deadline.countdown}</span> }
      : null,
  ].filter(Boolean);
  return (
    <dl className="evm__facts" style={{ '--n': facts.length }}>
      {facts.map((f) => (
        <div key={f.label}>
          <span className="evm__facts-icon"><Icon name={f.icon} size={18} /></span>
          <div>
            <dt>{f.label}</dt>
            <dd>{f.value}</dd>
            {f.sub && <dd className="evm__facts-sub">{f.sub}</dd>}
          </div>
        </div>
      ))}
    </dl>
  );
}

function CopyIcon({ slug }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(eventUrl(slug));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };
  return (
    <button type="button" className="evm__tool" onClick={copy}>
      <Icon name={copied ? 'check' : 'copy'} size={18} />
      <span>{copied ? 'Copied' : 'Share link'}</span>
    </button>
  );
}

// Registration and actions: slots bar, the main button, then calendar / share / full page.
export function ActionCard({ event: e, onChange, fullPageLink = true }) {
  const cancelled = e.status === 'cancelled';
  const past = isPast(e);
  const deadline = deadlineInfo(e);
  const open = !cancelled && !past;
  const taken = e.registeredCount || 0;
  const pct = e.capacity ? Math.min(100, Math.round((taken / e.capacity) * 100)) : null;
  const external = e.registrationUrl && !e.portalRegistration && open && !(deadline && deadline.closed);

  return (
    <div className="evm__card">
      {e.portalRegistration && open ? (
        <>
          <div className="evm__card-head">
            <span>Registration</span>
            <strong>{e.capacity ? `${e.spotsLeft.toLocaleString()} slots left` : `${taken.toLocaleString()} registered`}</strong>
          </div>
          {pct !== null && (
            <div className="evm__meter" role="img" aria-label={`${taken} of ${e.capacity} slots taken`}>
              <span style={{ width: `${Math.max(pct, taken ? 3 : 0)}%` }} />
            </div>
          )}
          {e.capacity && <p className="evm__meter-text">{taken.toLocaleString()} of {e.capacity.toLocaleString()} registered</p>}
          <PortalRegistration event={e} onChange={onChange} bare />
        </>
      ) : (
        <div className="evm__card-head">
          <span>{cancelled ? 'Cancelled' : past ? 'This event has ended' : 'Join this event'}</span>
          <strong>{cancelled ? 'This event will not push through' : past ? 'Thank you to everyone who came' : e.capacity ? `${e.capacity.toLocaleString()} slots` : 'Open to all alumni'}</strong>
        </div>
      )}
      {external && (
        <a href={e.registrationUrl} target="_blank" rel="noreferrer" className="btn btn-gold btn-lg btn-block">
          Register now <Icon name="external" size={16} />
        </a>
      )}

      <div className="evm__tools">
        {open && (
          <a href={eventIcsUrl(e.slug)} className="evm__tool" download>
            <Icon name="calendar" size={18} />
            <span>Add to calendar</span>
          </a>
        )}
        <CopyIcon slug={e.slug} />
        {fullPageLink && (
        <Link to={`/events/${e.slug}`} className="evm__tool">
          <Icon name="external" size={18} />
          <span>Full page</span>
        </Link>
        )}
      </div>
    </div>
  );
}
