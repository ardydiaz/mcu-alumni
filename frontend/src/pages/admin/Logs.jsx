import ResourcePage from '../../components/admin/ResourcePage.jsx';
import Badge from '../../components/admin/Badge.jsx';
import { TitleCell } from '../../components/admin/cells.jsx';
import { formatDateTime, fullName, humanize, toOptions } from '../../components/admin/format.js';

const ACTIONS = ['login', 'login_failed', 'logout', 'create', 'update', 'delete', 'password_change', 'export'];
const ENTITIES = ['Campaign', 'Donation', 'Scholar', 'Network', 'Partner', 'Project', 'Report', 'Alumni record', 'Alumni profile', 'Alumni import', 'Alumni account', 'Tracer response', 'Volunteer', 'Message', 'User'];

export default function Logs() {
  return (
    <ResourcePage
      title="Activity logs"
      description="Sign-ins and every change staff make in the admin panel."
      endpoint="/logs"
      entityLabel="log entry"
      searchPlaceholder="Search descriptions"
      canCreate={false}
      canDelete={false}
      rowTitle={(r) => `${humanize(r.action)} · ${formatDateTime(r.createdAt)}`}
      columns={[
        { key: 'createdAt', label: 'When', render: (r) => formatDateTime(r.createdAt) },
        { key: 'user', label: 'User', render: (r) => (r.user ? <TitleCell title={fullName(r.user)} subtitle={r.user.email} /> : <span className="muted">—</span>) },
        { key: 'action', label: 'Action', render: (r) => <Badge value={r.action} /> },
        { key: 'entity', label: 'Area' },
        { key: 'description', label: 'Details' },
      ]}
      filters={[
        { name: 'action', label: 'Action', options: toOptions(ACTIONS) },
        { name: 'entity', label: 'Area', options: ENTITIES.map((e) => ({ value: e, label: e })) },
        { name: 'from', label: 'From', type: 'date' },
        { name: 'to', label: 'To', type: 'date' },
      ]}
      details={[
        { key: 'createdAt', label: 'When', render: (r) => formatDateTime(r.createdAt) },
        { key: 'action', label: 'Action', render: (r) => <Badge value={r.action} /> },
        { key: 'user', label: 'User', render: (r) => (r.user ? `${fullName(r.user)} (${r.user.email})` : '—') },
        { key: 'entity', label: 'Area', render: (r) => [r.entity, r.entityId && `#${r.entityId}`].filter(Boolean).join(' ') },
        { key: 'ipAddress', label: 'IP address' },
        { key: 'userAgent', label: 'Device / browser', wide: true },
        { key: 'description', label: 'Details', wide: true },
      ]}
    />
  );
}
