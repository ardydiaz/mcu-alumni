import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import PageHeader from '../../components/admin/PageHeader.jsx';
import Badge from '../../components/admin/Badge.jsx';
import Pagination from '../../components/admin/Pagination.jsx';
import { formatDateTime } from '../../components/admin/format.js';
import { useToast } from '../../components/admin/Toast.jsx';
import Icon from '../../components/ui/Icon.jsx';
import { longDate, timeRange } from '../../components/events/eventUtils.js';
import { adminApi } from '../../api/admin.js';
import { authDownload, saveBlob } from '../../api/client.js';

// Registrants of one event (Step 11): built for long lists. Filters, search and paging run in the browser on
// the full list, so counts stay exact; bulk actions and quick check-in make event day fast.

const STATUS = {
  registered: { label: 'Not yet checked in', short: 'Registered', tone: 'info' },
  attended: { label: 'Attended', short: 'Attended', tone: 'success' },
  cancelled: { label: 'Cancelled', short: 'Cancelled', tone: 'neutral' },
};
const TABS = [
  { key: 'active', label: 'All registered' },
  { key: 'registered', label: 'Not yet checked in' },
  { key: 'attended', label: 'Attended' },
  { key: 'cancelled', label: 'Cancelled' },
];
const PAGE_SIZE = 25;
const fold = (s) => String(s || '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
const initials = (name = '') => {
  const [last = '', first = ''] = name.split(',').map((s) => s.trim());
  return `${first[0] || ''}${last[0] || ''}`.toUpperCase();
};

export default function EventRegistrants() {
  const { id } = useParams();
  const notify = useToast();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('active');
  const [search, setSearch] = useState('');
  const [program, setProgram] = useState('');
  const [batch, setBatch] = useState('');
  const [sort, setSort] = useState('name');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(() => new Set());
  const [busy, setBusy] = useState(null);
  const [checkIn, setCheckIn] = useState('');
  const checkInRef = useRef(null);

  const load = useCallback(
    () =>
      adminApi
        .fetch(`/events/${id}/registrations`)
        .then(setData)
        .catch(setError),
    [id]
  );
  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => setPage(1), [tab, search, program, batch, sort]);
  useEffect(() => setSelected(new Set()), [tab, program, batch]);

  const rows = data?.rows || [];
  const programs = useMemo(() => [...new Set(rows.map((r) => r.program).filter(Boolean))].sort(), [rows]);
  const batches = useMemo(() => [...new Set(rows.map((r) => r.yearGraduated).filter(Boolean))].sort((a, b) => b - a), [rows]);
  const counts = useMemo(() => {
    const c = { active: 0, registered: 0, attended: 0, cancelled: 0 };
    for (const r of rows) {
      c[r.status] += 1;
      if (r.status !== 'cancelled') c.active += 1;
    }
    return c;
  }, [rows]);

  const shown = useMemo(() => {
    const term = fold(search.trim());
    const list = rows.filter((r) => {
      if (tab === 'active' ? r.status === 'cancelled' : r.status !== tab) return false;
      if (program && r.program !== program) return false;
      if (batch && String(r.yearGraduated) !== batch) return false;
      return !term || fold(`${r.fullName} ${r.email} ${r.phone} ${r.studentNumber} ${r.alumniNumber} ${r.program}`).includes(term);
    });
    const by = {
      name: (a, b) => a.fullName.localeCompare(b.fullName),
      recent: (a, b) => new Date(b.registeredAt) - new Date(a.registeredAt),
      program: (a, b) => String(a.program).localeCompare(String(b.program)) || a.fullName.localeCompare(b.fullName),
    };
    return list.sort(by[sort]);
  }, [rows, tab, search, program, batch, sort]);

  const pageRows = shown.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const meta = { page, limit: PAGE_SIZE, total: shown.length, totalPages: Math.max(1, Math.ceil(shown.length / PAGE_SIZE)) };
  const allOnPage = pageRows.length > 0 && pageRows.every((r) => selected.has(r.id));

  const toggle = (rowId) => setSelected((s) => {
    const next = new Set(s);
    next.has(rowId) ? next.delete(rowId) : next.add(rowId);
    return next;
  });
  const togglePage = () => setSelected((s) => {
    const next = new Set(s);
    for (const r of pageRows) allOnPage ? next.delete(r.id) : next.add(r.id);
    return next;
  });

  const setStatus = async (ids, status) => {
    setBusy(ids.length === 1 ? ids[0] : 'bulk');
    try {
      const res = ids.length === 1
        ? await adminApi.send(`/events/${id}/registrations/${ids[0]}`, 'PATCH', { status })
        : await adminApi.send(`/events/${id}/registrations`, 'PATCH', { ids, status });
      if (ids.length > 1) notify(res.message);
      setSelected(new Set());
      await load();
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setBusy(null);
    }
  };

  // Event day: type a name, student no. or email and press Enter; one match -> checked in.
  const quickCheckIn = async (ev) => {
    ev.preventDefault();
    const term = fold(checkIn.trim());
    if (!term) return;
    const matches = rows.filter((r) => r.status !== 'cancelled' && fold(`${r.fullName} ${r.email} ${r.studentNumber} ${r.alumniNumber}`).includes(term));
    if (!matches.length) return notify(`No registrant matches "${checkIn}"`, 'error');
    if (matches.length > 1) {
      setTab('active');
      setSearch(checkIn);
      return notify(`${matches.length} registrants match; pick the right one from the list`, 'error');
    }
    const [r] = matches;
    if (r.status === 'attended') return notify(`${r.fullName} is already checked in`);
    await setStatus([r.id], 'attended');
    notify(`${r.fullName} checked in`);
    setCheckIn('');
    checkInRef.current?.focus();
  };

  const exportCsv = async () => {
    try {
      const { blob, fileName } = await authDownload(`/events/${id}/registrations/export`);
      saveBlob(blob, fileName);
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  if (error) return <div className="admin-empty"><h2>{error.status === 404 ? 'Event not found' : "Couldn't load the registrants"}</h2><Link to="/admin/events">Back to events</Link></div>;
  if (!data) return <div className="skeleton" style={{ height: 320, borderRadius: 20 }} />;

  const e = data.event;
  const pct = e.capacity ? Math.min(100, Math.round((counts.active / e.capacity) * 100)) : null;
  const ids = [...selected];

  return (
    <div className="erp">
      <PageHeader
        title="Registrants"
        description={`${e.title} · ${longDate(e.startAt)} · ${timeRange(e)}${e.venue ? ` · ${e.venue}` : ''}`}
        actions={
          <>
            <Link to="/admin/events" className="btn btn-sm admin-btn-ghost"><Icon name="arrowRight" size={14} className="flip" /> All events</Link>
            <a href={`/events/${e.slug}`} target="_blank" rel="noreferrer" className="btn btn-sm admin-btn-ghost"><Icon name="external" size={14} /> Public page</a>
            <button type="button" className="btn btn-sm btn-primary" onClick={exportCsv} disabled={!rows.length}><Icon name="download" size={14} /> Export CSV</button>
          </>
        }
      />

      <div className="erp-stats">
        <div className="erp-stat erp-stat--main">
          <span>Registered</span>
          <strong>{counts.active.toLocaleString()}{e.capacity ? <small> / {e.capacity.toLocaleString()}</small> : null}</strong>
          {pct !== null && <div className="erp-bar"><i style={{ width: `${pct}%` }} /></div>}
          <small>{e.capacity ? `${Math.max(0, e.capacity - counts.active).toLocaleString()} slots left` : 'No slot limit'}</small>
        </div>
        <div className="erp-stat erp-stat--ok"><span>Attended</span><strong>{counts.attended.toLocaleString()}</strong><small>{counts.active ? `${Math.round((counts.attended / counts.active) * 100)}% of registered` : '—'}</small></div>
        <div className="erp-stat"><span>Not yet checked in</span><strong>{counts.registered.toLocaleString()}</strong><small>still expected</small></div>
        <div className="erp-stat erp-stat--muted"><span>Cancelled</span><strong>{counts.cancelled.toLocaleString()}</strong><small>by the alumnus or staff</small></div>
      </div>

      <form className="erp-checkin" onSubmit={quickCheckIn}>
        <span className="erp-checkin__icon"><Icon name="check" size={18} /></span>
        <div>
          <strong>Quick check-in</strong>
          <small>On event day: type a name, student no., alumni no. or email and press Enter.</small>
        </div>
        <input ref={checkInRef} value={checkIn} onChange={(ev) => setCheckIn(ev.target.value)} placeholder="e.g. Diaz, Ardy or 2021-10348C" aria-label="Quick check-in" />
        <button type="submit" className="btn btn-sm btn-primary" disabled={!checkIn.trim() || busy}>Check in</button>
      </form>

      <section className="admin-card">
        <div className="erp-tabs" role="tablist" aria-label="Filter by status">
          {TABS.map((t) => (
            <button key={t.key} type="button" role="tab" aria-selected={tab === t.key} className={tab === t.key ? 'is-active' : ''} onClick={() => setTab(t.key)}>
              {t.label} <span>{counts[t.key].toLocaleString()}</span>
            </button>
          ))}
        </div>

        <div className="admin-toolbar">
          <label className="search">
            <Icon name="search" size={18} />
            <input type="search" placeholder="Search name, email, phone, student or alumni no." value={search} onChange={(ev) => setSearch(ev.target.value)} aria-label="Search registrants" />
          </label>
          <label className="admin-filter">
            <span>Program</span>
            <select value={program} onChange={(ev) => setProgram(ev.target.value)}>
              <option value="">All programs</option>
              {programs.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </label>
          <label className="admin-filter">
            <span>Batch</span>
            <select value={batch} onChange={(ev) => setBatch(ev.target.value)}>
              <option value="">All</option>
              {batches.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </label>
          <label className="admin-filter">
            <span>Sort by</span>
            <select value={sort} onChange={(ev) => setSort(ev.target.value)}>
              <option value="name">Name (A–Z)</option>
              <option value="recent">Newest registration</option>
              <option value="program">Program</option>
            </select>
          </label>
        </div>

        {ids.length > 0 && (
          <div className="erp-bulk" role="region" aria-label="Selected registrants">
            <strong>{ids.length} selected</strong>
            <button type="button" className="btn btn-sm btn-primary" disabled={busy === 'bulk'} onClick={() => setStatus(ids, 'attended')}><Icon name="check" size={14} /> Mark attended</button>
            <button type="button" className="btn btn-sm admin-btn-ghost" disabled={busy === 'bulk'} onClick={() => setStatus(ids, 'registered')}>Mark not checked in</button>
            <button type="button" className="btn btn-sm btn-danger-ghost" disabled={busy === 'bulk'} onClick={() => window.confirm(`Cancel ${ids.length} registration${ids.length === 1 ? '' : 's'}?`) && setStatus(ids, 'cancelled')}>Cancel registration</button>
            <button type="button" className="link-btn" onClick={() => setSelected(new Set())}>Clear</button>
          </div>
        )}

        {shown.length ? (
          <div className="table-wrap">
            <table className="data-table erp-table">
              <thead>
                <tr>
                  <th scope="col" className="erp-check"><input type="checkbox" checked={allOnPage} onChange={togglePage} aria-label="Select all on this page" /></th>
                  <th scope="col">Alumnus</th>
                  <th scope="col">Program · batch</th>
                  <th scope="col">Contact</th>
                  <th scope="col">Registered</th>
                  <th scope="col">Status</th>
                  <th scope="col" className="erp-action"><span className="sr-only">Action</span></th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((r) => (
                  <tr key={r.id} className={selected.has(r.id) ? 'is-selected' : ''}>
                    <td className="erp-check" data-label="Select"><input type="checkbox" checked={selected.has(r.id)} onChange={() => toggle(r.id)} aria-label={`Select ${r.fullName}`} /></td>
                    <td data-label="Alumnus">
                      <div className="erp-who">
                        <span className={`erp-avatar erp-avatar--${r.status}`}>{initials(r.fullName)}</span>
                        <div>
                          {r.profileId ? <Link to={`/admin/profiles/${r.profileId}`}>{r.fullName}</Link> : <strong>{r.fullName}</strong>}
                          <small>{[r.alumniNumber, r.studentNumber].filter(Boolean).join(' · ')}</small>
                        </div>
                      </div>
                    </td>
                    <td data-label="Program · batch"><div className="erp-cell"><span className="erp-program">{r.program}</span><small className="erp-sub">Batch {r.yearGraduated}</small></div></td>
                    <td data-label="Contact"><div className="erp-cell"><a href={`mailto:${r.email}`}>{r.email}</a><small className="erp-sub">{r.phone}</small></div></td>
                    <td data-label="Registered"><div className="erp-cell">{formatDateTime(r.registeredAt)}{r.attendedAt && <small className="erp-sub">Checked in {formatDateTime(r.attendedAt)}</small>}</div></td>
                    <td data-label="Status"><Badge value={r.status} tone={STATUS[r.status].tone} label={STATUS[r.status].short} /></td>
                    <td className="erp-action" data-label="Action">
                      {r.status === 'registered' && <button type="button" className="btn btn-sm btn-primary" disabled={busy === r.id} onClick={() => setStatus([r.id], 'attended')}><Icon name="check" size={14} /> Check in</button>}
                      {r.status === 'attended' && <button type="button" className="btn btn-sm admin-btn-ghost" disabled={busy === r.id} onClick={() => setStatus([r.id], 'registered')}>Undo</button>}
                      {r.status === 'cancelled' && <button type="button" className="btn btn-sm admin-btn-ghost" disabled={busy === r.id} onClick={() => setStatus([r.id], 'registered')}>Restore</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="table-empty">{rows.length ? 'No registrants match these filters.' : 'No one has registered yet. Registrations from the Alumni Portal appear here.'}</p>
        )}
        <Pagination meta={meta} onPage={setPage} />
      </section>
    </div>
  );
}
