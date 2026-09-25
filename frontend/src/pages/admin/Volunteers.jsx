import ResourcePage from '../../components/admin/ResourcePage.jsx';
import Badge from '../../components/admin/Badge.jsx';
import { TitleCell } from '../../components/admin/cells.jsx';
import { formatDate, formatDateTime, fullName, toOptions } from '../../components/admin/format.js';

const STATUS = ['new', 'contacted', 'active', 'inactive'];
const ROLES = [
  { value: 'expertise', label: 'Share expertise (speaker)' },
  { value: 'community', label: 'Community service' },
  { value: 'mentor', label: 'Mentor' },
];
const roleLabel = (key) => ROLES.find((r) => r.value === key)?.label || key;

export default function Volunteers() {
  return (
    <ResourcePage
      title="Volunteers"
      description="Alumni who signed up to volunteer as speakers, mentors or community service volunteers."
      endpoint="/volunteers"
      entityLabel="volunteer"
      searchPlaceholder="Search name, email or expertise"
      canCreate={false}
      rowTitle={fullName}
      columns={[
        { key: 'name', label: 'Volunteer', render: (r) => <TitleCell title={fullName(r)} subtitle={r.email} /> },
        { key: 'role', label: 'Wants to', render: (r) => roleLabel(r.role) },
        { key: 'course', label: 'Course' },
        { key: 'status', label: 'Status', render: (r) => <Badge value={r.status} /> },
        { key: 'createdAt', label: 'Signed up', render: (r) => formatDate(r.createdAt) },
      ]}
      filters={[
        { name: 'status', label: 'Status', options: toOptions(STATUS) },
        { name: 'role', label: 'Role', options: ROLES },
      ]}
      details={[
        { key: 'role', label: 'Wants to', render: (r) => roleLabel(r.role) },
        { key: 'expertise', label: 'Expertise' },
        { key: 'email', label: 'Email', render: (r) => <a href={`mailto:${r.email}`}>{r.email}</a> },
        { key: 'phone', label: 'Mobile', render: (r) => <a href={`tel:${r.phone}`}>{r.phone}</a> },
        { key: 'course', label: 'Course' },
        { key: 'yearGraduated', label: 'Year graduated' },
        { key: 'createdAt', label: 'Signed up', render: (r) => formatDateTime(r.createdAt) },
        { key: 'message', label: 'Message', wide: true },
      ]}
      fields={[
        { name: 'status', label: 'Status', type: 'select', options: toOptions(STATUS) },
        { name: 'notes', label: 'Internal notes', type: 'textarea' },
      ]}
    />
  );
}
