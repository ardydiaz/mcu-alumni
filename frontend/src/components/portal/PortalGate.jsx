import { Link, Navigate } from 'react-router-dom';
import PageHero from '../ui/PageHero.jsx';
import Icon from '../ui/Icon.jsx';
import { usePortalAuth } from '../../context/PortalAuthContext.jsx';
import '../../styles/portal-gate.css';

/**
 * Pages that need an Alumni Portal account (Alumni Contact Update, Graduate Tracer). The old public URLs
 * stay (links, posters, QR codes): logged-in alumni go straight to the portal page; everyone else is asked
 * to log in or create an account, so each update belongs to one verified graduate (no duplicate records).
 */
export default function PortalGate({ to, eyebrow, title, subtitle, heading, text, benefits }) {
  const { status } = usePortalAuth();
  if (status === 'authenticated') return <Navigate to={to} replace />;

  const next = encodeURIComponent(to);
  return (
    <>
      <PageHero eyebrow={eyebrow} title={title} subtitle={subtitle} />
      <section className="section section--tinted">
        <div className="container gate">
          {status === 'loading' ? (
            <div className="gate-card gate-card--loading" aria-busy="true"><span className="spinner spinner--dark" /></div>
          ) : (
            <>
              <div className="gate-card">
                <span className="gate-card__icon" aria-hidden="true"><Icon name="shield" size={26} /></span>
                <h2>{heading}</h2>
                <p>{text}</p>
                <div className="gate-card__actions">
                  <Link to={`/portal/login?next=${next}`} className="btn btn-primary btn-lg">
                    <Icon name="users" size={18} /> Log in to continue
                  </Link>
                  <Link to="/portal/register" className="btn btn-outline btn-lg">Create my account</Link>
                </div>
                <p className="gate-card__note">
                  <Icon name="mail" size={16} />
                  <span>
                    Got an email from the Alumni Relations Office with an <b>activation link</b>? Use it: your account and profile are already prepared.
                  </span>
                </p>
              </div>
              <aside className="gate-why">
                <h3>Why we ask you to log in</h3>
                <ul className="checklist">
                  {benefits.map((b) => <li key={b}><Icon name="check" size={18} /> {b}</li>)}
                </ul>
                <p className="muted">
                  Trouble logging in? Email <a href="mailto:alumni@mcu.edu.ph">alumni@mcu.edu.ph</a>.
                </p>
              </aside>
            </>
          )}
        </div>
      </section>
    </>
  );
}
