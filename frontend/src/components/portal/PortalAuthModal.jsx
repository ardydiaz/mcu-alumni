import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../ui/Icon.jsx';
import AsyncContent from '../ui/AsyncContent.jsx';
import LoginForm from './LoginForm.jsx';
import RegisterForm from './RegisterForm.jsx';
import ForgotPasswordForm from './ForgotPasswordForm.jsx';
import LoginLoader from './LoginLoader.jsx';
import CheckEmail from '../../pages/portal/CheckEmail.jsx';
import { Journey } from '../../pages/portal/portalShared.jsx';
import { useContent } from '../../hooks/useContent.js';
import { usePortalAuth } from '../../context/PortalAuthContext.jsx';
import { usePortalAuthModal } from './usePortalAuthModal.js';
import '../../styles/portal.css';

// Registration: the 4-step journey beside the form (on top on phones); step 2 lights up once the form is sent.
function RegisterView({ onLogin }) {
  const options = useContent('form-options');
  const [registeredEmail, setRegisteredEmail] = useState(null);

  let content;
  if (registeredEmail) content = <CheckEmail email={registeredEmail} onLogin={onLogin} />;
  else if (options.data?.degreeGroups) content = <RegisterForm degreeGroups={options.data.degreeGroups} onRegistered={setRegisteredEmail} onLogin={onLogin} />;
  else content = <AsyncContent state={options} skeleton={1}>{() => null}</AsyncContent>;

  return (
    <div className="pam__split">
      <aside className="pam__journey" aria-label="How registration works">
        <span className="pam__journey-label">How it works</span>
        <Journey current={registeredEmail ? 1 : 0} />
      </aside>
      <div className="pam__main">{content}</div>
    </div>
  );
}

const LOADER_MS = 3000; // how long the "Welcome back" screen shows after logging in
const LOADER_MS_REDUCED = 1500; // for visitors who turned off animations
const LOADER_FADE_MS = 350;

const TITLES = {
  login: { title: 'Alumni Portal Login' },
  register: { title: 'Create your Alumni Account', text: 'Register once to use MCU alumni services online. We activate your account after we verify your record.' },
  forgot: { title: 'Forgot your password?' },
};

export default function PortalAuthModal() {
  const { mode, open, close, dismiss, stay, next, email } = usePortalAuthModal();
  const { status } = usePortalAuth();
  const navigate = useNavigate();
  const ref = useRef(null);
  const loggedInHere = useRef(false); // a login from this modal moves on by itself (below)
  const show = Boolean(mode) && status !== 'authenticated';

  // After logging in: a short "Welcome back" screen, then stay on this page when asked (events, Graduate
  // Tracer), else ?next=, else the dashboard. The screen fades out over the next page.
  const [welcome, setWelcome] = useState(null); // { account, stay, leaving }
  const timers = useRef([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const afterLogin = (account) => {
    loggedInHere.current = true;
    // Step 3: a verified alumnus who hasn't reviewed their profile yet goes to My Profile first, so the
    // record found for them (or the new one) is checked and completed before anything else.
    const review = account?.status === 'verified' && account.profileReviewed === false && (!next || next === '/portal/account');
    const go = stay
      ? close
      : () => (review ? navigate('/portal/profile', { replace: true, state: { review: true } }) : navigate(next || '/portal/account', { replace: true }));
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const ms = reduced ? LOADER_MS_REDUCED : LOADER_MS;
    setWelcome({ account, stay, leaving: false, ms });
    timers.current.push(
      setTimeout(() => {
        go();
        setWelcome((w) => w && { ...w, leaving: true });
        timers.current.push(setTimeout(() => setWelcome(null), LOADER_FADE_MS));
      }, ms)
    );
  };

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
    // Own lock class: an event modal underneath keeps its lock when this one closes.
    document.documentElement.classList.toggle('pam-lock', show);
    return () => document.documentElement.classList.remove('pam-lock');
  }, [show]);

  const register = mode === 'register';
  const head = TITLES[mode] || TITLES.login;
  return (
    <>
    {welcome && <LoginLoader account={welcome.account} stay={welcome.stay} leaving={welcome.leaving} duration={welcome.ms} />}
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
        // autoFocus: the dialog starts on its content, not the close button; Tab still reaches every control.
        // eslint-disable-next-line jsx-a11y/no-autofocus
        <div className="pam__panel" tabIndex={-1} autoFocus>
          <header className="pam__head">
            <div>
              <span className="pam__eyebrow">Centralino access</span>
              <h2 id="pam-title">{head.title}</h2>
              {head.text && <p>{head.text}</p>}
            </div>
            <button type="button" className="pam__close" onClick={close} aria-label="Close">
              <Icon name="close" size={18} />
            </button>
          </header>
          <div className={`pam__body${register ? ' pam__body--split' : ''}`}>
            {register ? (
              <RegisterView key="register" onLogin={() => open('login')} />
            ) : mode === 'forgot' ? (
              <ForgotPasswordForm key="forgot" initialEmail={email} onLogin={() => open('login')} onRegister={() => open('register')} />
            ) : (
              <LoginForm
                key="login"
                placeholders
                initialEmail={email}
                submitLabel="Sign In to Portal"
                onRegister={() => open('register')}
                onForgot={(typed) => open('forgot', { email: typed })}
                onLogin={() => open('login')}
                onSuccess={afterLogin}
              />
            )}
          </div>
        </div>
      )}
    </dialog>
    </>
  );
}
