import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import Icon from '../../components/ui/Icon.jsx';
import LoginForm from '../../components/portal/LoginForm.jsx';
import { usePortalAuth } from '../../context/PortalAuthContext.jsx';
import '../../styles/portal.css';

// /portal/login: the full login page (links in emails, "log in to register" on events). The header opens the
// same form in a modal instead.
export default function PortalLogin() {
  const { status } = usePortalAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  // ?next=/events/... returns the alumnus to the page they came from (only paths on this site).
  const next = /^\/(?!\/)/.test(params.get('next') || '') ? params.get('next') : '/portal/account';
  if (status === 'authenticated') return <Navigate to={next} replace />;

  return (
    <div className="portal portal-page portal-page--center">
      <div className="portal-card portal-card--narrow">
        <Link to="/portal" className="portal-back"><Icon name="arrowRight" size={14} /> Alumni Portal</Link>
        <div className="portal-card__head">
          <span className="portal-card__icon" aria-hidden="true"><Icon name="users" size={24} /></span>
          <h1>Alumni Login</h1>
          <p>Log in to your MCU Alumni Portal account.</p>
        </div>
        <LoginForm initialEmail={params.get('email') || ''} onSuccess={() => navigate(next, { replace: true })} />
      </div>
    </div>
  );
}
