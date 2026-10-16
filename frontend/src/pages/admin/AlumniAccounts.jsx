import { useCallback, useEffect, useState } from 'react';
import ResourcePage from '../../components/admin/ResourcePage.jsx';
import Badge from '../../components/admin/Badge.jsx';
import { TitleCell } from '../../components/admin/cells.jsx';
import { formatDate, formatDateTime } from '../../components/admin/format.js';
import { useToast } from '../../components/admin/Toast.jsx';
import Icon from '../../components/ui/Icon.jsx';
import { adminApi } from '../../api/admin.js';
import '../../styles/import.css';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending review', tone: 'warning' },
  { value: 'verified', label: 'Verified', tone: 'success' },
  { value: 'email_unverified', label: 'Email not verified', tone: 'neutral' },
  { value: 'rejected', label: 'Rejected', tone: 'danger' },
];
const STATUS = Object.fromEntries(STATUS_OPTIONS.map((o) => [o.value, o]));
const StatusBadge = ({ value }) => <Badge value={value} tone={STATUS[value]?.tone} label={STATUS[value]?.label ?? value} />;

// Tracer submissions made from this alumnus's portal account, newest first (each one is kept as history).
function TracerHistory({ accountId }) {
  const [rows, setRows] = useState(null);
  useEffect(() => {
    adminApi.fetch(`/portal/accounts/${accountId}/tracer`).then(setRows).catch(() => setRows([]));
  }, [accountId]);

  if (!rows) return <span className="muted">Loading…</span>;
  if (!rows.length) return <span className="muted">No tracer submitted yet.</span>;
  return (
    <ol className="tracer-history">
      {rows.map((t, i) => (
        <li key={t.id}>
          <strong>{formatDate(t.createdAt)}</strong>
          {i === 0 && <Badge value="latest" tone="success" label="Latest" />}
          <span>
            {t.isEmployed ? `Employed · ${t.position || '—'} at ${t.employer || '—'}` : 'Not employed'}
            {t.furtherStudies ? ' · Further studies' : ''}
          </span>
        </li>
      ))}
    </ol>
  );
}

// The Registrar/EAO record with this student number (Step 5 import), compared with what the alumnus typed.
function RecordMatch({ accountId }) {
  const [match, setMatch] = useState(undefined);
  useEffect(() => {
    adminApi.fetch(`/portal/accounts/${accountId}/record`).then(setMatch).catch(() => setMatch(null));
  }, [accountId]);

  if (match === undefined) return <span className="muted">Checking records…</span>;
  if (!match) {
    return (
      <div className="im-match">
        <div className="im-match__head"><Badge value="none" tone="neutral" label="No Registrar record" /> No imported or encoded record has this student number. Verifying creates a new profile.</div>
      </div>
    );
  }
  const compared = match.checks.filter((c) => c.match !== null);
  const same = compared.filter((c) => c.match).length;
  return (
    <div className="im-match">
      <div className="im-match__head">
        <Badge value="match" tone={same === compared.length ? 'success' : 'warning'} label={`Registrar record ${match.alumniNumber || ''}`} />
        {same} of {compared.length} details match
      </div>
      <ul>
        {match.checks.map((c) => (
          <li key={c.label} className={c.match === null ? 'is-none' : c.match ? 'is-ok' : 'is-diff'}>
            <Icon name={c.match === null ? 'clock' : c.match ? 'check' : 'alert'} size={14} />
            <span>{c.label}</span>
            <span>
              {c.match === null ? <em>Not in the record</em> : c.match ? c.record : <>Typed <strong>{c.account}</strong> · record says <strong>{c.record}</strong></>}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Registrations whose email is confirmed and that wait for the Alumni Office.
function PendingReview({ onChange }) {
  const notify = useToast();
  const [accounts, setAccounts] = useState(null);
  const [rejecting, setRejecting] = useState(null); // account id -> reason box open
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(null);

  const load = useCallback(
    () => adminApi.list('/portal/accounts', { status: 'pending', limit: 100, sort: 'createdAt', order: 'asc' }).then((r) => setAccounts(r.data)),
    []
  );
  useEffect(() => {
    load();
  }, [load]);

  const act = async (account, action) => {
    setBusy(account.id);
    try {
      const res = await adminApi.send(`/portal/accounts/${account.id}/${action}`, 'POST', action === 'reject' ? { reason } : undefined);
      notify(res.message);
      setRejecting(null);
      setReason('');
      await load();
      onChange();
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setBusy(null);
    }
  };

  if (!accounts?.length) return null;

  return (
    <section className="admin-card access-requests">
      <div className="admin-card__head">
        <h2>
          Waiting for review <span className="count-pill">{accounts.length}</span>
        </h2>
        <p className="muted">These alumni confirmed their email. Check their details against the Registrar's records, then verify or reject.</p>
      </div>
      <ul className="access-requests__list">
        {accounts.map((a) => (
          <li key={a.id}>
            <div className="access-requests__who">
              <TitleCell
                title={`${a.fullName} · ${a.studentNumber}`}
                subtitle={`${a.program}, ${a.yearGraduated} · ${a.email} · registered ${formatDateTime(a.createdAt)}`}
              />
              <RecordMatch accountId={a.id} />
            </div>
            {rejecting === a.id ? (
              <div className="access-requests__actions">
                <input
                  className="inline-select"
                  placeholder="Reason (sent to the alumnus)"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  maxLength={500}
                  aria-label={`Reason for rejecting ${a.fullName}`}
                  autoFocus
                />
                <button type="button" className="btn btn-sm btn-danger-ghost" disabled={busy === a.id} onClick={() => act(a, 'reject')}>Confirm reject</button>
                <button type="button" className="btn btn-sm admin-btn-ghost" onClick={() => setRejecting(null)}>Cancel</button>
              </div>
            ) : (
              <div className="access-requests__actions">
                <button type="button" className="btn btn-primary btn-sm" disabled={busy === a.id} onClick={() => act(a, 'approve')}>Verify</button>
                <button type="button" className="btn btn-sm btn-danger-ghost" disabled={busy === a.id} onClick={() => { setRejecting(a.id); setReason(''); }}>Reject</button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function AlumniAccounts() {
  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = () => setRefreshKey((k) => k + 1);

  return (
    <ResourcePage
      title="Alumni accounts"
      description="Alumni Portal registrations. Verify new accounts after checking them against the Registrar's records."
      endpoint="/portal/accounts"
      entityLabel="alumni account"
      searchPlaceholder="Search name, email, student no. or program"
      rowTitle={(r) => r.fullName}
      refreshKey={refreshKey}
      headerExtra={<PendingReview key={refreshKey} onChange={refresh} />}
      columns={[
        { key: 'fullName', label: 'Name', render: (r) => <TitleCell title={r.fullName} subtitle={r.email} /> },
        { key: 'studentNumber', label: 'Student no.' },
        { key: 'program', label: 'Program' },
        { key: 'yearGraduated', label: 'Batch', className: 'num' },
        { key: 'status', label: 'Status', render: (r) => <StatusBadge value={r.status} /> },
        { key: 'createdAt', label: 'Registered', render: (r) => formatDate(r.createdAt) },
      ]}
      filters={[{ name: 'status', label: 'Status', options: STATUS_OPTIONS }]}
      details={[
        { key: 'fullName', label: 'Full name' },
        { key: 'studentNumber', label: 'Student ID number' },
        { key: 'program', label: 'Course / program' },
        { key: 'yearGraduated', label: 'Year graduated' },
        { key: 'email', label: 'Email', render: (r) => <a href={`mailto:${r.email}`}>{r.email}</a> },
        { key: 'phone', label: 'Contact number', render: (r) => <a href={`tel:${r.phone}`}>{r.phone}</a> },
        { key: 'sex', label: 'Sex' },
        { key: 'address', label: 'Address', wide: true },
        { key: 'status', label: 'Status', render: (r) => <StatusBadge value={r.status} /> },
        { key: 'emailVerifiedAt', label: 'Email verified', render: (r) => formatDateTime(r.emailVerifiedAt) },
        { key: 'reviewedAt', label: 'Reviewed', render: (r) => formatDateTime(r.reviewedAt) },
        { key: 'reviewNote', label: 'Rejection reason', wide: true },
        { key: 'lastLoginAt', label: 'Last login', render: (r) => formatDateTime(r.lastLoginAt) },
        { key: 'consentAt', label: 'Consent given', render: (r) => formatDateTime(r.consentAt) },
        { key: 'record', label: 'Registrar record', wide: true, render: (r) => <RecordMatch accountId={r.id} /> },
        { key: 'tracer', label: 'Graduate Tracer history', wide: true, render: (r) => <TracerHistory accountId={r.id} /> },
      ]}
    />
  );
}
