import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Icon from '../../components/ui/Icon.jsx';
import { unsubscribeEventAlerts } from '../../api/client.js';
import '../../styles/portal.css';

// /event-alerts/unsubscribe?token=...: the link at the bottom of every event alert email.
// It asks for one click first, so email security scanners that open links don't unsubscribe people by accident.
export default function EventAlertsUnsubscribe() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const valid = /^[a-f0-9]{64}$/i.test(token);
  const [state, setState] = useState({ busy: false, done: false, error: valid ? '' : 'This unsubscribe link is incomplete.' });

  const onConfirm = async () => {
    setState({ busy: true, done: false, error: '' });
    try {
      const res = await unsubscribeEventAlerts(token);
      if (res.data?.found) setState({ busy: false, done: true, error: '' });
      else setState({ busy: false, done: false, error: res.message || 'This unsubscribe link is not valid.' });
    } catch (err) {
      setState({ busy: false, done: false, error: err.message });
    }
  };

  return (
    <div className="portal portal-page portal-page--center">
      <div className="portal-card portal-card--narrow">
        {state.error ? (
          <div className="portal-notice">
            <span className="portal-notice__icon portal-notice__icon--error" aria-hidden="true"><Icon name="close" size={28} /></span>
            <h2>This link can't be used</h2>
            <p>{state.error} To stop event alerts, email <a href="mailto:alumni@mcu.edu.ph">alumni@mcu.edu.ph</a> and we'll remove you.</p>
            <div className="portal-notice__actions"><Link to="/" className="btn btn-outline">Back to home</Link></div>
          </div>
        ) : state.done ? (
          <div className="portal-notice">
            <span className="portal-notice__icon portal-notice__icon--ok" aria-hidden="true"><Icon name="check" size={28} /></span>
            <h2>You're unsubscribed</h2>
            <p>You won't receive event alerts anymore. You can sign up again anytime from the homepage.</p>
            <div className="portal-notice__actions">
              <Link to="/events" className="btn btn-primary">See upcoming events</Link>
              <Link to="/" className="btn btn-outline">Back to home</Link>
            </div>
          </div>
        ) : (
          <div className="portal-notice">
            <span className="portal-notice__icon" aria-hidden="true"><Icon name="bell" size={28} /></span>
            <h2>Stop event alerts?</h2>
            <p>You'll no longer get an email when Grand Alumni Homecoming registration opens.</p>
            <div className="portal-notice__actions">
              <button type="button" className="btn btn-primary" onClick={onConfirm} disabled={state.busy}>
                {state.busy && <span className="spinner" aria-hidden="true" />} Unsubscribe
              </button>
              <Link to="/" className="btn btn-outline">Keep me subscribed</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
