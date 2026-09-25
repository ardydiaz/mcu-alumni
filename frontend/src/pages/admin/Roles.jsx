import { useCallback, useEffect, useState } from 'react';
import PageHeader from '../../components/admin/PageHeader.jsx';
import Icon from '../../components/ui/Icon.jsx';
import { TitleCell } from '../../components/admin/cells.jsx';
import { useToast } from '../../components/admin/Toast.jsx';
import { adminApi } from '../../api/admin.js';
import { useAuth, ADMIN_PANEL_ROLES } from '../../context/AuthContext.jsx';

const ACTIONS = ['view', 'create', 'edit', 'delete'];
const ROLE_ICONS = { 'Super Admin': 'shield', Administrator: 'users', Faculty: 'book', Student: 'award' };

function PermissionMatrix({ roles, permissions }) {
  return (
    <div className="table-wrap">
      <table className="data-table permission-table">
        <caption className="sr-only">Permissions per role and module</caption>
        <thead>
          <tr>
            <th scope="col">Module</th>
            {roles.map((r) => (
              <th key={r.id} scope="col">{r.name}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {permissions.map((p) => (
            <tr key={p.module}>
              <th scope="row">{p.module}</th>
              {roles.map((r) => (
                <td key={r.id} data-label={r.name}>
                  {!ADMIN_PANEL_ROLES.includes(r.name) ? (
                    <span className="muted perm-none">No dashboard access</span>
                  ) : (
                    <div className="perm-chips">
                      {ACTIONS.map((a) => {
                        const allowed = p[r.name]?.includes(a);
                        return (
                          <span key={a} className={`perm-chip ${allowed ? 'is-on' : 'is-off'}`}>
                            <Icon name={allowed ? 'check' : 'close'} size={12} />
                            <span>{a}</span>
                            <span className="sr-only">{allowed ? 'allowed' : 'not allowed'}</span>
                          </span>
                        );
                      })}
                    </div>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RoleAssignments({ roles, onChanged }) {
  const { user: me } = useAuth();
  const notify = useToast();
  const [users, setUsers] = useState([]);
  const [saving, setSaving] = useState(null);

  const load = useCallback(
    () => adminApi.list('/users', { limit: 100, sort: 'fullname', order: 'asc' }).then((r) => setUsers(r.data)),
    []
  );
  useEffect(() => {
    load();
  }, [load]);

  const changeRole = async (user, roleId) => {
    setSaving(user.id);
    try {
      await adminApi.update('/users', user.id, { roleId: Number(roleId) });
      notify(`${user.fullname} is now ${roles.find((r) => r.id === Number(roleId))?.name}`);
      await load();
      onChanged();
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr><th scope="col">User</th><th scope="col">Department</th><th scope="col">Role</th></tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td data-label="User"><TitleCell title={u.fullname} subtitle={u.email} /></td>
              <td data-label="Department">{u.department || '—'}</td>
              <td data-label="Role">
                <select
                  className="inline-select"
                  value={u.roleId}
                  disabled={saving === u.id || u.id === me.id}
                  title={u.id === me.id ? 'You cannot change your own role' : undefined}
                  onChange={(e) => changeRole(u, e.target.value)}
                  aria-label={`Role for ${u.fullname}`}
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Roles() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const load = useCallback(() => adminApi.fetch('/users/roles').then(setData).catch(setError), []);
  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <PageHeader title="Roles" description="Roles come from the roles table. Only Super Admins and Administrators can open the admin dashboard." />
      {error && <div className="alert alert--error" role="alert">{error.message}</div>}
      {data && (
        <>
          <div className="role-cards">
            {data.roles.map((r) => (
              <article key={r.id} className="admin-card role-card">
                <div className={`role-card__icon ${ADMIN_PANEL_ROLES.includes(r.name) ? '' : 'is-muted'}`} aria-hidden="true">
                  <Icon name={ROLE_ICONS[r.name] || 'users'} size={20} />
                </div>
                <div>
                  <h2>{r.name}</h2>
                  <p className="muted">{r.description}</p>
                  <span className="role-card__count">
                    {r.userCount} {r.userCount === 1 ? 'user' : 'users'} · role_id {r.id}
                  </span>
                </div>
              </article>
            ))}
          </div>

          <section className="admin-card">
            <div className="admin-card__head"><h2>Permissions</h2></div>
            <PermissionMatrix roles={data.roles} permissions={data.permissions} />
          </section>

          <section className="admin-card">
            <div className="admin-card__head">
              <h2>Assign roles</h2>
              <p className="muted">Takes effect on the user's next request.</p>
            </div>
            <RoleAssignments roles={data.roles} onChanged={load} />
          </section>
        </>
      )}
    </>
  );
}
