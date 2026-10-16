import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/admin/PageHeader.jsx';
import DataTable from '../../components/admin/DataTable.jsx';
import Pagination from '../../components/admin/Pagination.jsx';
import Modal from '../../components/admin/Modal.jsx';
import ResourceForm, { payloadFromValues } from '../../components/admin/ResourceForm.jsx';
import Badge from '../../components/admin/Badge.jsx';
import { TitleCell } from '../../components/admin/cells.jsx';
import { useToast } from '../../components/admin/Toast.jsx';
import Icon from '../../components/ui/Icon.jsx';
import { adminApi } from '../../api/admin.js';

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

export default function AlumniProfiles() {
  const navigate = useNavigate();
  const notify = useToast();
  const [search, setSearch] = useState('');
  const [linked, setLinked] = useState('');
  const [page, setPage] = useState(1);
  const [result, setResult] = useState({ rows: [], meta: null, loading: true });
  const [creating, setCreating] = useState(false);
  const [values, setValues] = useState({});
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const q = useDebounced(search);

  const load = useCallback(() => {
    setResult((r) => ({ ...r, loading: true }));
    adminApi
      .list('/profiles', { search: q, linked, page, limit: 20 })
      .then((res) => setResult({ rows: res.data, meta: res.meta, loading: false }))
      .catch((err) => {
        notify(err.message, 'error');
        setResult({ rows: [], meta: null, loading: false });
      });
  }, [q, linked, page, notify]);
  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => setPage(1), [q, linked]);

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
        description="The master record of each graduate: profile, address, family, education, skills, trainings, work and references. Profiles are created when a portal account is verified, or encoded here for walk-ins."
        actions={
          <button type="button" className="btn btn-primary" onClick={() => { setValues({}); setErrors({}); setCreating(true); }}>
            <Icon name="plus" size={16} /> New profile
          </button>
        }
      />
      <section className="admin-card">
        <div className="admin-toolbar">
          <label className="search">
            <Icon name="search" size={18} />
            <input type="search" placeholder="Search name, alumni no., student ID, email or program" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search profiles" />
          </label>
          <label className="admin-filter">
            <span>Portal account</span>
            <select value={linked} onChange={(e) => setLinked(e.target.value)}>
              <option value="">All</option>
              <option value="true">Has portal account</option>
              <option value="false">Encoded by EAO only</option>
            </select>
          </label>
        </div>
        <DataTable
          loading={result.loading}
          rows={result.rows}
          onRowClick={(r) => navigate(`/admin/profiles/${r.id}`)}
          emptyMessage="No alumni profiles found."
          columns={[
            { key: 'alumniNumber', label: 'Alumni No.', render: (r) => r.alumniNumber || '—' },
            { key: 'name', label: 'Name', render: (r) => <TitleCell title={`${r.surname}, ${r.firstName}${r.middleName ? ` ${r.middleName}` : ''}`} subtitle={r.email || r.phone || '—'} /> },
            { key: 'studentNumber', label: 'Student ID' },
            { key: 'program', label: 'Program' },
            { key: 'yearGraduated', label: 'Batch', className: 'num' },
            { key: 'alumniAccountId', label: 'Source', render: (r) => (r.alumniAccountId ? <Badge value="portal" tone="info" label="Alumni Portal" /> : <Badge value="eao" tone="neutral" label="EAO encoded" />) },
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
