import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import '../styles/admin.css';

export function FullPageLoader() {
  return (
    <div className="page-loader" role="status" aria-label="Loading">
      <span className="spinner spinner--dark" />
    </div>
  );
}

// Signed in with Microsoft 365, but GET /auth/profile answered 403 (e.g. Faculty, Student).
function NoDashboardAccess({ user }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="access-denied">
      <div className="access-denied__card">
        <span className="access-denied__code">403</span>
        <h1>No access to the admin dashboard</h1>
        <p className="muted">
          You're signed in as <strong>{user?.email}</strong>
          {user?.role && <> ({user.role})</>}. The admin dashboard is only available to Super Admins and Administrators.
        </p>
        <div className="access-denied__actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={async () => {
              await logout();
              navigate('/admin/login', { replace: true });
            }}
          >
            Sign in with a different account
          </button>
          <a href="/" className="btn admin-btn-ghost">Go to the website</a>
        </div>
      </div>
    </div>
  );
}

// Requires an admin dashboard session; `roles` further limits access (e.g. ['Super Admin']).
export default function ProtectedRoute({ roles, children }) {
  const { status, user } = useAuth();
  const location = useLocation();

  if (status === 'loading') return <FullPageLoader />;
  if (status === 'anonymous') return <Navigate to="/admin/login" replace state={{ from: location }} />;
  if (status === 'forbidden') return <NoDashboardAccess user={user} />;
  if (roles && !roles.includes(user.role)) {
    return (
      <div className="admin-empty">
        <h2>Access restricted</h2>
        <p>This section is only available to {roles.join(' and ')}s.</p>
      </div>
    );
  }
  return children ?? <Outlet />;
}
