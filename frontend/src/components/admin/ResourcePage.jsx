import { useCallback, useEffect, useRef, useState } from 'react';
import Icon from '../ui/Icon.jsx';
import PageHeader from './PageHeader.jsx';
import DataTable from './DataTable.jsx';
import Pagination from './Pagination.jsx';
import Modal, { ConfirmDialog } from './Modal.jsx';
import ResourceForm, { valuesFromRow, payloadFromValues } from './ResourceForm.jsx';
import { useToast } from './Toast.jsx';
import { adminApi } from '../../api/admin.js';

function useDebounced(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/**
 * A complete list + detail + create/edit/delete screen for one API resource.
 *
 * - endpoint:  "/scholars"
 * - columns:   table columns (see DataTable)
 * - filters:   [{ name, label, type: 'select'|'date', options }]
 * - fields:    form fields for create/edit (see ResourceForm); omit for read-only
 * - details:   [{ key, label, render? }] shown when opening a record
 * - canCreate / canEdit / canDelete: booleans (default true when the resource supports it)
 */
export default function ResourcePage({
  title,
  description,
  endpoint,
  columns,
  filters = [],
  searchPlaceholder = 'Search...',
  fields,
  details,
  initialValues = {},
  canCreate = Boolean(fields),
  canEdit = Boolean(fields),
  canDelete,
  entityLabel = 'record',
  rowTitle = (row) => row.title || row.name || `#${row.id}`,
  onOpen,
  headerExtra,
  pageSize = 20,
  refreshKey, // change to reload the table from outside (e.g. after approving a request)
}) {
  const notify = useToast();
  const allowDelete = canDelete ?? true; // both dashboard roles may delete; routes enforce it

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounced(search);
  const [filterValues, setFilterValues] = useState({});
  const [page, setPage] = useState(1);
  const [result, setResult] = useState({ rows: [], meta: null });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [editing, setEditing] = useState(null); // { row|null, isNew }
  const [values, setValues] = useState({});
  const [files, setFiles] = useState({});
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Only the latest request may update the table (older, slower responses are ignored).
  const requestId = useRef(0);
  const load = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    setLoadError(null);
    try {
      const res = await adminApi.list(endpoint, { page, limit: pageSize, search: debouncedSearch, ...filterValues });
      if (id === requestId.current) setResult({ rows: res.data, meta: res.meta });
    } catch (err) {
      if (id === requestId.current) setLoadError(err.message);
    } finally {
      if (id === requestId.current) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint, page, pageSize, debouncedSearch, filterValues, refreshKey]);

  useEffect(() => {
    load();
  }, [load]);

  // New search or filters start again from page 1.
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    setPage(1);
  }, [debouncedSearch, filterValues]);

  const open = async (row) => {
    setErrors({});
    setFiles({});
    if (!row) {
      setValues(valuesFromRow(fields, {}, initialValues));
      setEditing({ row: null, isNew: true });
      return;
    }
    setValues(fields ? valuesFromRow(fields, row) : {});
    setEditing({ row, isNew: false });
    if (onOpen) {
      const updated = await onOpen(row).catch(() => null);
      if (updated) {
        const merged = { ...row, ...updated };
        setEditing({ row: merged, isNew: false });
        if (fields) setValues(valuesFromRow(fields, merged));
        load();
      }
    }
  };

  const close = () => !saving && setEditing(null);

  const save = async (e) => {
    e?.preventDefault();
    setSaving(true);
    setErrors({});
    const { data, uploads } = payloadFromValues(fields, values, files);
    try {
      if (editing.isNew) await adminApi.create(endpoint, data, uploads);
      else await adminApi.update(endpoint, editing.row.id, data, uploads);
      notify(`${entityLabel.charAt(0).toUpperCase() + entityLabel.slice(1)} ${editing.isNew ? 'created' : 'saved'}`);
      setEditing(null);
      load();
    } catch (err) {
      setErrors(err.fields || {});
      notify(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setDeleting(true);
    try {
      await adminApi.remove(endpoint, confirming.id);
      notify(`${rowTitle(confirming)} deleted`);
      setConfirming(null);
      setEditing(null);
      if (result.rows.length === 1 && page > 1) setPage(page - 1);
      else load();
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setDeleting(false);
    }
  };

  const showForm = fields && editing && (editing.isNew || canEdit);
  const readOnlyView = editing && !showForm;

  return (
    <>
      <PageHeader
        title={title}
        description={description}
        actions={
          canCreate && (
            <button type="button" className="btn btn-primary btn-sm" onClick={() => open(null)}>
              <Icon name="plus" size={16} /> Add {entityLabel}
            </button>
          )
        }
      />

      {headerExtra}

      <div className="admin-card">
        <div className="admin-toolbar">
          <label className="search">
            <Icon name="search" size={18} />
            <input type="search" placeholder={searchPlaceholder} value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search" />
          </label>
          {filters.map((f) => (
            <label key={f.name} className="admin-filter">
              <span>{f.label}</span>
              {f.type === 'date' ? (
                <input
                  type="date"
                  value={filterValues[f.name] || ''}
                  onChange={(e) => setFilterValues((v) => ({ ...v, [f.name]: e.target.value }))}
                />
              ) : (
                <select value={filterValues[f.name] ?? ''} onChange={(e) => setFilterValues((v) => ({ ...v, [f.name]: e.target.value }))}>
                  <option value="">All</option>
                  {(f.options || []).map((o) => (
                    <option key={String(o.value)} value={o.value}>{o.label}</option>
                  ))}
                </select>
              )}
            </label>
          ))}
          {(search || Object.values(filterValues).some(Boolean)) && (
            <button type="button" className="link-btn" onClick={() => { setSearch(''); setFilterValues({}); }}>
              Clear filters
            </button>
          )}
        </div>

        {loadError ? (
          <div className="alert alert--error" role="alert">
            {loadError} <button type="button" className="link-btn" onClick={load}>Try again</button>
          </div>
        ) : (
          <DataTable columns={columns} rows={result.rows} loading={loading} onRowClick={open} />
        )}
        <Pagination meta={result.meta} onPage={setPage} />
      </div>

      <Modal
        open={Boolean(editing)}
        onClose={close}
        size={details && !showForm ? 'md' : 'lg'}
        title={editing?.isNew ? `Add ${entityLabel}` : editing ? rowTitle(editing.row) : ''}
        footer={
          editing && (
            <>
              {!editing.isNew && allowDelete && (
                <button type="button" className="btn btn-sm btn-danger-ghost" onClick={() => setConfirming(editing.row)} disabled={saving}>
                  Delete
                </button>
              )}
              <span className="modal__foot-spacer" />
              <button type="button" className="btn btn-sm admin-btn-ghost" onClick={close} disabled={saving}>
                {readOnlyView ? 'Close' : 'Cancel'}
              </button>
              {showForm && (
                <button type="submit" form="resource-form" className="btn btn-sm btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : editing.isNew ? `Create ${entityLabel}` : 'Save changes'}
                </button>
              )}
            </>
          )
        }
      >
        {editing && !editing.isNew && details && (
          <dl className="detail-list">
            {details.map((d) => (
              <div key={d.key} className={d.wide ? 'is-wide' : undefined}>
                <dt>{d.label}</dt>
                <dd>{d.render ? d.render(editing.row) : editing.row[d.key] || '—'}</dd>
              </div>
            ))}
          </dl>
        )}
        {showForm && (
          <form id="resource-form" onSubmit={save} noValidate className={details && !editing.isNew ? 'modal__section' : undefined}>
            {details && !editing.isNew && <h3 className="modal__section-title">Update</h3>}
            <ResourceForm
              fields={fields}
              values={values}
              errors={errors}
              files={files}
              isNew={editing.isNew}
              onChange={(name, value) => {
                setValues((v) => ({ ...v, [name]: value }));
                if (errors[name]) setErrors(({ [name]: _removed, ...rest }) => rest);
              }}
              onFile={(name, file) => setFiles((f) => ({ ...f, [name]: file }))}
            />
          </form>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(confirming)}
        title={`Delete ${entityLabel}?`}
        message={confirming && `"${rowTitle(confirming)}" will be permanently deleted. This cannot be undone.`}
        busy={deleting}
        onConfirm={remove}
        onClose={() => setConfirming(null)}
      />
    </>
  );
}
