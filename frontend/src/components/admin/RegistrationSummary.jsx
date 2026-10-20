import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../ui/Icon.jsx';
import { adminApi } from '../../api/admin.js';

// Event details modal: registration numbers at a glance + a link to the full Registrants page
// (/admin/events/:id/registrants), where the list itself is managed.
export default function RegistrationSummary({ event }) {
  const [counts, setCounts] = useState(null);
  useEffect(() => {
    adminApi.fetch(`/events/${event.id}/registrations`).then((d) => setCounts(d.counts)).catch(() => setCounts(null));
  }, [event.id]);

  if (!event.portalRegistration && !counts?.registered && !counts?.attended) {
    return <span className="muted">Registration through the Alumni Portal is off for this event. Edit the event to turn it on.</span>;
  }
  if (!counts) return <span className="muted">Loading…</span>;
  const active = counts.registered + counts.attended;
  const pct = event.capacity ? Math.min(100, Math.round((active / event.capacity) * 100)) : null;

  return (
    <div className="rs">
      <div className="rs-nums">
        <div><strong>{active.toLocaleString()}</strong><span>{event.capacity ? `of ${event.capacity.toLocaleString()} slots` : 'registered'}</span></div>
        <div><strong>{counts.attended.toLocaleString()}</strong><span>attended</span></div>
        <div><strong>{counts.cancelled.toLocaleString()}</strong><span>cancelled</span></div>
      </div>
      {pct !== null && <div className="rs-bar" aria-hidden="true"><i style={{ width: `${pct}%` }} /></div>}
      <Link to={`/admin/events/${event.id}/registrants`} className="btn btn-sm btn-primary rs-open">
        <Icon name="users" size={14} /> Manage registrants{active ? ` (${active.toLocaleString()})` : ''} <Icon name="arrowRight" size={14} />
      </Link>
    </div>
  );
}
