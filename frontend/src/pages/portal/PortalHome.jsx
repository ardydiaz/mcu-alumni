import { Link } from 'react-router-dom';
import PageHero from '../../components/ui/PageHero.jsx';
import Icon from '../../components/ui/Icon.jsx';
import { usePortalAuth } from '../../context/PortalAuthContext.jsx';
import { useReveal } from '../../hooks/useReveal.js';
import { StatusBadge, firstName } from './portalShared.jsx';
import '../../styles/portal.css';

// Entry points from the proposed Alumni User Journey (Step 1).
const ENTRY_POINTS = [
  {
    icon: 'id',
    title: 'Alumni Information',
    text: 'Keep your contact details current, request your Alumni ID and answer the Graduate Tracer.',
    links: [
      { label: 'Alumni Contact Update', to: '/alumni-contact-update' },
      { label: 'Graduate Tracer', to: '/graduate-tracer' },
    ],
  },
  {
    icon: 'calendar',
    title: 'Alumni Events and Activities',
    text: 'Reunions, talks and outreach. Join a chapter or volunteer as a speaker or mentor.',
    links: [
      { label: 'Volunteer', to: '/volunteer' },
      { label: 'Alumni Networks', to: '/networks' },
    ],
    note: 'Events calendar coming soon',
  },
  {
    icon: 'award',
    title: 'Alumni Services',
    text: 'Perks from merchant partners, career linkages and ways to give back to MCU.',
    links: [
      { label: 'Merchant Partners', to: '/merchant-partners' },
      { label: 'Industry Partners', to: '/industry-partners' },
      { label: 'Give', to: '/give' },
    ],
  },
];

function SignedInCard({ account }) {
  return (
    <div className="portal-welcome" data-reveal>
      <div>
        <span className="portal-eyebrow">Welcome back</span>
        <h2>Hello, {firstName(account.fullName)}!</h2>
        <p>
          <StatusBadge status={account.status} />{' '}
          {account.status === 'verified'
            ? 'Your account is verified. You have full access to the Alumni Portal.'
            : 'Your registration is being reviewed by the Alumni Relations Office.'}
        </p>
      </div>
      <Link to="/portal/account" className="btn btn-gold btn-lg">Go to my account <Icon name="arrowRight" size={18} /></Link>
    </div>
  );
}

export default function PortalHome() {
  const { status, account } = usePortalAuth();
  useReveal([status]);

  return (
    <div className="portal">
      <PageHero
        eyebrow="MCU Alumni"
        title="Alumni Portal"
        subtitle="Your home for alumni transactions: create your account, update your information and access alumni services."
      >
        {status === 'authenticated' ? (
          <Link to="/portal/account" className="btn btn-gold btn-lg"><Icon name="users" size={18} /> My account</Link>
        ) : (
          <>
            <Link to="/portal/login" className="btn btn-gold btn-lg"><Icon name="users" size={18} /> Alumni Login</Link>
            <Link to="/portal/register" className="btn btn-outline-light btn-lg">Register / Create Account</Link>
          </>
        )}
      </PageHero>

      <section className="portal-section">
        <div className="container">
          {status === 'authenticated' ? (
            <SignedInCard account={account} />
          ) : (
            <div className="portal-access">
              <Link to="/portal/login" className="portal-access__card" data-reveal>
                <span className="portal-access__icon" aria-hidden="true"><Icon name="users" size={26} /></span>
                <span>
                  <strong>Alumni Login</strong>
                  <small>Already registered? Log in to your account.</small>
                </span>
                <Icon name="arrowRight" size={20} />
              </Link>
              <Link to="/portal/register" className="portal-access__card portal-access__card--gold" data-reveal style={{ '--delay': '90ms' }}>
                <span className="portal-access__icon" aria-hidden="true"><Icon name="plus" size={26} /></span>
                <span>
                  <strong>Register / Create Account</strong>
                  <small>New to the portal? It takes about 3 minutes.</small>
                </span>
                <Icon name="arrowRight" size={20} />
              </Link>
            </div>
          )}

          <div className="portal-heading" data-reveal>
            <span className="portal-eyebrow">Explore</span>
            <h2>Everything for Centralino alumni</h2>
          </div>
          <div className="portal-entries">
            {ENTRY_POINTS.map((e, i) => (
              <article key={e.title} className="portal-entry" data-reveal style={{ '--delay': `${i * 90}ms` }}>
                <span className="portal-entry__icon" aria-hidden="true"><Icon name={e.icon} size={22} /></span>
                <h3>{e.title}</h3>
                <p>{e.text}</p>
                <ul>
                  {e.links.map((l) => (
                    <li key={l.to}><Link to={l.to}>{l.label} <Icon name="arrowRight" size={14} /></Link></li>
                  ))}
                </ul>
                {e.note && <span className="portal-entry__note"><Icon name="clock" size={13} /> {e.note}</span>}
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
