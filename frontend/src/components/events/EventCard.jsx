import { Link } from 'react-router-dom';
import Icon from '../ui/Icon.jsx';
import { categoryOf, monthShort, dayNumber, weekdayShort, timeRange, deadlineInfo, isPast } from './eventUtils.js';

// Compact event row/card used in the events list, homepage and portal dashboard.
export default function EventCard({ event, compact = false }) {
  const cat = categoryOf(event.category);
  const deadline = deadlineInfo(event);
  const cancelled = event.status === 'cancelled';
  const past = isPast(event);

  return (
    <Link
      to={`/events/${event.slug}`}
      className={`ev-card ${compact ? 'ev-card--compact' : ''} ${cancelled ? 'is-cancelled' : ''} ${past ? 'is-past' : ''}`}
      style={{ '--cat': cat.color }}
    >
      <span className="ev-card__date" aria-hidden="true">
        <small>{monthShort(event.startAt)}</small>
        <strong>{dayNumber(event.startAt)}</strong>
        <small>{weekdayShort(event.startAt)}</small>
      </span>
      <span className="ev-card__body">
        <span className="ev-card__meta">
          <span className="ev-chip" style={{ '--cat': cat.color }}><Icon name={cat.icon} size={12} /> {cat.label}</span>
          {cancelled && <span className="ev-chip ev-chip--cancelled">Cancelled</span>}
          {!cancelled && deadline && !deadline.closed && deadline.soon && <span className="ev-chip ev-chip--soon">{deadline.countdown}</span>}
        </span>
        <strong className="ev-card__title">{event.title}</strong>
        <span className="ev-card__info">
          <span><Icon name="clock" size={14} /> {timeRange(event)}</span>
          {(event.venue || event.onlineUrl) && <span><Icon name="pin" size={14} /> {event.venue || 'Online'}</span>}
        </span>
        {!compact && event.summary && <span className="ev-card__summary">{event.summary}</span>}
      </span>
      <span className="ev-card__go" aria-hidden="true"><Icon name="arrowRight" size={16} /></span>
    </Link>
  );
}
