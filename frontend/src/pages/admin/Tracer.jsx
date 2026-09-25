import { useEffect, useState } from 'react';
import ResourcePage from '../../components/admin/ResourcePage.jsx';
import Badge from '../../components/admin/Badge.jsx';
import { TitleCell } from '../../components/admin/cells.jsx';
import { StatTile, BarList } from '../../components/admin/Stats.jsx';
import { formatDate, formatDateTime, formatNumber, fullName } from '../../components/admin/format.js';
import { adminApi } from '../../api/admin.js';
import { useContent } from '../../hooks/useContent.js';

function TracerSummary() {
  const [summary, setSummary] = useState(null);
  useEffect(() => {
    adminApi.fetch('/tracer/summary').then(setSummary).catch(() => setSummary(null));
  }, []);
  if (!summary) return null;

  const toItems = (obj) => Object.entries(obj).map(([label, value]) => ({ label, value }));
  return (
    <div className="admin-grid-3">
      <div className="stat-grid stat-grid--stack">
        <StatTile label="Responses" value={formatNumber(summary.total)} icon="users" />
        <StatTile label="Employment rate" value={`${summary.employmentRate}%`} hint="Employed or self-employed" icon="rocket" />
        <StatTile label="Job related to course" value={formatNumber(summary.relatedToCourse.Yes)} hint={`${formatNumber(summary.relatedToCourse.No)} not related`} icon="check" />
      </div>
      <section className="admin-card"><BarList title="Employment status" items={toItems(summary.employmentStatus)} /></section>
      <section className="admin-card"><BarList title="Time to first job" items={toItems(summary.timeToFirstJob)} /></section>
    </div>
  );
}

export default function Tracer() {
  const courses = useContent('courses');
  const options = useContent('form-options');

  return (
    <ResourcePage
      title="Graduate tracer"
      description="Responses to the Graduate Tracer survey, used for tracer studies and accreditation."
      endpoint="/tracer"
      entityLabel="response"
      searchPlaceholder="Search name, email or employer"
      rowTitle={fullName}
      headerExtra={<TracerSummary />}
      columns={[
        { key: 'name', label: 'Graduate', render: (r) => <TitleCell title={fullName(r)} subtitle={r.email} /> },
        { key: 'course', label: 'Course' },
        { key: 'yearGraduated', label: 'Batch', className: 'num' },
        { key: 'employmentStatus', label: 'Employment', render: (r) => <Badge value={r.employmentStatus} tone={['Employed', 'Self-employed'].includes(r.employmentStatus) ? 'success' : 'neutral'} label={r.employmentStatus} /> },
        { key: 'employer', label: 'Employer' },
        { key: 'createdAt', label: 'Submitted', render: (r) => formatDate(r.createdAt) },
      ]}
      filters={[
        { name: 'employmentStatus', label: 'Employment', options: (options.data?.employmentStatus || []).map((s) => ({ value: s, label: s })) },
        { name: 'course', label: 'Course', options: (courses.data || []).map((c) => ({ value: c, label: c })) },
      ]}
      details={[
        { key: 'email', label: 'Email', render: (r) => <a href={`mailto:${r.email}`}>{r.email}</a> },
        { key: 'phone', label: 'Mobile' },
        { key: 'course', label: 'Course' },
        { key: 'yearGraduated', label: 'Year graduated' },
        { key: 'employmentStatus', label: 'Employment status' },
        { key: 'employer', label: 'Employer' },
        { key: 'position', label: 'Position' },
        { key: 'industry', label: 'Industry' },
        { key: 'workLocation', label: 'Work location' },
        { key: 'relatedToCourse', label: 'Related to course', render: (r) => (r.relatedToCourse == null ? '—' : r.relatedToCourse ? 'Yes' : 'No') },
        { key: 'timeToFirstJob', label: 'Time to first job' },
        { key: 'monthlyIncome', label: 'Monthly income' },
        { key: 'licensure', label: 'Licensure exam' },
        { key: 'consentAt', label: 'Submitted', render: (r) => formatDateTime(r.createdAt) },
        { key: 'feedback', label: 'Feedback', wide: true },
      ]}
    />
  );
}
