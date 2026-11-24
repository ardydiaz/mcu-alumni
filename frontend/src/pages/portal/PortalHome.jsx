import { Link } from 'react-router-dom';
import PortalAuthLink from '../../components/portal/PortalAuthLink.jsx';
import PageHero from '../../components/ui/PageHero.jsx';
import Icon from '../../components/ui/Icon.jsx';
import { usePortalAuth } from '../../context/PortalAuthContext.jsx';
import { useReveal } from '../../hooks/useReveal.js';
import { StatusBadge, firstName, JOURNEY } from './portalShared.jsx';
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
    text: 'Homecoming, reunions, talks and outreach. See what is coming up, join a chapter or volunteer as a speaker or mentor.',
    links: [
      { label: 'Events calendar', to: '/events' },
      { label: 'Alumni Networks', to: '/networks' },
      { label: 'Volunteer', to: '/volunteer' },
    ],
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

// Only verified alumni can log in, so a signed-in visitor always has full access.
function SignedInCard({ account }) {
  return (
    <div className="portal-welcome" data-reveal>
      <div>
        <span className="portal-eyebrow">Welcome back</span>
        <h2>Hello, {firstName(account.fullName)}!</h2>
        <p>
          <StatusBadge status={account.status} /> Your profile, Alumni ID, Graduate Tracer and alumni perks are in your account.
        </p>
      </div>
      <Link to="/portal/account" className="btn btn-gold btn-lg">Go to my account <Icon name="arrowRight" size={18} /></Link>
    </div>
  );
}

// "How it works": the same four steps as the registration journey, for first-time visitors.
const STEP_ICONS = ['userPlus', 'mail', 'clock', 'userCheck'];

function HowItWorks() {
  return (
    <section className="portal-steps" aria-labelledby="portal-steps-title" data-reveal>
      <div className="portal-heading">
        <span className="portal-eyebrow">How it works</span>
        <h2 id="portal-steps-title">Your account in four steps</h2>
      </div>
      <ol className="portal-steps__list">
        {JOURNEY.map((s, i) => (
          <li key={s.title} className="portal-step" style={{ '--delay': `${i * 80}ms` }}>
            <span className="portal-step__icon" aria-hidden="true"><Icon name={STEP_ICONS[i]} size={22} /></span>
            <span className="portal-step__num">Step {i + 1}</span>
            <strong>{s.title}</strong>
            <span className="portal-step__text">{s.text}</span>
          </li>
        ))}
      </ol>
      <p className="portal-steps__note">
        <Icon name="clock" size={15} /> Step 3 is done by the Alumni Relations Office. We email you as soon as your account is verified, and then you can log in.
      </p>
    </section>
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
            <PortalAuthLink mode="login" className="btn btn-gold btn-lg"><Icon name="users" size={18} /> Alumni Login</PortalAuthLink>
            <PortalAuthLink mode="register" className="btn btn-outline-light btn-lg">Register / Create Account</PortalAuthLink>
          </>
        )}
      </PageHero>

      <section className="portal-section">
        <div className="container">
          {status === 'authenticated' ? (
            <SignedInCard account={account} />
          ) : (
            <div className="portal-access">
              <PortalAuthLink mode="login" className="portal-access__card" data-reveal>
                <span className="portal-access__icon" aria-hidden="true"><Icon name="users" size={26} /></span>
                <span>
                  <strong>Alumni Login</strong>
                  <small>Already registered? Log in to your account.</small>
                </span>
                <Icon name="arrowRight" size={20} />
              </PortalAuthLink>
              <PortalAuthLink mode="register" className="portal-access__card portal-access__card--gold" data-reveal style={{ '--delay': '90ms' }}>
                <span className="portal-access__icon" aria-hidden="true"><Icon name="plus" size={26} /></span>
                <span>
                  <strong>Register / Create Account</strong>
                  <small>New to the portal? It takes about 3 minutes.</small>
                </span>
                <Icon name="arrowRight" size={20} />
              </PortalAuthLink>
            </div>
          )}

          {status !== 'authenticated' && <HowItWorks />}

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
