import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import PageHeader from '../../components/admin/PageHeader.jsx';
import DataTable from '../../components/admin/DataTable.jsx';
import Pagination from '../../components/admin/Pagination.jsx';
import Modal from '../../components/admin/Modal.jsx';
import ResourceForm, { payloadFromValues } from '../../components/admin/ResourceForm.jsx';
import Badge from '../../components/admin/Badge.jsx';
import { InviteBadge, INVITE_STATUS } from '../../components/admin/InviteDialog.jsx';
import { TitleCell } from '../../components/admin/cells.jsx';
import { useToast } from '../../components/admin/Toast.jsx';
import Icon from '../../components/ui/Icon.jsx';
import { adminApi } from '../../api/admin.js';
import { authDownload, saveBlob, getPsgc } from '../../api/client.js';

// Step 4: alumni master records. Portal accounts get a profile when verified; EAO encodes walk-ins here.
const NEW_FIELDS = [
  { name: 'studentNumber', label: 'Student ID number', required: true },
  { name: 'yearGraduated', label: 'Year graduated', type: 'number', required: true },
  { name: 'surname', label: 'Surname', required: true },
  { name: 'firstName', label: 'First name', required: true },
  { name: 'middleName', label: 'Middle name' },
  { name: 'suffix', label: 'Suffix', placeholder: 'Jr., III' },
  { name: 'program', label: 'Degree / program', required: true, span: 2, placeholder: 'BS Nursing' },
  { name: 'email', label: 'Email', type: 'email' },
  { name: 'phone', label: 'Mobile number', type: 'tel' },
];

function useDebounced(value, ms = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

// Where a record came from (alumni_profiles.source); records from before migration 10 fall back to the portal link.
const SOURCES = {
  portal: { tone: 'info', label: 'Alumni Portal' },
  eao: { tone: 'neutral', label: 'EAO encoded' },
  import: { tone: 'warning', label: 'Imported' },
};
const SourceBadge = ({ row }) => {
  const s = SOURCES[row.source || (row.alumniAccountId ? 'portal' : 'eao')];
  return (
    <>
      <Badge value={row.source} tone={s.tone} label={s.label} />
    </>
  );
};

// EAO search filters (Step 11). Text filters are debounced together with the rest.
const NO_FILTERS = { search: '', program: '', yearGraduated: '', regionCode: '', location: '', employment: '', employer: '', updated: '', invite: '', source: '' };
const UPDATED = {
  recent: { label: 'Updated in the last 12 months', tone: 'success' },
  stale: { label: 'Not updated in 12+ months', tone: 'warning' },
  never: { label: 'Never updated by the alumnus', tone: 'neutral' },
};
const toQuery = (f) => Object.entries(f).filter(([, v]) => v !== '').map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
const ago = (d) => {
  if (!d) return null;
  const days = Math.floor((Date.now() - new Date(d)) / 86400000);
  return days < 1 ? 'today' : days < 31 ? `${days} day${days === 1 ? '' : 's'} ago` : days < 365 ? `${Math.floor(days / 30)} mo ago` : `${Math.floor(days / 365)} yr ago`;
};

// Monitoring tiles: click one to show those profiles.
function Overview({ data, filters, onPick }) {
  if (!data) return <div className="pm-tiles is-loading" />;
  const c = data.counts;
  const pct = (n) => (c.total ? `${Math.round((n / c.total) * 100)}%` : '0%');
  const tiles = [
    { key: 'all', value: c.total, label: 'Alumni records', hint: 'in the database', set: {} },
    { key: 'claimed', value: c.activated, label: 'Use the portal', hint: pct(c.activated), set: { invite: 'claimed' } },
    { key: 'recent', value: c.updatedRecent, label: 'Updated', hint: 'last 12 months', set: { updated: 'recent' }, tone: 'ok' },
    { key: 'stale', value: c.updatedStale, label: 'Not updated', hint: '12+ months ago', set: { updated: 'stale' }, tone: 'warn' },
    { key: 'never', value: c.neverUpdated, label: 'Never updated', hint: 'by the alumnus', set: { updated: 'never' }, tone: 'muted' },
    { key: 'employed', value: c.employed, label: 'Employed', hint: 'with a current job', set: { employment: 'employed' } },
  ];
  const isActive = (t) => (t.key === 'all' ? !filters.invite && !filters.updated && !filters.employment : Object.entries(t.set).every(([k, v]) => filters[k] === v));
  return (
    <div className="pm-tiles">
      {tiles.map((t) => (
        <button key={t.key} type="button" className={`pm-tile${t.tone ? ` pm-tile--${t.tone}` : ''}${isActive(t) ? ' is-active' : ''}`} onClick={() => onPick(t.set)} aria-pressed={isActive(t)}>
          <strong>{t.value.toLocaleString()}</strong>
          <span>{t.label}</span>
          <small>{t.hint}</small>
        </button>
      ))}
    </div>
  );
}

export default function AlumniProfiles() {
  const navigate = useNavigate();
  const notify = useToast();
  const [params, setParams] = useSearchParams();
  const batch = params.get('batch') || '';
  const [filters, setFilters] = useState(NO_FILTERS);
  const [more, setMore] = useState(false);
  const [overview, setOverview] = useState(null);
  const [regions, setRegions] = useState([]);
  const [exporting, setExporting] = useState(false);
  const [page, setPage] = useState(1);
  const [result, setResult] = useState({ rows: [], meta: null, loading: true });
  const [creating, setCreating] = useState(false);
  const [values, setValues] = useState({});
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const f = useDebounced(filters);
  const set = (k) => (e) => setFilters((s) => ({ ...s, [k]: e.target.value }));
  const activeCount = Object.entries(filters).filter(([k, v]) => k !== 'search' && v !== '').length;
  const moreCount = ['regionCode', 'location', 'employment', 'employer', 'updated', 'invite', 'source'].filter((k) => filters[k] !== '').length;

  useEffect(() => {
    adminApi.fetch('/profiles/overview').then(setOverview).catch(() => {});
    getPsgc('/regions').then(setRegions).catch(() => {});
  }, []);

  const load = useCallback(() => {
    setResult((r) => ({ ...r, loading: true }));
    adminApi
      .list('/profiles', { ...f, importBatchId: batch, page, limit: 20, ...(f.updated && { sort: 'alumniUpdatedAt', order: f.updated === 'recent' ? 'desc' : 'asc' }) })
      .then((res) => setResult({ rows: res.data, meta: res.meta, loading: false }))
      .catch((err) => {
        notify(err.message, 'error');
        setResult({ rows: [], meta: null, loading: false });
      });
  }, [f, batch, page, notify]);
  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => setPage(1), [f, batch]);

  const exportCsv = async () => {
    setExporting(true);
    try {
      const q = toQuery({ ...filters, ...(batch && { importBatchId: batch }) });
      const { blob, fileName } = await authDownload(`/imports/export${q ? `?${q}` : ''}`);
      saveBlob(blob, fileName);
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setExporting(false);
    }
  };

  const create = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      const { data } = payloadFromValues(NEW_FIELDS, values, {});
      const res = await adminApi.create('/profiles', data);
      notify(res.message);
      setCreating(false);
      navigate(`/admin/profiles/${res.data.id}`);
    } catch (err) {
      setErrors(err.fields || {});
      notify(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Alumni profiles"
        description="The master record of each graduate: profile, address, family, education, skills, trainings, work and references. Profiles are imported from the Registrar's records, created when a portal account is verified, or encoded here for walk-ins."
        actions={
          <>
            <Link to="/admin/imports" className="btn admin-btn-ghost">
              <Icon name="upload" size={16} /> Import
            </Link>
            <button type="button" className="btn admin-btn-ghost" onClick={exportCsv} disabled={exporting} title="Exports the profiles that match the current filters">
              <Icon name="download" size={16} /> {exporting ? 'Exporting…' : result.meta ? `Export ${result.meta.total.toLocaleString()}` : 'Export CSV'}
            </button>
            <button type="button" className="btn btn-primary" onClick={() => { setValues({}); setErrors({}); setCreating(true); }}>
              <Icon name="plus" size={16} /> New profile
            </button>
          </>
        }
      />
      <Overview data={overview} filters={filters} onPick={(s) => setFilters((cur) => ({ ...cur, invite: '', updated: '', employment: '', ...s }))} />

      <section className="admin-card">
        {batch && (
          <p className="admin-filter-note">
            Showing the records created by import #{batch}.{' '}
            <button type="button" className="link-btn" onClick={() => setParams({})}>Show all profiles</button>
          </p>
        )}
        <div className="admin-toolbar">
          <label className="search">
            <Icon name="search" size={18} />
            <input type="search" placeholder="Search name, alumni no., student ID, email or phone" value={filters.search} onChange={set('search')} aria-label="Search profiles" />
          </label>
          <label className="admin-filter">
            <span>Program</span>
            <select value={filters.program} onChange={set('program')}>
              <option value="">All programs</option>
              {(overview?.programs || []).map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </label>
          <label className="admin-filter">
            <span>Graduation year</span>
            <select value={filters.yearGraduated} onChange={set('yearGraduated')}>
              <option value="">All years</option>
              {(overview?.years || []).map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </label>
          <button type="button" className={`btn btn-sm admin-btn-ghost pm-more${more ? ' is-open' : ''}`} onClick={() => setMore((m) => !m)} aria-expanded={more}>
            <Icon name="chevronDown" size={14} /> More filters{moreCount ? ` (${moreCount})` : ''}
          </button>
          {activeCount > 0 && <button type="button" className="link-btn" onClick={() => setFilters((s) => ({ ...NO_FILTERS, search: s.search }))}>Clear filters</button>}
        </div>
        {more && (
          <div className="admin-toolbar pm-filters">
            <label className="admin-filter">
              <span>Region</span>
              <select value={filters.regionCode} onChange={set('regionCode')}>
                <option value="">Any region</option>
                {regions.map((r) => <option key={r.code} value={r.code}>{r.name}</option>)}
              </select>
            </label>
            <label className="admin-filter">
              <span>Location contains</span>
              <input type="search" placeholder="City, province, barangay, country…" value={filters.location} onChange={set('location')} />
            </label>
            <label className="admin-filter">
              <span>Employment</span>
              <select value={filters.employment} onChange={set('employment')}>
                <option value="">Any</option>
                <option value="employed">Has a current job</option>
                <option value="none">No current job on record</option>
              </select>
            </label>
            <label className="admin-filter">
              <span>Employer / position</span>
              <input type="search" placeholder="e.g. St. Luke's, Nurse, Manager" value={filters.employer} onChange={set('employer')} />
            </label>
            <label className="admin-filter">
              <span>Profile updates</span>
              <select value={filters.updated} onChange={set('updated')}>
                <option value="">Any</option>
                {Object.entries(UPDATED).map(([v, s]) => <option key={v} value={v}>{s.label}</option>)}
              </select>
            </label>
            <label className="admin-filter">
              <span>Portal</span>
              <select value={filters.invite} onChange={set('invite')}>
                <option value="">Any</option>
                {Object.entries(INVITE_STATUS).map(([value, s]) => <option key={value} value={value}>{s.label}</option>)}
              </select>
            </label>
            <label className="admin-filter">
              <span>Source</span>
              <select value={filters.source} onChange={set('source')}>
                <option value="">Any</option>
                {Object.entries(SOURCES).map(([value, s]) => <option key={value} value={value}>{s.label}</option>)}
              </select>
            </label>
          </div>
        )}
        {result.meta && <p className="pm-count muted">{result.meta.total.toLocaleString()} profile{result.meta.total === 1 ? '' : 's'}{activeCount || filters.search ? ' match' : ''}</p>}
        <DataTable
          loading={result.loading}
          rows={result.rows}
          onRowClick={(r) => navigate(`/admin/profiles/${r.id}`)}
          emptyMessage="No alumni profiles found."
          columns={[
            { key: 'alumniNumber', label: 'Alumni No.', render: (r) => r.alumniNumber || '—' },
            { key: 'name', label: 'Name', render: (r) => <TitleCell title={`${r.surname}, ${r.firstName}${r.middleName ? ` ${r.middleName}` : ''}`} subtitle={r.email || r.phone || '—'} /> },
            { key: 'program', label: 'Program / batch', render: (r) => <TitleCell title={r.program} subtitle={`${r.yearGraduated} · ${r.studentNumber}`} /> },
            { key: 'job', label: 'Current job', render: (r) => (r.currentJob ? <TitleCell title={r.currentJob.position} subtitle={r.currentJob.company} /> : <span className="muted">—</span>) },
            { key: 'location', label: 'Location', render: (r) => r.city || r.province || (r.country && r.country !== 'Philippines' ? r.country : null) || <span className="muted">{r.houseStreet ? r.houseStreet.split(',').slice(-1)[0].trim().slice(0, 28) : '—'}</span> },
            {
              key: 'alumniUpdatedAt',
              label: 'Updated by alumnus',
              render: (r) => {
                const stale = r.alumniUpdatedAt && Date.now() - new Date(r.alumniUpdatedAt) > (overview?.updatedWithinDays || 365) * 86400000;
                return r.alumniUpdatedAt ? <Badge value="u" tone={stale ? 'warning' : 'success'} label={ago(r.alumniUpdatedAt)} /> : <span className="muted">Never</span>;
              },
            },
            { key: 'portal', label: 'Portal', render: (r) => <><InviteBadge profile={r} /> <SourceBadge row={r} /></> },
          ]}
        />
        <Pagination meta={result.meta} onPage={setPage} />
      </section>

      <Modal
        open={creating}
        title="New alumni profile"
        subtitle="For walk-ins and paper forms. An Alumni Number is assigned when you save; you can complete the other sections next."
        onClose={() => !saving && setCreating(false)}
        footer={
          <>
            <button type="button" className="btn admin-btn-ghost" onClick={() => setCreating(false)} disabled={saving}>Cancel</button>
            <button type="submit" form="new-profile" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Create profile'}</button>
          </>
        }
      >
        <form id="new-profile" onSubmit={create} noValidate>
          <ResourceForm fields={NEW_FIELDS} values={values} errors={errors} files={{}} isNew onChange={(name, v) => setValues((s) => ({ ...s, [name]: v }))} onFile={() => {}} />
        </form>
      </Modal>
    </>
  );
}
