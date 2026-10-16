import { useEffect, useState } from 'react';
import ResourcePage from '../../components/admin/ResourcePage.jsx';
import Badge from '../../components/admin/Badge.jsx';
import { TitleCell } from '../../components/admin/cells.jsx';
import { StatTile, BarList } from '../../components/admin/Stats.jsx';
import { formatDate, formatDateTime, formatNumber } from '../../components/admin/format.js';
import { adminApi } from '../../api/admin.js';
import { useContent } from '../../hooks/useContent.js';

const yesNo = (v) => (v == null ? '—' : v ? 'Yes' : 'No');
const toItems = (obj) => Object.entries(obj).map(([label, value]) => ({ label, value }));

function jobCategories(r) {
  const list = (Array.isArray(r.jobCategories) ? r.jobCategories : JSON.parse(r.jobCategories || '[]')).map((c) =>
    c === 'Other' && r.jobCategoryOther ? `Other: ${r.jobCategoryOther}` : c
  );
  return list.length ? list.join(', ') : '—';
}

function TracerSummary() {
  const [summary, setSummary] = useState(null);
  useEffect(() => {
    adminApi.fetch('/tracer/summary').then(setSummary).catch(() => setSummary(null));
  }, []);
  if (!summary) return null;

  return (
    <div className="admin-grid-3">
      <div className="stat-grid stat-grid--stack">
        <StatTile label="Responses" value={formatNumber(summary.total)} icon="users" />
        <StatTile label="Employment rate" value={`${summary.employmentRate}%`} hint="Currently employed" icon="rocket" />
        <StatTile label="Job related to degree" value={formatNumber(summary.relatedToDegree.Yes)} hint={`${formatNumber(summary.relatedToDegree.No)} not related`} icon="check" />
      </div>
      <section className="admin-card"><BarList title="Time to first job" items={toItems(summary.timeToFirstJob)} emptyMessage="No employed graduates yet." /></section>
      <section className="admin-card"><BarList title="Job category" items={toItems(summary.jobCategories)} emptyMessage="No employed graduates yet." /></section>
    </div>
  );
}

export default function Tracer() {
  const options = useContent('form-options');
  const degrees = (options.data?.degreeGroups || []).flatMap((g) => g.degrees);

  return (
    <ResourcePage
      title="Graduate tracer"
      description="Responses to the Graduate Tracer survey, used for tracer studies and accreditation."
      endpoint="/tracer"
      entityLabel="response"
      searchPlaceholder="Search name, email, employer or degree"
      rowTitle={(r) => r.fullName}
      headerExtra={<TracerSummary />}
      columns={[
        { key: 'fullName', label: 'Graduate', render: (r) => <TitleCell title={r.fullName} subtitle={r.email} /> },
        { key: 'degree', label: 'Degree' },
        { key: 'yearGraduated', label: 'Batch', className: 'num' },
        { key: 'isEmployed', label: 'Employed', render: (r) => <Badge value={r.isEmployed ? 'yes' : 'no'} tone={r.isEmployed ? 'success' : 'neutral'} label={r.isEmployed ? 'Employed' : 'Not employed'} /> },
        { key: 'employer', label: 'Company', render: (r) => r.employer || '—' },
        { key: 'createdAt', label: 'Submitted', render: (r) => formatDate(r.createdAt) },
      ]}
      filters={[
        { name: 'isEmployed', label: 'Employment', options: [{ value: 'true', label: 'Employed' }, { value: 'false', label: 'Not employed' }] },
        { name: 'degree', label: 'Degree', options: degrees.map((d) => ({ value: d, label: d })) },
      ]}
      details={[
        { key: 'fullName', label: 'Full name' },
        { key: 'sex', label: 'Sex' },
        { key: 'email', label: 'Contact email', render: (r) => <a href={`mailto:${r.email}`}>{r.email}</a> },
        { key: 'phone', label: 'Contact number', render: (r) => <a href={`tel:${r.phone}`}>{r.phone}</a> },
        { key: 'address', label: 'Complete address', wide: true },
        { key: 'yearGraduated', label: 'Year graduated' },
        { key: 'degree', label: 'Course / degree' },
        { key: 'isEmployed', label: 'Currently employed', render: (r) => yesNo(r.isEmployed) },
        { key: 'employer', label: 'Company' },
        { key: 'jobCategories', label: 'Job category', render: jobCategories },
        { key: 'position', label: 'Job title / position' },
        { key: 'relatedToDegree', label: 'Job related to degree', render: (r) => yesNo(r.relatedToDegree) },
        { key: 'timeToFirstJob', label: 'Time to first job' },
        { key: 'furtherStudies', label: 'Further studies', render: (r) => yesNo(r.furtherStudies) },
        { key: 'furtherStudiesTiming', label: 'Further studies started' },
        { key: 'alumniAccountId', label: 'Submitted via', render: (r) => (r.alumniAccountId ? <Badge value="portal" tone="info" label={`Alumni Portal (account #${r.alumniAccountId})`} /> : 'Public form') },
        { key: 'consentAt', label: 'Submitted', render: (r) => formatDateTime(r.createdAt) },
      ]}
    />
  );
}
