import { useEffect, useMemo, useState } from 'react';
import PageHeader from '../../components/admin/PageHeader.jsx';
import { useToast } from '../../components/admin/Toast.jsx';
import Icon from '../../components/ui/Icon.jsx';
import { useContent } from '../../hooks/useContent.js';
import { adminApi } from '../../api/admin.js';
import { assetUrl, authDownload, getPsgc, saveBlob } from '../../api/client.js';
import '../../styles/reports.css';

// Step 13: Report Generation. Choose a report -> filters -> Generate -> preview -> Excel or Print / PDF.
// The reports are built by backend/src/modules/alumniReports from the live database.

const GRADUATE_COLUMNS = [
  ['studentNumber', 'Student No.'], ['alumniNumber', 'Alumni No.'], ['name', 'Name'], ['program', 'Program'], ['yearGraduated', 'Year'],
  ['sex', 'Sex'], ['email', 'Email'], ['phone', 'Contact No.'], ['address', 'Address'], ['employer', 'Current employer'], ['position', 'Position'], ['industry', 'Industry'], ['portal', 'Portal account'],
];
const DEFAULT_COLUMNS = ['studentNumber', 'name', 'program', 'yearGraduated', 'email', 'phone'];

const REPORTS = [
  { key: 'graduates', icon: 'id', title: 'List of graduates', tag: 'Accreditation', text: 'Graduates of a program and batch, with the columns you choose.', filters: ['program', 'years', 'region', 'location', 'sex', 'work', 'columns'] },
  { key: 'employment', icon: 'building', title: 'Employment by program', tag: 'Tracer study', text: 'Employment status of graduates per program from the Graduate Tracer.', filters: ['program', 'years'] },
  { key: 'tracer', icon: 'rocket', title: 'Tracer study results', tag: 'Tracer study', text: 'Time to first job, job level, related to degree, further studies.', filters: ['program', 'years'] },
  { key: 'engagement', icon: 'users', title: 'Alumni engagement', text: 'Portal use and profile updates per program or batch.', filters: ['program', 'years', 'groupBy:program,year'] },
  { key: 'attendance', icon: 'calendar', title: 'Event attendance', text: 'Registered vs attended per event, or the attendee list of one event.', filters: ['event', 'dates'] },
  { key: 'location', icon: 'pin', title: 'Graduates by location', text: 'Where graduates live, by region, province or city.', filters: ['program', 'years', 'sex', 'work', 'groupBy:region,province,city'] },
];
const GROUP_LABELS = { program: 'Program', year: 'Batch', region: 'Region', province: 'Province', city: 'City / municipality' };
const EMPTY = { program: '', yearFrom: '', yearTo: '', regionCode: '', location: '', sex: '', employment: '', industry: '', jobLevel: '', groupBy: '', eventId: '', dateFrom: '', dateTo: '' };

const fmt = (v, type) => (v === null || v === undefined || v === '' ? '—' : type === 'percent' ? `${v}%` : typeof v === 'number' ? v.toLocaleString() : v);
const query = (def, f, columns) => {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(f)) if (v !== '') q.set(k, v);
  if (def.filters.includes('columns')) q.set('columns', columns.join(','));
  return q.toString();
};
const stamp = (iso) => new Date(iso).toLocaleString('en-PH', { timeZone: 'Asia/Manila', month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });

function Bars({ rows, chart }) {
  const data = rows.filter((r) => r[chart.key] !== null && r[chart.key] !== undefined).slice(0, 20);
  if (!data.length) return null;
  const max = Math.max(...data.map((r) => r[chart.key]), chart.key.endsWith('Rate') ? 100 : 0) || 1;
  return (
    <figure className="rp-chart" aria-label={chart.label}>
      <figcaption>{chart.label}</figcaption>
      {data.map((r) => (
        <div key={r[chart.by]} className="rp-chart__row">
          <span>{r[chart.by]}</span>
          <div><i style={{ width: `${(r[chart.key] / max) * 100}%` }} /></div>
          <b>{fmt(r[chart.key], chart.key.endsWith('Rate') || chart.key === 'percent' ? 'percent' : 'number')}</b>
        </div>
      ))}
    </figure>
  );
}

// The printable report.
function Paper({ report, logo }) {
  return (
    <article className="rp-paper">
      <header className="rp-paper__head">
        {logo && <img src={logo} alt="" />}
        <div>
          <span>Manila Central University · Alumni Relations Office</span>
          <h2>{report.title}</h2>
          <p>{report.subtitle}</p>
        </div>
      </header>
      {report.summary && <p className="rp-paper__summary">{report.summary}</p>}

      {report.chart && report.rows?.length > 1 && <Bars rows={report.rows} chart={report.chart} />}

      {report.sections ? (
        <div className="rp-sections">
          {report.sections.map((s) => (
            <section key={s.title} className="rp-section">
              <h3>{s.title} <small>n = {s.base.toLocaleString()}</small></h3>
              <table className="rp-table">
                <tbody>
                  {s.rows.map((r) => (
                    <tr key={r.label}>
                      <td>{r.label}</td>
                      <td className="rp-bar"><i style={{ width: `${r.percent || 0}%` }} /></td>
                      <td className="num">{r.count.toLocaleString()}</td>
                      <td className="num">{fmt(r.percent, 'percent')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          ))}
        </div>
      ) : report.rows.length ? (
        <div className="rp-table-wrap">
          <table className="rp-table">
            <thead>
              <tr>{report.columns.map((c) => <th key={c.key} className={c.type !== 'text' ? 'num' : ''}>{c.label}</th>)}</tr>
            </thead>
            <tbody>
              {report.rows.map((r, i) => (
                <tr key={i}>{report.columns.map((c) => <td key={c.key} className={c.type !== 'text' ? 'num' : ''}>{fmt(r[c.key], c.type)}</td>)}</tr>
              ))}
            </tbody>
            {report.total && (
              <tfoot>
                <tr>{report.columns.map((c) => <td key={c.key} className={c.type !== 'text' ? 'num' : ''}>{fmt(report.total[c.key], c.type)}</td>)}</tr>
              </tfoot>
            )}
          </table>
        </div>
      ) : (
        <p className="rp-empty">No records match these filters.</p>
      )}

      {report.notes?.length > 0 && (
        <ul className="rp-notes">{report.notes.map((n) => <li key={n}>{n}</li>)}</ul>
      )}

      <footer className="rp-paper__foot">
        <p>Generated {stamp(report.generatedAt)} by {report.generatedBy} from the MCU Alumni database.{report.personal ? ' Contains personal information: handle under the Data Privacy Act of 2012.' : ''}</p>
        <div className="rp-sign">
          <div><span>Prepared by</span><strong>{report.generatedBy}</strong><small>Alumni Relations Office</small></div>
          <div><span>Noted by</span><strong>&nbsp;</strong><small>Director, Alumni Relations Office</small></div>
        </div>
      </footer>
    </article>
  );
}

export default function AlumniReports() {
  const notify = useToast();
  const site = useContent('site');
  const formOptions = useContent('form-options'); // sexes, industries, job levels
  const [type, setType] = useState('graduates');
  const [filters, setFilters] = useState(EMPTY);
  const [columns, setColumns] = useState(DEFAULT_COLUMNS);
  const [options, setOptions] = useState({ programs: [], years: [], regions: [], events: [] });
  const [report, setReport] = useState(null);
  const [busy, setBusy] = useState(null);
  const def = REPORTS.find((r) => r.key === type);
  const groupBy = def.filters.find((f) => f.startsWith('groupBy:'))?.split(':')[1].split(',');

  useEffect(() => {
    adminApi.fetch('/profiles/overview').then((o) => setOptions((s) => ({ ...s, programs: o.programs, years: o.years }))).catch(() => {});
    getPsgc('/regions').then((regions) => setOptions((s) => ({ ...s, regions }))).catch(() => {});
    adminApi.list('/events', { limit: 100 }).then((r) => setOptions((s) => ({ ...s, events: r.data.filter((e) => e.portalRegistration) }))).catch(() => {});
  }, []);

  const pick = (key) => {
    setType(key);
    setReport(null);
    setFilters((f) => ({ ...f, groupBy: '', eventId: '' }));
  };
  const set = (k) => (e) => setFilters((f) => ({ ...f, [k]: e.target.value }));
  const relevant = useMemo(() => {
    const keep = { program: def.filters.includes('program'), years: def.filters.includes('years'), region: def.filters.includes('region'), location: def.filters.includes('location') };
    return {
      ...(keep.program && { program: filters.program }),
      ...(keep.years && { yearFrom: filters.yearFrom, yearTo: filters.yearTo }),
      ...(keep.region && { regionCode: filters.regionCode }),
      ...(keep.location && { location: filters.location }),
      ...(def.filters.includes('sex') && { sex: filters.sex }),
      ...(def.filters.includes('work') && { employment: filters.employment, industry: filters.industry, jobLevel: filters.jobLevel }),
      ...(groupBy && { groupBy: filters.groupBy || groupBy[0] }),
      ...(def.filters.includes('event') && { eventId: filters.eventId }),
      ...(def.filters.includes('dates') && !filters.eventId && { dateFrom: filters.dateFrom, dateTo: filters.dateTo }),
    };
  }, [def, filters, groupBy]);

  const generate = async (e) => {
    e?.preventDefault();
    if (def.filters.includes('columns') && !columns.length) return notify('Choose at least one column.', 'error');
    setBusy('generate');
    try {
      setReport(await adminApi.fetch(`/alumni-reports/${type}?${query(def, relevant, columns)}`));
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setBusy(null);
    }
  };

  const exportExcel = async () => {
    setBusy('export');
    try {
      const { blob, fileName } = await authDownload(`/alumni-reports/${type}/export?${query(def, relevant, columns)}`);
      saveBlob(blob, fileName);
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setBusy(null);
    }
  };

  // Print only the report paper (see reports.css); the class is removed again after the print dialog.
  const printReport = () => {
    const done = () => {
      document.body.classList.remove('rp-printing');
      window.removeEventListener('afterprint', done);
    };
    document.body.classList.add('rp-printing');
    window.addEventListener('afterprint', done);
    window.print();
  };

  const years = options.years.length ? options.years : [new Date().getFullYear()];

  return (
    <div className="rp">
      <PageHeader title="Alumni reports" description="Generate reports from the alumni database for accreditation, the tracer study and the Alumni Relations Office: choose a report, set the filters, then export to Excel or print / save as PDF." />

      <div className="rp-picker" role="tablist" aria-label="Reports">
        {REPORTS.map((r) => (
          <button key={r.key} type="button" role="tab" aria-selected={type === r.key} className={`rp-pick${type === r.key ? ' is-active' : ''}`} onClick={() => pick(r.key)}>
            <span className="rp-pick__icon"><Icon name={r.icon} size={18} /></span>
            <span className="rp-pick__body">
              <strong>{r.title}</strong>
              <small>{r.text}</small>
            </span>
            {r.tag && <em>{r.tag}</em>}
          </button>
        ))}
      </div>

      <form className="admin-card rp-filters" onSubmit={generate}>
        <div className="admin-toolbar">
          {def.filters.includes('program') && (
            <label className="admin-filter">
              <span>Program</span>
              <select value={filters.program} onChange={set('program')}>
                <option value="">All programs</option>
                {options.programs.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </label>
          )}
          {def.filters.includes('years') && (
            <>
              <label className="admin-filter">
                <span>Batch from</span>
                <select value={filters.yearFrom} onChange={set('yearFrom')}>
                  <option value="">Earliest</option>
                  {years.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </label>
              <label className="admin-filter">
                <span>to</span>
                <select value={filters.yearTo} onChange={set('yearTo')}>
                  <option value="">Latest</option>
                  {years.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </label>
            </>
          )}
          {def.filters.includes('region') && (
            <label className="admin-filter">
              <span>Region</span>
              <select value={filters.regionCode} onChange={set('regionCode')}>
                <option value="">Any region</option>
                {options.regions.map((r) => <option key={r.code} value={r.code}>{r.name}</option>)}
              </select>
            </label>
          )}
          {def.filters.includes('location') && (
            <label className="admin-filter">
              <span>Location contains</span>
              <input type="search" placeholder="City, province…" value={filters.location} onChange={set('location')} />
            </label>
          )}
          {def.filters.includes('sex') && (
            <label className="admin-filter">
              <span>Gender</span>
              <select value={filters.sex} onChange={set('sex')}>
                <option value="">Any</option>
                {(formOptions.data?.sexes || []).map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </label>
          )}
          {def.filters.includes('work') && (
            <>
              <label className="admin-filter">
                <span>Employment status</span>
                <select value={filters.employment} onChange={set('employment')}>
                  <option value="">Any</option>
                  <option value="employed">Employed (has a current job)</option>
                  <option value="none">No current job on record</option>
                </select>
              </label>
              <label className="admin-filter">
                <span>Industry</span>
                <select value={filters.industry} onChange={set('industry')}>
                  <option value="">Any industry</option>
                  {(formOptions.data?.industries || []).map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              </label>
              <label className="admin-filter">
                <span>Job level</span>
                <select value={filters.jobLevel} onChange={set('jobLevel')}>
                  <option value="">Any level</option>
                  {(formOptions.data?.jobCategories || []).map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              </label>
            </>
          )}
          {groupBy && (
            <label className="admin-filter">
              <span>Group by</span>
              <select value={filters.groupBy || groupBy[0]} onChange={set('groupBy')}>
                {groupBy.map((g) => <option key={g} value={g}>{GROUP_LABELS[g]}</option>)}
              </select>
            </label>
          )}
          {def.filters.includes('event') && (
            <label className="admin-filter">
              <span>Event</span>
              <select value={filters.eventId} onChange={set('eventId')}>
                <option value="">All events (summary)</option>
                {options.events.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}
              </select>
            </label>
          )}
          {def.filters.includes('dates') && !filters.eventId && (
            <>
              <label className="admin-filter"><span>Events from</span><input type="date" value={filters.dateFrom} onChange={set('dateFrom')} /></label>
              <label className="admin-filter"><span>to</span><input type="date" value={filters.dateTo} onChange={set('dateTo')} /></label>
            </>
          )}
          <button type="submit" className="btn btn-primary rp-generate" disabled={busy === 'generate'}>
            <Icon name="file" size={16} /> {busy === 'generate' ? 'Generating…' : 'Generate report'}
          </button>
        </div>
        {def.filters.includes('columns') && (
          <fieldset className="rp-columns">
            <legend>Columns</legend>
            {GRADUATE_COLUMNS.map(([k, label]) => (
              <label key={k} className={columns.includes(k) ? 'is-on' : ''}>
                <input type="checkbox" checked={columns.includes(k)} onChange={(e) => setColumns((c) => (e.target.checked ? GRADUATE_COLUMNS.map(([x]) => x).filter((x) => x === k || c.includes(x)) : c.filter((x) => x !== k)))} />
                {label}
              </label>
            ))}
          </fieldset>
        )}
      </form>

      {report ? (
        <>
          <div className="rp-actions">
            <span className="muted">{report.summary}</span>
            <span className="rp-actions__spacer" />
            <button type="button" className="btn btn-sm admin-btn-ghost" onClick={exportExcel} disabled={busy === 'export'}>
              <Icon name="download" size={14} /> {busy === 'export' ? 'Exporting…' : 'Export to Excel'}
            </button>
            <button type="button" className="btn btn-sm btn-primary" onClick={printReport}>
              <Icon name="file" size={14} /> Print / Save PDF
            </button>
          </div>
          <Paper report={report} logo={site.data?.logo ? assetUrl(site.data.logo) : null} />
        </>
      ) : (
        <div className="admin-card rp-placeholder">
          <span><Icon name={def.icon} size={26} /></span>
          <strong>{def.title}</strong>
          <p className="muted">{def.text} Set the filters above, then click Generate report.</p>
        </div>
      )}
    </div>
  );
}
