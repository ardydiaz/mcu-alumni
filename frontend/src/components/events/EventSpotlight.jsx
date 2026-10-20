import { Link } from 'react-router-dom';
import Icon from '../ui/Icon.jsx';
import { assetUrl } from '../../api/client.js';
import { modalClick } from './EventCard.jsx';
import { categoryOf, dayKey, todayKey, deadlineInfo, timeRange, monthShort, dayNumber, weekdayShort } from './eventUtils.js';

// Homepage "Upcoming alumni events": the next (or ongoing) event as a featured card, the others as a compact
// list beside it. Status chips say what matters at a glance: today, in N days, slots, deadline, registered.

const DAY = 86400000;

// When: { label, tone } — "Happening now", "Today", "Tomorrow", "In 13 days", or null for far-off dates.
export function whenChip(e, now = new Date()) {
  const start = new Date(e.startAt);
  const end = new Date(e.endAt || e.startAt);
  if (start <= now && now <= end) return { label: 'Happening now', tone: 'live' };
  const days = Math.round((new Date(`${dayKey(start)}T00:00:00`) - new Date(`${todayKey()}T00:00:00`)) / DAY);
  if (days === 0) return { label: 'Today', tone: 'live' };
  if (days === 1) return { label: 'Tomorrow', tone: 'soon' };
  if (days > 1 && days <= 60) return { label: `In ${days} days`, tone: 'plain' };
  return null;
}

// Registration: { label, tone } — registered, full, few slots left, closing soon.
export function registrationChip(e, registered) {
  if (e.status === 'cancelled') return { label: 'Cancelled', tone: 'off' };
  if (registered) return { label: "You're registered", tone: 'ok' };
  if (e.portalRegistration && e.capacity) {
    if (e.spotsLeft === 0) return { label: 'Full', tone: 'off' };
    if (e.spotsLeft <= Math.max(5, Math.round(e.capacity * 0.1))) return { label: `Only ${e.spotsLeft} slots left`, tone: 'soon' };
  }
  const d = deadlineInfo(e);
  if (d && !d.closed && d.soon) return { label: d.countdown, tone: 'soon' };
  if (d?.closed) return { label: 'Registration closed', tone: 'off' };
  return null;
}

const Chip = ({ chip }) => (chip ? <span className={`esp-chip esp-chip--${chip.tone}`}>{chip.tone === 'live' && <i aria-hidden="true" />}{chip.label}</span> : null);

function Featured({ event: e, registered, onOpen }) {
  const cat = categoryOf(e.category);
  const when = whenChip(e);
  const reg = registrationChip(e, registered);
  const canRegister = e.portalRegistration && !registered && e.status !== 'cancelled' && !e.registrationClosed;
  const pct = e.portalRegistration && e.capacity ? Math.min(100, Math.round(((e.registeredCount || 0) / e.capacity) * 100)) : null;

  return (
    <article className={`esp-feature${e.image ? ' has-image' : ''}`} style={{ '--cat': cat.color, ...(e.image && { '--esp-image': `url("${assetUrl(e.image)}")` }) }}>
      <Link to={`/events/${e.slug}`} onClick={modalClick(onOpen, e)} className="esp-feature__art" aria-label={`${e.title}: details`} tabIndex={-1}>
        <span className="esp-feature__date" aria-hidden="true">
          <small>{monthShort(e.startAt)}</small>
          <strong>{dayNumber(e.startAt)}</strong>
          <small>{weekdayShort(e.startAt)}</small>
        </span>
        <span className="esp-feature__chips">
          <Chip chip={when} />
        </span>
      </Link>
      <div className="esp-feature__body">
        <span className="esp-cat"><Icon name={cat.icon} size={13} /> {cat.label}{e.network ? ` · ${e.network.name}` : ''}</span>
        <h3>
          <Link to={`/events/${e.slug}`} onClick={modalClick(onOpen, e)} aria-haspopup="dialog">{e.title}</Link>
        </h3>
        <p className="esp-meta">
          <span><Icon name="clock" size={15} /> {timeRange(e)}</span>
          {(e.venue || e.onlineUrl) && <span><Icon name="pin" size={15} /> {e.venue || 'Online'}</span>}
        </p>
        {e.summary && <p className="esp-summary">{e.summary}</p>}
        {pct !== null && (
          <div className="esp-slots">
            <div className="esp-slots__bar" aria-hidden="true"><i style={{ width: `${Math.max(pct, e.registeredCount ? 3 : 0)}%` }} /></div>
            <span>{e.spotsLeft.toLocaleString()} of {e.capacity.toLocaleString()} slots left</span>
          </div>
        )}
        <div className="esp-feature__foot">
          <Chip chip={reg} />
          <span className="esp-feature__actions">
            {canRegister && (
              <Link to={`/events/${e.slug}`} onClick={modalClick(onOpen, e)} className="btn btn-gold" aria-haspopup="dialog">Register</Link>
            )}
            <Link to={`/events/${e.slug}`} onClick={modalClick(onOpen, e)} className="btn btn-outline" aria-haspopup="dialog">
              Details <Icon name="arrowRight" size={16} />
            </Link>
          </span>
        </div>
      </div>
    </article>
  );
}

function Row({ event: e, registered, onOpen }) {
  const cat = categoryOf(e.category);
  const when = whenChip(e);
  const reg = registrationChip(e, registered);
  return (
    <li>
      <Link to={`/events/${e.slug}`} onClick={modalClick(onOpen, e)} className={`esp-row${e.status === 'cancelled' ? ' is-cancelled' : ''}`} style={{ '--cat': cat.color }} aria-haspopup="dialog">
        <span className="esp-row__date" aria-hidden="true">
          <small>{monthShort(e.startAt)}</small>
          <strong>{dayNumber(e.startAt)}</strong>
          <small>{weekdayShort(e.startAt)}</small>
        </span>
        <span className="esp-row__body">
          <strong>{e.title}</strong>
          <span className="esp-meta">
            <span><Icon name="clock" size={13} /> {timeRange(e)}</span>
            {(e.venue || e.onlineUrl) && <span><Icon name="pin" size={13} /> {e.venue || 'Online'}</span>}
          </span>
          {(reg || when) && <span className="esp-row__chips"><Chip chip={reg || when} /></span>}
        </span>
        <span className="esp-row__go" aria-hidden="true"><Icon name="arrowRight" size={16} /></span>
      </Link>
    </li>
  );
}

/**
 * events: upcoming events (soonest first). registeredIds: Set of event ids the logged-in alumnus registered for.
 * onOpen(event): opens the event modal.
 */
export default function EventSpotlight({ events, registeredIds = new Set(), onOpen }) {
  if (!events.length) {
    return (
      <div className="esp-empty">
        <span className="esp-empty__icon" aria-hidden="true"><Icon name="calendar" size={24} /></span>
        <div>
          <strong>New events are coming soon</strong>
          <p>Reunions, homecoming activities and chapter gatherings will appear here. Meanwhile, join a chapter or volunteer.</p>
        </div>
        <span className="esp-empty__actions">
          <Link to="/networks" className="btn btn-outline">Find your chapter</Link>
          <Link to="/volunteer" className="btn btn-primary">Volunteer</Link>
        </span>
      </div>
    );
  }
  // 1 event: one wide card. 2 events: two equal cards (a one-item list would leave the panel half empty).
  // 3+ events: featured card + "Coming up next" list.
  if (events.length <= 2) {
    return (
      <div className={`esp ${events.length === 1 ? 'esp--single' : 'esp--pair'}`}>
        {events.map((e) => <Featured key={e.id} event={e} registered={registeredIds.has(e.id)} onOpen={onOpen} />)}
      </div>
    );
  }
  const [first, ...rest] = events;
  return (
    <div className="esp">
      <Featured event={first} registered={registeredIds.has(first.id)} onOpen={onOpen} />
      <div className="esp-list">
        <span className="esp-list__label">Coming up next</span>
        <ul>
          {rest.map((e) => <Row key={e.id} event={e} registered={registeredIds.has(e.id)} onOpen={onOpen} />)}
        </ul>
        {/* Grows to fill any space left beside the featured card */}
        <Link to="/events" className="esp-list__more">
          <span className="esp-list__more-icon" aria-hidden="true"><Icon name="calendar" size={18} /></span>
          <span>
            <strong>Browse the full calendar</strong>
            <small>Reunions, homecoming, chapter activities and alumni programs</small>
          </span>
          <Icon name="arrowRight" size={16} />
        </Link>
      </div>
    </div>
  );
}
