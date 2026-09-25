import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/admin/PageHeader.jsx';
import Field from '../../components/forms/Field.jsx';
import Badge from '../../components/admin/Badge.jsx';
import { MicrosoftLogo } from '../../components/admin/MicrosoftButton.jsx';
import { useToast } from '../../components/admin/Toast.jsx';
import { adminApi } from '../../api/admin.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { formatDateTime } from '../../components/admin/format.js';

export default function Profile() {
  const { user, updateUser, logout } = useAuth();
  const notify = useToast();
  const navigate = useNavigate();

  const [values, setValues] = useState({ fullname: user.fullname || '', department: user.department || '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const field = (name) => ({
    name,
    value: values[name],
    error: errors[name],
    onChange: (e) => {
      setValues((v) => ({ ...v, [name]: e.target.value }));
      setErrors((er) => ({ ...er, [name]: undefined }));
    },
  });

  const saveProfile = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { data } = await adminApi.send('/auth/profile', 'PATCH', values);
      updateUser(data);
      notify('Profile updated');
    } catch (err) {
      setErrors(err.fields || {});
      notify(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const signOutEverywhere = async () => {
    try {
      await adminApi.send('/auth/logout-all', 'POST');
    } finally {
      await logout();
      navigate('/admin/login', { replace: true });
    }
  };

  return (
    <>
      <PageHeader title="My profile" description="Your account details and security settings." />

      <div className="admin-grid-2">
        <section className="admin-card">
          <div className="admin-card__head"><h2>Account</h2></div>
          <dl className="detail-list detail-list--compact">
            <div><dt>Email</dt><dd>{user.email}</dd></div>
            <div><dt>Role</dt><dd><Badge value={user.role} label={user.role} /></dd></div>
            <div><dt>Last sign-in</dt><dd>{formatDateTime(user.lastLoginAt)}</dd></div>
            <div><dt>Member since</dt><dd>{formatDateTime(user.createdAt)}</dd></div>
          </dl>
          <form className="form" onSubmit={saveProfile} noValidate>
            <div className="form-grid">
              <Field label="Full name" required autoComplete="name" {...field('fullname')} />
              <Field label="Department" autoComplete="organization-title" {...field('department')} />
            </div>
            <div>
              <button type="submit" className="btn btn-primary btn-sm" disabled={busy}>
                {busy ? 'Saving...' : 'Save profile'}
              </button>
            </div>
          </form>
        </section>

        <section className="admin-card">
          <div className="admin-card__head"><h2>Sign-in</h2></div>
          <div className="signin-info">
            <MicrosoftLogo size={28} />
            <div>
              <strong>You sign in with Microsoft 365</strong>
              <p className="muted">Your password and multi-factor authentication are managed in your MCU Microsoft account.</p>
              <a href="https://mysignins.microsoft.com/security-info" target="_blank" rel="noreferrer" className="link-arrow">Manage Microsoft security info</a>
            </div>
          </div>

          <div className="danger-zone">
            <div>
              <strong>Sign out everywhere</strong>
              <p className="muted">Ends your sessions on all devices, including this one.</p>
            </div>
            <button type="button" className="btn btn-sm btn-danger-ghost" onClick={signOutEverywhere}>Sign out all devices</button>
          </div>
        </section>
      </div>
    </>
  );
}
