import ResourcePage from '../../components/admin/ResourcePage.jsx';
import Badge from '../../components/admin/Badge.jsx';
import { TitleCell } from '../../components/admin/cells.jsx';
import { formatDate, formatDateTime, fullName, humanize, toOptions } from '../../components/admin/format.js';
import { useContent } from '../../hooks/useContent.js';

const ID_STATUS = ['not_requested', 'requested', 'processing', 'released'];

export default function Alumni() {
  const courses = useContent('courses');

  return (
    <ResourcePage
      title="Alumni records"
      description="Submissions from the Alumni Contact Update form, including Alumni ID requests."
      endpoint="/alumni"
      entityLabel="alumni record"
      searchPlaceholder="Search name, email or student no."
      canCreate={false}
      rowTitle={fullName}
      columns={[
        { key: 'name', label: 'Name', render: (r) => <TitleCell title={fullName(r)} subtitle={r.email} /> },
        { key: 'course', label: 'Course' },
        { key: 'yearGraduated', label: 'Batch', className: 'num' },
        { key: 'alumniIdStatus', label: 'Alumni ID', render: (r) => <Badge value={r.alumniIdStatus} /> },
        { key: 'createdAt', label: 'Updated', render: (r) => formatDate(r.createdAt) },
      ]}
      filters={[
        { name: 'alumniIdStatus', label: 'Alumni ID', options: toOptions(ID_STATUS) },
        { name: 'course', label: 'Course', options: (courses.data || []).map((c) => ({ value: c, label: c })) },
      ]}
      details={[
        { key: 'name', label: 'Full name', render: (r) => [r.firstName, r.middleName, r.lastName].filter(Boolean).join(' ') },
        { key: 'maidenName', label: 'Maiden name' },
        { key: 'email', label: 'Email', render: (r) => <a href={`mailto:${r.email}`}>{r.email}</a> },
        { key: 'phone', label: 'Mobile', render: (r) => <a href={`tel:${r.phone}`}>{r.phone}</a> },
        { key: 'birthDate', label: 'Date of birth', render: (r) => formatDate(r.birthDate) },
        { key: 'studentNumber', label: 'Student no.' },
        { key: 'course', label: 'Course' },
        { key: 'yearGraduated', label: 'Year graduated' },
        { key: 'employer', label: 'Employer' },
        { key: 'position', label: 'Position' },
        { key: 'address', label: 'Address', wide: true, render: (r) => [r.address, r.city, r.country].filter(Boolean).join(', ') },
        { key: 'alumniIdStatus', label: 'Alumni ID', render: (r) => humanize(r.alumniIdStatus) },
        { key: 'consentAt', label: 'Consent given', render: (r) => formatDateTime(r.consentAt) },
      ]}
      fields={[
        { name: 'alumniIdStatus', label: 'Alumni ID status', type: 'select', options: toOptions(ID_STATUS) },
        { name: 'notes', label: 'Internal notes', type: 'textarea' },
      ]}
    />
  );
}
