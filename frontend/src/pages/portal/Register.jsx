import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import AsyncContent from '../../components/ui/AsyncContent.jsx';
import Icon from '../../components/ui/Icon.jsx';
import RegisterForm from '../../components/portal/RegisterForm.jsx';
import { useContent } from '../../hooks/useContent.js';
import { usePortalAuth } from '../../context/PortalAuthContext.jsx';
import { Journey } from './portalShared.jsx';
import CheckEmail from './CheckEmail.jsx';
import '../../styles/portal.css';

// /portal/register: the full registration page. The header opens the same form in a modal instead.
export default function Register() {
  const { status } = usePortalAuth();
  const options = useContent('form-options');
  const [registeredEmail, setRegisteredEmail] = useState(null);

  if (status === 'authenticated') return <Navigate to="/portal/account" replace />;

  return (
    <div className="portal portal-page">
      <div className="container portal-split">
        <aside className="portal-aside">
          <Link to="/portal" className="portal-back"><Icon name="arrowRight" size={14} /> Alumni Portal</Link>
          <h1>Create your Alumni Account</h1>
          <p>Register once to use MCU alumni services online. Your account is activated after we verify your record.</p>
          <Journey current={registeredEmail ? 1 : 0} />
        </aside>
        <div className="portal-card">
          {registeredEmail ? (
            <CheckEmail email={registeredEmail} />
          ) : options.data?.degreeGroups ? (
            <RegisterForm degreeGroups={options.data.degreeGroups} onRegistered={setRegisteredEmail} />
          ) : (
            <AsyncContent state={options} skeleton={1}>{() => null}</AsyncContent>
          )}
        </div>
      </div>
    </div>
  );
}
