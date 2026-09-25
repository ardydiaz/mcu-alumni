import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

// Only return to admin pages.
const safeNext = (value) => (value && /^\/admin(\/[\w-]+)*\/?$/.test(value) ? value : '/admin');

// Microsoft 365 sign-in lands here with #ticket=...&next=... (from the backend callback).
export default function M365Callback() {
  const { loginWithTicket } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const started = useRef(false); // the ticket is single-use: never redeem it twice (e.g. StrictMode)

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const hash = new URLSearchParams(window.location.hash.slice(1));
    const ticket = hash.get('ticket');
    const next = safeNext(hash.get('next'));
    // Remove the ticket from the address bar and history right away.
    window.history.replaceState(null, '', window.location.pathname);

    if (!ticket) {
      setError('This sign-in link is invalid. Please try again.');
      return;
    }
    loginWithTicket(ticket)
      .then(() => navigate(next, { replace: true }))
      .catch((err) => setError(err.message));
  }, [loginWithTicket, navigate]);

  if (error) {
    return (
      <>
        <h1 className="auth-card__title">Sign-in failed</h1>
        <div className="alert alert--error mt-md" role="alert">{error}</div>
        <Link to="/admin/login" className="btn btn-primary btn-lg btn-block mt-md">Back to sign in</Link>
      </>
    );
  }

  return (
    <div className="auth-card__pending" role="status">
      <span className="spinner spinner--dark" aria-hidden="true" />
      <p>Signing you in...</p>
    </div>
  );
}
