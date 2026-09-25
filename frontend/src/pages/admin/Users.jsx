import { useCallback, useEffect, useState } from 'react';
import ResourcePage from '../../components/admin/ResourcePage.jsx';
import Badge from '../../components/admin/Badge.jsx';
import { TitleCell } from '../../components/admin/cells.jsx';
import { formatDateTime } from '../../components/admin/format.js';
import { MicrosoftLogo } from '../../components/admin/MicrosoftButton.jsx';
import { useToast } from '../../components/admin/Toast.jsx';
import { adminApi } from '../../api/admin.js';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending approval' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];
const STATUS_LABELS = Object.fromEntries(STATUS_OPTIONS.map((o) => [o.value, o.label]));

// Roles from the `roles` table: Super Admin, Administrator, Faculty, Student.
export function useRoleOptions() {
  const [roles, setRoles] = useState([]);
  useEffect(() => {
    adminApi.fetch('/users/roles').then((d) => setRoles(d.roles)).catch(() => setRoles([]));
  }, []);
  return roles.map((r) => ({ value: r.id, label: r.name }));
}

// People who signed in with Microsoft 365 and are waiting for approval.
function AccessRequests({ roleOptions, onChange }) {
  const notify = useToast();
  const [requests, setRequests] = useState(null);
  const [choices, setChoices] = useState({}); // user id -> role id
  const [busy, setBusy] = useState(null);

  const load = useCallback(
    () => adminApi.list('/users', { status: 'pending', limit: 100, sort: 'createdAt', order: 'asc' }).then((r) => setRequests(r.data)),
    []
  );
  useEffect(() => {
    load();
  }, [load]);

  const act = async (user, action) => {
    setBusy(user.id);
    try {
      const body = action === 'approve' ? { roleId: Number(choices[user.id] || 2) } : undefined;
      const res = await adminApi.send(`/users/${user.id}/${action}`, 'POST', body);
      notify(res.message);
      await load();
      onChange();
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setBusy(null);
    }
  };

  if (!requests?.length) return null;

  return (
    <section className="admin-card access-requests">
      <div className="admin-card__head">
        <h2>
          Access requests <span className="count-pill">{requests.length}</span>
        </h2>
        <p className="muted">These people signed in with Microsoft 365. Choose a role and approve, or reject.</p>
      </div>
      <ul className="access-requests__list">
        {requests.map((u) => (
          <li key={u.id}>
            <TitleCell title={u.fullname} subtitle={`${u.email} · requested ${formatDateTime(u.createdAt)}`} />
            <div className="access-requests__actions">
              <select
                className="inline-select"
                value={choices[u.id] ?? 2}
                onChange={(e) => setChoices((c) => ({ ...c, [u.id]: e.target.value }))}
                aria-label={`Role for ${u.fullname}`}
                disabled={busy === u.id}
              >
                {roleOptions.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
              <button type="button" className="btn btn-primary btn-sm" disabled={busy === u.id} onClick={() => act(u, 'approve')}>
                Approve
              </button>
              <button type="button" className="btn btn-sm btn-danger-ghost" disabled={busy === u.id} onClick={() => act(u, 'reject')}>
                Reject
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function Users() {
  const roleOptions = useRoleOptions();
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <ResourcePage
      title="Users"
      description="Everyone who can sign in with Microsoft 365. New people are saved as access requests until a Super Admin approves them. Only Super Admins and Administrators can open the admin dashboard."
      endpoint="/users"
      entityLabel="user"
      searchPlaceholder="Search name, email or department"
      rowTitle={(r) => r.fullname}
      refreshKey={refreshKey}
      headerExtra={<AccessRequests roleOptions={roleOptions} onChange={() => setRefreshKey((k) => k + 1)} />}
      columns={[
        { key: 'fullname', label: 'User', render: (r) => <TitleCell title={r.fullname} subtitle={r.email} /> },
        { key: 'role', label: 'Role', render: (r) => (r.status === 'pending' ? <span className="muted">—</span> : <Badge value={r.role} label={r.role} />) },
        { key: 'department', label: 'Department', render: (r) => r.department || '—' },
        {
          key: 'microsoft',
          label: 'Microsoft 365',
          render: (r) =>
            r.microsoftLinked ? (
              <span className="signin-method"><MicrosoftLogo size={12} /> Linked</span>
            ) : (
              <span className="muted">Not signed in yet</span>
            ),
        },
        { key: 'status', label: 'Status', render: (r) => <Badge value={r.status} label={STATUS_LABELS[r.status]} /> },
        { key: 'lastLoginAt', label: 'Last sign-in', render: (r) => formatDateTime(r.lastLoginAt) },
      ]}
      filters={[
        { name: 'roleId', label: 'Role', options: roleOptions },
        { name: 'status', label: 'Status', options: STATUS_OPTIONS },
      ]}
      initialValues={{ roleId: 2, status: 'active' }}
      fields={[
        { name: 'fullname', label: 'Full name', required: true, span: 2 },
        {
          name: 'email',
          label: 'MCU Microsoft 365 email',
          type: 'email',
          required: true,
          span: 2,
          hint: 'The person signs in with this Microsoft 365 account. Their microsoft_id is linked on first sign-in.',
        },
        { name: 'roleId', label: 'Role', type: 'select', options: roleOptions, required: true },
        { name: 'department', label: 'Department', placeholder: 'Alumni Relations Office' },
        { name: 'status', label: 'Status', type: 'select', options: STATUS_OPTIONS },
      ]}
    />
  );
}
