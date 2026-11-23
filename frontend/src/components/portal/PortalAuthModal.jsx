import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../ui/Icon.jsx';
import AsyncContent from '../ui/AsyncContent.jsx';
import LoginForm from './LoginForm.jsx';
import RegisterForm from './RegisterForm.jsx';
import CheckEmail from '../../pages/portal/CheckEmail.jsx';
import { useContent } from '../../hooks/useContent.js';
import { usePortalAuth } from '../../context/PortalAuthContext.jsx';
import { usePortalAuthModal } from './usePortalAuthModal.js';
import '../../styles/portal.css';

function RegisterView({ onLogin }) {
  const options = useContent('form-options');
  const [registeredEmail, setRegisteredEmail] = useState(null);
  if (registeredEmail) return <CheckEmail email={registeredEmail} onLogin={onLogin} />;
  if (options.data?.degreeGroups) return <RegisterForm degreeGroups={options.data.degreeGroups} onRegistered={setRegisteredEmail} onLogin={onLogin} />;
  return <AsyncContent state={options} skeleton={1}>{() => null}</AsyncContent>;
}

export default function PortalAuthModal() {
  const { mode, open, close, dismiss } = usePortalAuthModal();
  const { status } = usePortalAuth();
  const navigate = useNavigate();
  const ref = useRef(null);
  const loggedInHere = useRef(false); // a login from this modal navigates to the dashboard itself
  const show = Boolean(mode) && status !== 'authenticated';

  // Already logged in (e.g. an old ?portal=login link): just drop the parameter.
  useEffect(() => {
    if (mode && status === 'authenticated' && !loggedInHere.current) dismiss();
    if (!mode) loggedInHere.current = false;
  }, [mode, status, dismiss]);

  // Native <dialog>: focus trap, Escape and backdrop. The page behind doesn't scroll while it's open.
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return undefined;
    if (show && !dialog.open) dialog.showModal();
    if (!show && dialog.open) dialog.close();
    document.documentElement.classList.toggle('evm-lock', show);
    return () => document.documentElement.classList.remove('evm-lock');
  }, [show]);

  const register = mode === 'register';
  return (
    <dialog
      ref={ref}
      className={`pam${register ? ' pam--wide' : ''}`}
      aria-labelledby="pam-title"
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      onClick={(e) => e.target === ref.current && close()}
    >
      {show && (
        <div className="pam__panel">
          <header className="pam__head">
            <div>
              <span className="pam__eyebrow">Centralino access</span>
              <h2 id="pam-title">{register ? 'Create your Alumni Account' : 'Alumni Portal Login'}</h2>
              {register && <p>Register once to use MCU alumni services online. We activate your account after we verify your record.</p>}
            </div>
            <button type="button" className="pam__close" onClick={close} aria-label="Close">
              <Icon name="close" size={18} />
            </button>
          </header>
          <div className="pam__body">
            {register ? (
              <RegisterView key="register" onLogin={() => open('login')} />
            ) : (
              <LoginForm
                key="login"
                placeholders
                submitLabel="Sign In to Portal"
                onRegister={() => open('register')}
                onLogin={() => open('login')}
                onSuccess={() => {
                  loggedInHere.current = true;
                  navigate('/portal/account', { replace: true });
                }}
              />
            )}
          </div>
        </div>
      )}
    </dialog>
  );
}
