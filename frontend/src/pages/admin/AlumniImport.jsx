import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/admin/PageHeader.jsx';
import Modal from '../../components/admin/Modal.jsx';
import Badge from '../../components/admin/Badge.jsx';
import InviteDialog from '../../components/admin/InviteDialog.jsx';
import { formatDateTime } from '../../components/admin/format.js';
import { useToast } from '../../components/admin/Toast.jsx';
import Icon from '../../components/ui/Icon.jsx';
import { adminApi } from '../../api/admin.js';
import { authDownload, authRequest, saveBlob } from '../../api/client.js';
import '../../styles/import.css';

// Step 5: Alumni Database Migration. Upload the Registrar/EAO spreadsheet (CSV), review what will happen to
// each row, then import. Imported graduates get verified profiles with Alumni Numbers; when they register on
// the Alumni Portal with the same Student No., verification links them to that record.

const TEMPLATE_COLUMNS = ['Year', 'Course', 'Surname', 'Given Name', 'Middle Name', 'Maiden Name', 'Contact No.', 'Email Address', 'Home Address', 'Birthdate', 'Gender', 'Civil Status', 'Nationality', 'Employment Status', 'Company Name', 'Position', 'Student No.'];
const TEMPLATE_EXAMPLE = ['2025', 'BSN', 'Dela Cruz', 'Juan Carlo', 'Santos', '', '09171234567', 'juan.delacruz@gmail.com', '123 Rizal St., Brgy. 1, Caloocan City', '01/31/2003', 'Male', 'Single', 'Filipino', 'Employed', 'MCU Hospital', 'Staff Nurse', '2021-10001C'];

const MODES = [
  { value: 'fill', title: 'Fill in missing details', text: 'Graduates already in the database keep everything they have; only their empty fields are filled from the file.', recommended: true },
  { value: 'skip', title: 'Skip existing records', text: 'Only graduates who are not in the database yet are added. Existing records are not touched.' },
];

const STATUS = {
  new: { label: 'New', tone: 'success' },
  update: { label: 'Fill in', tone: 'info' },
  unchanged: { label: 'Already in database', tone: 'neutral' },
  skip: { label: 'Skipped', tone: 'danger' },
};
const FILTERS = [
  { key: 'all', label: 'All rows' },
  { key: 'new', label: 'New' },
  { key: 'update', label: 'Fill in' },
  { key: 'skip', label: 'Skipped' },
  { key: 'warnings', label: 'Needs attention' },
  { key: 'unchanged', label: 'Already in database' },
];
const PAGE = 50;

const csvCell = (v) => {
  const s = v === null || v === undefined ? '' : String(v);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const toCsv = (rows) => `﻿${rows.map((r) => r.map(csvCell).join(',')).join('\r\n')}\r\n`;
const csvBlob = (rows) => new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8' });

// Rows with problems as a spreadsheet, so EAO can fix the source file or follow up with alumni.
function downloadIssues(rows, fileName) {
  const issues = rows.filter((r) => r.errors.length || r.warnings.length);
  const lines = [['Row', 'Student No.', 'Name', 'Result', 'Errors', 'Warnings'], ...issues.map((r) => [r.line, r.studentNumber, r.name, STATUS[r.status]?.label, r.errors.join('; '), r.warnings.join('; ')])];
  saveBlob(csvBlob(lines), `${fileName.replace(/\.csv$/i, '')} - issues.csv`);
}

const send = (path, file, mode) => {
  const form = new FormData();
  form.append('mode', mode);
  form.append('file', file);
  return authRequest(path, { method: 'POST', body: form });
};

function Steps({ step }) {
  const steps = ['Upload the file', 'Review the rows', 'Import'];
  return (
    <ol className="im-steps" aria-label="Import steps">
      {steps.map((label, i) => (
        <li key={label} className={i < step ? 'is-done' : i === step ? 'is-current' : ''} aria-current={i === step ? 'step' : undefined}>
          <span>{i < step ? <Icon name="check" size={14} /> : i + 1}</span>
          {label}
        </li>
      ))}
    </ol>
  );
}

function Tile({ value, label, tone, hint }) {
  return (
    <div className={`im-tile im-tile--${tone}`}>
      <strong>{value.toLocaleString()}</strong>
      <span>{label}</span>
      {hint && <small>{hint}</small>}
    </div>
  );
}

// The rows of a preview or a saved report, with filters and paging.
function RowTable({ rows, initialFilter = 'all' }) {
  const [filter, setFilter] = useState(initialFilter);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const counts = useMemo(
    () => ({
      all: rows.length,
      warnings: rows.filter((r) => r.status !== 'skip' && r.warnings.length).length,
      ...Object.fromEntries(Object.keys(STATUS).map((s) => [s, rows.filter((r) => r.status === s).length])),
    }),
    [rows]
  );
  const shown = useMemo(() => {
    const term = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (filter === 'warnings' ? !(r.status !== 'skip' && r.warnings.length) : filter !== 'all' && r.status !== filter) return false;
      return !term || `${r.studentNumber} ${r.name} ${r.program} ${r.email}`.toLowerCase().includes(term);
    });
  }, [rows, filter, q]);
  useEffect(() => setPage(1), [filter, q]);
  const pages = Math.max(1, Math.ceil(shown.length / PAGE));
  const slice = shown.slice((page - 1) * PAGE, page * PAGE);

  return (
    <>
      <div className="im-filters">
        <div className="im-tabs" role="tablist" aria-label="Filter rows">
          {FILTERS.filter((f) => f.key === 'all' || counts[f.key]).map((f) => (
            <button key={f.key} type="button" role="tab" aria-selected={filter === f.key} className={filter === f.key ? 'is-active' : ''} onClick={() => setFilter(f.key)}>
              {f.label} <span>{counts[f.key]}</span>
            </button>
          ))}
        </div>
        <label className="search im-search">
          <Icon name="search" size={16} />
          <input type="search" placeholder="Search name or student no." value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search rows" />
        </label>
      </div>

      <div className="im-table-wrap">
        <table className="im-table">
          <thead>
            <tr>
              <th className="num">Row</th>
              <th>Graduate</th>
              <th>Result</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {slice.map((r) => (
              <tr key={r.line}>
                <td className="num muted">{r.line}</td>
                <td>
                  <strong>{r.name || <span className="muted">No name</span>}</strong>
                  <span className="im-sub">{[r.studentNumber, r.program, r.yearGraduated].filter(Boolean).join(' · ')}</span>
                </td>
                <td>
                  <Badge value={r.status} tone={STATUS[r.status]?.tone} label={STATUS[r.status]?.label} />
                  {r.match?.alumniNumber && r.status !== 'skip' && <span className="im-sub">{r.match.alumniNumber}</span>}
                </td>
                <td>
                  {!r.errors.length && !r.warnings.length && !r.fills.length && <span className="muted">—</span>}
                  {r.fills.length > 0 && <p className="im-note im-note--fill"><Icon name="plus" size={13} /> Fills in: {r.fills.join(', ')}</p>}
                  {r.errors.map((e) => <p key={e} className="im-note im-note--error"><Icon name="close" size={13} /> {e}</p>)}
                  {r.warnings.map((w) => <p key={w} className="im-note im-note--warn"><Icon name="alert" size={13} /> {w}</p>)}
                </td>
              </tr>
            ))}
            {!slice.length && (
              <tr>
                <td colSpan={4} className="im-empty">No rows match.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {pages > 1 && (
        <div className="im-pager">
          <button type="button" className="btn btn-sm admin-btn-ghost" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
          <span className="muted">Page {page} of {pages} · {shown.length.toLocaleString()} rows</span>
          <button type="button" className="btn btn-sm admin-btn-ghost" disabled={page === pages} onClick={() => setPage((p) => p + 1)}>Next</button>
        </div>
      )}
    </>
  );
}

// How far an import's graduates are in activating their portal accounts.
function Rollout({ summary }) {
  if (!summary?.total) return null;
  const pct = (n) => `${(n / summary.total) * 100}%`;
  return (
    <div className="im-rollout">
      <div className="im-rollout__bar" aria-hidden="true">
        <span className="is-claimed" style={{ width: pct(summary.claimed) }} />
        <span className="is-invited" style={{ width: pct(summary.invited + summary.expired) }} />
      </div>
      <span className="im-sub">
        Portal: <b>{summary.claimed.toLocaleString()} activated</b> · {(summary.invited + summary.expired).toLocaleString()} invited · {summary.not_invited.toLocaleString()} not invited
        {summary.no_email ? ` · ${summary.no_email.toLocaleString()} no email` : ''}
      </span>
    </div>
  );
}

function History({ version, onUndone, onInvite }) {
  const notify = useToast();
  const [batches, setBatches] = useState(null);
  const [rollout, setRollout] = useState({});
  const [report, setReport] = useState(null);
  const [undoing, setUndoing] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    adminApi
      .fetch('/imports')
      .then((list) => {
        setBatches(list);
        for (const b of list.filter((x) => !x.undoneAt)) {
          adminApi.fetch('/profiles/invitations/summary', { importBatchId: b.id }).then((s) => setRollout((r) => ({ ...r, [b.id]: s }))).catch(() => {});
        }
      })
      .catch(() => setBatches([]));
  }, [version]);

  const openReport = async (b) => {
    try {
      setReport(await adminApi.fetch(`/imports/${b.id}`));
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const undo = async () => {
    setBusy(true);
    try {
      const res = await adminApi.send(`/imports/${undoing.id}/undo`, 'POST');
      notify(res.message);
      setUndoing(null);
      onUndone();
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  if (!batches?.length) return null;
  const reportRows = report?.report?.rows || [];

  return (
    <section className="admin-card">
      <div className="admin-card__head">
        <h2>Import history</h2>
        <p className="muted">Every imported file, who imported it and what happened. An import can be undone.</p>
      </div>
      <ul className="im-history">
        {batches.map((b) => (
          <li key={b.id} className={b.undoneAt ? 'is-undone' : ''}>
            <span className="im-history__icon"><Icon name="file" size={18} /></span>
            <div className="im-history__main">
              <strong>{b.fileName}</strong>
              <span className="im-sub">{formatDateTime(b.createdAt)} · {b.importedByName || 'Staff'} · {b.mode === 'fill' ? 'filled in missing details' : 'skipped existing records'}</span>
              <div className="im-history__counts">
                <Badge value="new" tone="success" label={`${b.createdCount} new`} />
                {b.updatedCount > 0 && <Badge value="update" tone="info" label={`${b.updatedCount} filled in`} />}
                {b.skippedCount > 0 && <Badge value="skip" tone="danger" label={`${b.skippedCount} skipped`} />}
                {b.warningCount > 0 && <Badge value="warn" tone="warning" label={`${b.warningCount} need attention`} />}
                {b.undoneAt && <Badge value="undone" tone="neutral" label={`Undone ${formatDateTime(b.undoneAt)}`} />}
              </div>
              {!b.undoneAt && <Rollout summary={rollout[b.id]} />}
            </div>
            <div className="im-history__actions">
              {!b.undoneAt && (
                <button type="button" className="btn btn-sm btn-primary" onClick={() => onInvite(b)}>
                  <Icon name="mail" size={14} /> Invite to portal
                </button>
              )}
              {!b.undoneAt && <Link className="btn btn-sm admin-btn-ghost" to={`/admin/profiles?batch=${b.id}`}>View records</Link>}
              <button type="button" className="btn btn-sm admin-btn-ghost" onClick={() => openReport(b)}>Report</button>
              {!b.undoneAt && <button type="button" className="btn btn-sm btn-danger-ghost" onClick={() => setUndoing(b)}><Icon name="undo" size={14} /> Undo</button>}
            </div>
          </li>
        ))}
      </ul>

      <Modal
        open={Boolean(report)}
        size="lg"
        title={report ? `Report: ${report.fileName}` : ''}
        subtitle="Rows that were skipped, filled in or need attention. Rows imported without issues are not listed."
        onClose={() => setReport(null)}
        footer={
          <>
            {reportRows.some((r) => r.errors.length || r.warnings.length) && (
              <button type="button" className="btn btn-sm admin-btn-ghost" onClick={() => downloadIssues(reportRows, report.fileName)}><Icon name="download" size={14} /> Download issues</button>
            )}
            <span className="modal__foot-spacer" />
            <button type="button" className="btn btn-sm btn-primary" onClick={() => setReport(null)}>Close</button>
          </>
        }
      >
        {report && (reportRows.length ? <RowTable rows={reportRows} /> : <p className="muted">Every row was imported without issues.</p>)}
      </Modal>

      <Modal
        open={Boolean(undoing)}
        size="sm"
        title="Undo this import?"
        onClose={() => !busy && setUndoing(null)}
        footer={
          <>
            <button type="button" className="btn btn-sm admin-btn-ghost" onClick={() => setUndoing(null)} disabled={busy}>Cancel</button>
            <button type="button" className="btn btn-sm btn-danger" onClick={undo} disabled={busy}>{busy ? 'Undoing…' : 'Undo import'}</button>
          </>
        }
      >
        {undoing && (
          <p className="muted">
            The {undoing.createdCount} records created from <strong>{undoing.fileName}</strong> will be removed, and the details it filled in will be emptied again.
            Records an alumnus has already claimed through the portal, or that staff edited since, are kept.
          </p>
        )}
      </Modal>
    </section>
  );
}

export default function AlumniImport() {
  const notify = useToast();
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [mode, setMode] = useState('fill');
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(null); // 'preview' | 'import' | 'export'
  const [error, setError] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [version, setVersion] = useState(0);
  const [inviting, setInviting] = useState(null); // import batch whose graduates are being invited

  const reset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const check = useCallback(
    async (f = file, m = mode) => {
      if (!f) return;
      setBusy('preview');
      setError(null);
      try {
        setPreview((await send('/imports/preview', f, m)).data);
      } catch (err) {
        setPreview(null);
        setError(err.message);
      } finally {
        setBusy(null);
      }
    },
    [file, mode]
  );

  const choose = (f) => {
    if (!f) return;
    setFile(f);
    setResult(null);
    check(f, mode);
  };

  const changeMode = (m) => {
    setMode(m);
    if (file) check(file, m);
  };

  const runImport = async () => {
    setBusy('import');
    try {
      const res = await send('/imports', file, mode);
      setResult(res.data);
      setPreview(null);
      setVersion((v) => v + 1);
      notify(res.message);
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setBusy(null);
    }
  };

  const exportAll = async () => {
    setBusy('export');
    try {
      const { blob, fileName } = await authDownload('/imports/export');
      saveBlob(blob, fileName);
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setBusy(null);
    }
  };

  const s = preview?.summary;
  const step = result ? 3 : preview ? 1 : 0;
  const toImport = s ? s.new + s.update : 0;

  return (
    <>
      <PageHeader
        title="Import alumni records"
        description="Move the Registrar's and EAO's spreadsheets into the alumni database. Check the preview first: nothing is saved until you click Import."
        actions={
          <>
            <button type="button" className="btn btn-sm admin-btn-ghost" onClick={() => saveBlob(csvBlob([TEMPLATE_COLUMNS, TEMPLATE_EXAMPLE]), 'mcu-alumni-import-template.csv')}>
              <Icon name="file" size={14} /> Template
            </button>
            <button type="button" className="btn btn-sm admin-btn-ghost" onClick={exportAll} disabled={busy === 'export'}>
              <Icon name="download" size={14} /> {busy === 'export' ? 'Exporting…' : 'Export all profiles'}
            </button>
          </>
        }
      />

      <Steps step={step} />

      {result ? (
        <section className="admin-card im-done">
          <span className="im-done__icon"><Icon name="check" size={28} /></span>
          <div>
            <h2>{result.createdCount.toLocaleString()} graduates added to the alumni database</h2>
            <p className="muted">
              {result.fileName}
              {result.updatedCount > 0 && ` · ${result.updatedCount} existing records filled in`}
              {result.skippedCount > 0 && ` · ${result.skippedCount} rows skipped`}
              . Each new record has an Alumni Number. Next, invite them to the Alumni Portal: each graduate gets an email link to set a password, and their profile is already filled in.
            </p>
            <div className="im-done__actions">
              <button type="button" className="btn btn-primary btn-sm" onClick={() => setInviting(result)}>
                <Icon name="mail" size={14} /> Send portal invitations
              </button>
              <Link className="btn btn-sm admin-btn-ghost" to={`/admin/profiles?batch=${result.id}`}>View imported records</Link>
              <button type="button" className="btn btn-sm admin-btn-ghost" onClick={reset}>Import another file</button>
            </div>
          </div>
        </section>
      ) : (
        <section className="admin-card">
          {!preview && (
            <>
              <label
                className={`im-drop${dragging ? ' is-dragging' : ''}${busy === 'preview' ? ' is-busy' : ''}`}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => { e.preventDefault(); setDragging(false); choose(e.dataTransfer.files?.[0]); }}
              >
                <input ref={inputRef} type="file" accept=".csv,text/csv" onChange={(e) => choose(e.target.files?.[0])} />
                <span className="im-drop__icon"><Icon name="upload" size={26} /></span>
                <strong>{busy === 'preview' ? `Checking ${file?.name}…` : 'Drop the CSV file here, or click to choose'}</strong>
                <span className="muted">In Excel: File › Save As › <b>CSV UTF-8</b>. Up to 20,000 rows and 10 MB.</span>
              </label>
              {error && <p className="im-error" role="alert"><Icon name="alert" size={16} /> {error}</p>}
              <details className="im-help">
                <summary>Which columns does the file need?</summary>
                <p>
                  Required: <b>Student No.</b>, <b>Surname</b>, <b>Given Name</b>, <b>Course</b> and <b>Year</b>. Also read when present: Middle Name, Maiden Name, Contact No., Email Address,
                  Home Address, Birthdate (MM/DD/YYYY), Gender, Civil Status, Nationality, Employment Status, Company Name and Position. Download the template for the exact layout.
                </p>
                <p>
                  The file is cleaned automatically: course codes become program names (BS-MT → BS Medical Technology), contact numbers get their leading 0 back, names typed in CAPS are
                  corrected, suffixes like Jr. or III move to their own field, and broken characters such as Ã± become ñ.
                </p>
              </details>
            </>
          )}

          {preview && (
            <>
              <div className="im-file">
                <span className="im-file__icon"><Icon name="file" size={20} /></span>
                <div>
                  <strong>{preview.fileName}</strong>
                  <span className="im-sub">{s.total.toLocaleString()} rows read</span>
                </div>
                <button type="button" className="btn btn-sm admin-btn-ghost" onClick={reset} disabled={busy === 'import'}>Choose another file</button>
              </div>

              <fieldset className="im-modes" disabled={busy === 'import'}>
                <legend>Graduates already in the database</legend>
                {MODES.map((m) => (
                  <label key={m.value} className={mode === m.value ? 'is-selected' : ''}>
                    <input type="radio" name="mode" value={m.value} checked={mode === m.value} onChange={() => changeMode(m.value)} />
                    <span>
                      <strong>{m.title}{m.recommended && <em>Recommended</em>}</strong>
                      <small>{m.text}</small>
                    </span>
                  </label>
                ))}
              </fieldset>

              <div className={`im-tiles${busy === 'preview' ? ' is-busy' : ''}`}>
                <Tile value={s.new} label="New graduates" tone="new" hint="will be added" />
                <Tile value={s.update} label="Fill in" tone="update" hint="existing, empty fields" />
                <Tile value={s.unchanged} label="Already in database" tone="same" hint="no change" />
                <Tile value={s.skipped} label="Skipped" tone="skip" hint="errors, see below" />
                <Tile value={s.withWarnings} label="Need attention" tone="warn" hint="imported, check later" />
              </div>

              {preview.unknownColumns?.length > 0 && (
                <p className="im-note im-note--warn im-unknown"><Icon name="alert" size={14} /> These columns are not used: {preview.unknownColumns.join(', ')}</p>
              )}

              <RowTable key={`${preview.fileName}-${mode}`} rows={preview.rows} initialFilter={s.skipped ? 'skip' : s.withWarnings ? 'warnings' : 'all'} />

              <div className="im-bar">
                <button type="button" className="btn btn-sm admin-btn-ghost" onClick={() => downloadIssues(preview.rows, preview.fileName)} disabled={!s.skipped && !s.withWarnings}>
                  <Icon name="download" size={14} /> Download issues
                </button>
                <span className="im-bar__spacer" />
                <span className="muted im-bar__text">
                  {toImport ? `${s.new.toLocaleString()} new${s.update ? ` and ${s.update.toLocaleString()} filled in` : ''}` : 'Nothing to import'}
                </span>
                <button type="button" className="btn btn-primary" onClick={runImport} disabled={!toImport || busy}>
                  {busy === 'import' ? 'Importing…' : `Import ${toImport.toLocaleString()} record${toImport === 1 ? '' : 's'}`}
                </button>
              </div>
            </>
          )}
        </section>
      )}

      <History version={version} onUndone={() => setVersion((v) => v + 1)} onInvite={setInviting} />

      <InviteDialog
        open={Boolean(inviting)}
        scope={inviting ? { importBatchId: inviting.id } : null}
        title={inviting ? `Invite graduates from ${inviting.fileName}` : ''}
        onClose={() => setInviting(null)}
        onSent={() => setVersion((v) => v + 1)}
      />
    </>
  );
}
