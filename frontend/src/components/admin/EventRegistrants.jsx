import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Badge from './Badge.jsx';
import { formatDateTime } from './format.js';
import { useToast } from './Toast.jsx';
import Icon from '../ui/Icon.jsx';
import { adminApi } from '../../api/admin.js';
import { authDownload, saveBlob } from '../../api/client.js';

// Alumni who registered for an event through the Alumni Portal: attendance and CSV (Step 11).
const STATUS = {
  registered: { label: 'Registered', tone: 'info' },
  attended: { label: 'Attended', tone: 'success' },
  cancelled: { label: 'Cancelled', tone: 'neutral' },
};

export default function EventRegistrants({ event }) {
  const notify = useToast();
  const [data, setData] = useState(null);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(null);

  const load = useCallback(() => {
    adminApi.fetch(`/events/${event.id}/registrations`, { status: filter, search }).then(setData).catch((err) => notify(err.message, 'error'));
  }, [event.id, filter, search, notify]);
  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const setStatus = async (r, status) => {
    setBusy(r.id);
    try {
      await adminApi.send(`/events/${event.id}/registrations/${r.id}`, 'PATCH', { status });
      load();
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setBusy(null);
    }
  };

  const exportCsv = async () => {
    try {
      const { blob, fileName } = await authDownload(`/events/${event.id}/registrations/export`);
      saveBlob(blob, fileName);
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  if (!event.portalRegistration && !data?.rows.length) {
    return <span className="muted">Registration through the Alumni Portal is off for this event. Edit the event to turn it on.</span>;
  }
  if (!data) return <span className="muted">Loading registrants…</span>;
  const { counts } = data;
  const active = counts.registered + counts.attended;

  return (
    <div className="er">
      <div className="er-stats">
        <div><strong>{active.toLocaleString()}</strong><span>{event.capacity ? `of ${event.capacity.toLocaleString()} slots` : 'registered'}</span></div>
        <div><strong>{counts.attended.toLocaleString()}</strong><span>attended</span></div>
        <div><strong>{counts.cancelled.toLocaleString()}</strong><span>cancelled</span></div>
        {event.capacity > 0 && (
          <div className="er-stats__bar" aria-hidden="true"><span style={{ width: `${Math.min(100, (active / event.capacity) * 100)}%` }} /></div>
        )}
      </div>

      <div className="er-toolbar">
        <select className="inline-select" value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter registrants">
          <option value="">All</option>
          {Object.entries(STATUS).map(([v, s]) => <option key={v} value={v}>{s.label}</option>)}
        </select>
        <input className="inline-select" type="search" placeholder="Search name, email or program" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search registrants" />
        <button type="button" className="btn btn-sm admin-btn-ghost" onClick={exportCsv} disabled={!data.rows.length && !filter}>
          <Icon name="download" size={14} /> Export CSV
        </button>
      </div>

      {data.rows.length ? (
        <ul className="er-list">
          {data.rows.map((r) => (
            <li key={r.id} className={r.status === 'cancelled' ? 'is-cancelled' : ''}>
              <div className="er-list__who">
                <strong>{r.profileId ? <Link to={`/admin/profiles/${r.profileId}`}>{r.fullName}</Link> : r.fullName}</strong>
                <span className="muted">{[r.alumniNumber, r.program, r.yearGraduated].filter(Boolean).join(' · ')}</span>
                <span className="muted">{r.email} · {r.phone} · registered {formatDateTime(r.registeredAt)}</span>
              </div>
              <Badge value={r.status} tone={STATUS[r.status].tone} label={STATUS[r.status].label} />
              <div className="er-list__actions">
                {r.status === 'registered' && <button type="button" className="btn btn-sm btn-primary" disabled={busy === r.id} onClick={() => setStatus(r, 'attended')}><Icon name="check" size={14} /> Attended</button>}
                {r.status === 'attended' && <button type="button" className="btn btn-sm admin-btn-ghost" disabled={busy === r.id} onClick={() => setStatus(r, 'registered')}>Undo attended</button>}
                {r.status === 'cancelled' && <button type="button" className="btn btn-sm admin-btn-ghost" disabled={busy === r.id} onClick={() => setStatus(r, 'registered')}>Restore</button>}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted">{filter || search ? 'No registrants match.' : 'No one has registered yet.'}</p>
      )}
    </div>
  );
}
