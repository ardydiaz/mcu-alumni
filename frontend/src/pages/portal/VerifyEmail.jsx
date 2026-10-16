import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Icon from '../../components/ui/Icon.jsx';
import { portalApi } from '../../api/portal.js';
import { Journey } from './portalShared.jsx';
import '../../styles/portal.css';

// Landing page for the link in the verification email: /portal/verify?token=...
export default function VerifyEmail() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [state, setState] = useState({ status: token ? 'verifying' : 'error', message: token ? '' : 'This verification link is incomplete.' });
  const started = useRef(false); // links are single-use: never send the token twice

  useEffect(() => {
    if (!token || started.current) return;
    started.current = true;
    portalApi
      .verifyEmail(token)
      .then((res) => setState({ status: 'done', message: res.message }))
      .catch((err) => setState({ status: 'error', message: err.message }));
  }, [token]);

  return (
    <div className="portal portal-page portal-page--center">
      <div className="portal-card portal-card--narrow">
        {state.status === 'verifying' && (
          <div className="portal-notice">
            <span className="spinner spinner--dark" aria-hidden="true" />
            <h2>Verifying your email...</h2>
          </div>
        )}
        {state.status === 'done' && (
          <div className="portal-notice">
            <span className="portal-notice__icon portal-notice__icon--ok" aria-hidden="true"><Icon name="check" size={28} /></span>
            <h2>Email verified!</h2>
            <p>{state.message} We will email you once your account is verified.</p>
            <Journey current={2} />
            <div className="portal-notice__actions">
              <Link to="/portal/login" className="btn btn-primary">Log in to check your status</Link>
            </div>
          </div>
        )}
        {state.status === 'error' && (
          <div className="portal-notice">
            <span className="portal-notice__icon portal-notice__icon--error" aria-hidden="true"><Icon name="close" size={28} /></span>
            <h2>We couldn't verify your email</h2>
            <p>{state.message}</p>
            <p className="muted">If you already verified your email, you can log in. Otherwise, log in to request a new link.</p>
            <div className="portal-notice__actions">
              <Link to="/portal/login" className="btn btn-primary">Go to login</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
