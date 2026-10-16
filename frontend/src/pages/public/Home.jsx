import { Link } from 'react-router-dom';
import Icon from '../../components/ui/Icon.jsx';
import AsyncContent from '../../components/ui/AsyncContent.jsx';
import HeroSlider from '../../components/ui/HeroSlider.jsx';
import { useContent } from '../../hooks/useContent.js';
import { useReveal } from '../../hooks/useReveal.js';
import { usePortalAuth } from '../../context/PortalAuthContext.jsx';
import { assetUrl } from '../../api/client.js';
import { campaignIcons } from '../../components/ui/campaignIcons.js';
import EventCard from '../../components/events/EventCard.jsx';
import { useUpcomingEvents } from '../../components/events/useUpcomingEvents.js';
import '../../styles/home.css';
import '../../styles/events.css';

const pillarIcons = { connect: 'users', engage: 'calendar', empower: 'rocket', give: 'heart' };
const statIcon = (label = '') =>
  /graduate/i.test(label) ? 'users' : /found/i.test(label) ? 'flag' : /network/i.test(label) ? 'handshake' : 'building';

// Left-aligned section header with an optional action on the right.
function HomeHeading({ eyebrow, title, text, action, light, solid }) {
  return (
    <div className={`home-heading ${light ? 'home-heading--light' : ''}`} data-reveal>
      <div>
        <span className={`home-eyebrow ${light ? 'home-eyebrow--light' : ''} ${solid ? 'home-eyebrow--solid' : ''}`}>{eyebrow}</span>
        <h2>{title}</h2>
        {text && <p>{text}</p>}
      </div>
      {action}
    </div>
  );
}

function Hero({ home, slides }) {
  if (slides.data?.length) return <HeroSlider slides={slides.data} />;
  const hero = home.data?.hero;
  return (
    <section className="hero" style={hero ? { '--hero-image': `url("${hero.image}")` } : undefined}>
      <div className="container hero__inner">
        <span className="eyebrow eyebrow--light">Manila Central University Alumni</span>
        <h1>{hero?.title || 'Join the 50,000+ Centralino graduates worldwide!'}</h1>
        <p>{hero?.subtitle || 'Connect with your fellow Centralinos from all over the world.'}</p>
        <div className="hero__actions">
          <Link to="/alumni-contact-update" className="btn btn-gold btn-lg">
            Stay Connected <Icon name="arrowRight" size={18} />
          </Link>
          <Link to="/volunteer" className="btn btn-outline-light btn-lg">Volunteer</Link>
        </div>
      </div>
    </section>
  );
}

function Stats({ stats }) {
  return (
    <div className="container">
      <div className="home-stats">
        {stats.map((s) => (
          <div key={s.label} className="home-stat">
            <span className="home-stat__icon" aria-hidden="true"><Icon name={statIcon(s.label)} size={22} /></span>
            <div>
              <strong>{s.value}</strong>
              <span>{s.label}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Pillars({ pillars }) {
  return (
    <section className="home-section">
      <div className="container home-split">
        <div className="home-split__intro" data-reveal>
          <span className="home-eyebrow home-eyebrow--solid">Why stay connected</span>
          <h2>
            Once a Centralino,
            <span className="home-accent">Always a Centralino</span>
          </h2>
          <p>
            Your MCU journey doesn't end at graduation. The alumni community keeps you close to your Alma Mater, and to
            the friends and mentors who shaped you.
          </p>
          <div className="home-split__actions">
            <Link to="/alumni-contact-update" className="btn btn-gold btn-lg">
              Update Your Info <Icon name="arrowRight" size={18} />
            </Link>
            <Link to="/networks" className="btn btn-outline btn-lg">Find Your Chapter</Link>
          </div>
        </div>
        <div className="home-pillars">
          {pillars.map((p, i) => (
            <article key={p.key} className="home-pillar" data-reveal style={{ '--delay': `${i * 80}ms` }}>
              <div className="home-pillar__top">
                <span className="home-pillar__icon"><Icon name={pillarIcons[p.key]} size={22} /></span>
                <span className="home-pillar__num" aria-hidden="true">0{i + 1}</span>
              </div>
              <h3>{p.title}</h3>
              <p>{p.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Campaigns({ items }) {
  const featured = items.find((c) => c.slug === 'scholarship') || items[0];
  const others = items.filter((c) => c !== featured);

  return (
    <section className="home-section home-section--tinted">
      <div className="container">
        <HomeHeading
          eyebrow="Giving campaign"
          title="Invest in the next generation of Centralinos"
          text="Every gift, big or small, goes directly to the area you care about most."
          action={<Link to="/give" className="btn btn-outline">All campaigns <Icon name="arrowRight" size={16} /></Link>}
        />
        <div className="home-give">
          {/* Featured campaign: photo card */}
          {featured && (
            <Link
              to={`/give?campaign=${featured.slug}`}
              className="home-give__featured"
              style={{ '--give-image': 'url("/images/support-centralino-banner.webp")' }}
              data-reveal
            >
              <span className="home-give__tag"><Icon name="award" size={14} /> Featured · {featured.area}</span>
              <div className="home-give__featured-body">
                <h3>{featured.title}</h3>
                <p>{featured.description}</p>
                <span className="btn btn-gold">
                  Donate to this cause <Icon name="arrowRight" size={16} />
                </span>
              </div>
            </Link>
          )}

          {/* Other campaigns as one tidy list, with the "Give now" bar underneath */}
          <div className="home-give__panel" data-reveal style={{ '--delay': '100ms' }}>
            <div className="home-give__panel-head">
              <h3>More ways to give</h3>
              <span>{others.length} campaigns</span>
            </div>
            <ul className="home-give__list">
              {others.map((c) => (
                <li key={c.id}>
                  <Link to={`/give?campaign=${c.slug}`} className="home-give__row">
                    <span className="home-give__icon" aria-hidden="true"><Icon name={campaignIcons[c.slug] || 'heart'} size={20} /></span>
                    <span className="home-give__text">
                      <small>{c.area}</small>
                      <strong>{c.title}</strong>
                      <span>{c.description}</span>
                    </span>
                    <span className="home-give__go" aria-hidden="true"><Icon name="arrowRight" size={16} /></span>
                  </Link>
                </li>
              ))}
            </ul>
            <Link to="/give" className="home-give__cta">
              <span className="home-give__cta-icon" aria-hidden="true"><Icon name="heart" size={20} /></span>
              <span>
                <strong>Ready to give?</strong>
                <small>Bank details and pledge form</small>
              </span>
              <span className="home-give__cta-btn">Give now <Icon name="arrowRight" size={16} /></span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function Stories({ features }) {
  return (
    <section className="home-section">
      <div className="container">
        <HomeHeading
          solid
          eyebrow="Stay in the loop"
          title="Stories from Our Community"
          text="News, milestones and the Centralinos making a difference."
          action={
            <a href="https://alumni.mcu.edu.ph/news-and-updates" target="_blank" rel="noreferrer" className="home-stories__all">
              View all stories <Icon name="arrowRight" size={16} />
            </a>
          }
        />
        <div className="home-stories">
          {features.map((f, i) => (
            <a key={f.title} href={f.url} target="_blank" rel="noreferrer" className="home-story" data-reveal style={{ '--delay': `${i * 70}ms` }}>
              {/* Photo cover when there is one; otherwise the story's artwork on a purple panel */}
              <div className={`home-story__img ${f.cover ? '' : 'home-story__img--art'}`}>
                <img src={f.cover || f.image} alt="" loading="lazy" />
                {f.tag && <span className={`home-story__tag home-story__tag--${f.tone || 'purple'}`}>{f.tag}</span>}
              </div>
              <div className="home-story__body">
                <h3>{f.title}</h3>
                <p>{f.text}</p>
                <span className="home-story__link">{f.cta || 'Read story'} <Icon name="external" size={14} /></span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

function Networks({ items }) {
  // The list is rendered twice so the strip can scroll in a seamless loop.
  const loop = [...items, ...items];
  return (
    <section className="home-section home-section--purple home-networks">
      <div className="container">
        <HomeHeading
          light
          eyebrow="Alumni networks"
          title="Find your chapter"
          text="Join your college alumni association and reconnect with your batchmates."
          action={<Link to="/networks" className="btn btn-outline-light">View all networks <Icon name="arrowRight" size={16} /></Link>}
        />
      </div>
      <div className="home-marquee" data-reveal>
        <div className="home-marquee__track">
          {loop.map((n, i) => (
            <Link key={`${n.id}-${i}`} to="/networks" className="home-marquee__item" title={n.name} aria-hidden={i >= items.length || undefined} tabIndex={i >= items.length ? -1 : undefined}>
              <img src={assetUrl(n.logo)} alt={i < items.length ? n.name : ''} loading="lazy" />
              <span>{n.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

// Next three events; the section only appears when there are upcoming events.
function UpcomingEvents({ events }) {
  return (
    <section className="home-section home-events">
      <div className="container">
        <HomeHeading
          solid
          eyebrow="Events and activities"
          title="Upcoming alumni events"
          text="Reunions, homecoming activities, chapter gatherings and alumni programs."
          action={<Link to="/events" className="btn btn-outline">View calendar <Icon name="calendar" size={16} /></Link>}
        />
        <div className="home-events__grid">
          {events.map((e, i) => (
            <div key={e.id} data-reveal style={{ '--delay': `${i * 80}ms` }}>
              <EventCard event={e} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const PORTAL_ACTIONS = [
  { icon: 'id', title: 'Alumni ID', text: 'Request your ID and enjoy partner discounts', to: '/alumni-contact-update#alumni-id' },
  { icon: 'users', title: 'Update your info', text: 'Keep your contact details current', to: '/alumni-contact-update' },
  { icon: 'file', title: 'Graduate Tracer', text: 'Tell us where your journey has taken you', to: '/graduate-tracer' },
  { icon: 'tag', title: 'Alumni perks', text: 'Discounts from our merchant partners', to: '/merchant-partners' },
];

// Full-width purple band: the Alumni Portal as the main entry point for alumni transactions.
function PortalBand({ image }) {
  const { status } = usePortalAuth();
  const signedIn = status === 'authenticated';

  return (
    <section className="home-section home-section--purple home-portal">
      <div className="container home-portal__grid">
        <div data-reveal>
          <span className="home-eyebrow home-eyebrow--light">Alumni Portal</span>
          <h2>Your alumni account, all in one place</h2>
          <p className="home-portal__lead">
            Create your Alumni Portal account to update your information, claim your Alumni ID and access alumni services online.
          </p>
          <div className="home-portal__actions">
            {signedIn ? (
              <Link to="/portal/account" className="btn btn-gold btn-lg">Go to my account <Icon name="arrowRight" size={18} /></Link>
            ) : (
              <>
                <Link to="/portal/register" className="btn btn-gold btn-lg">Create an account <Icon name="arrowRight" size={18} /></Link>
                <Link to="/portal/login" className="btn btn-outline-light btn-lg">Alumni Login</Link>
              </>
            )}
          </div>
          <div className="home-portal__tiles">
            {PORTAL_ACTIONS.map((a, i) => (
              <Link key={a.title} to={a.to} className="home-portal__tile" data-reveal style={{ '--delay': `${i * 70}ms` }}>
                <span className="home-portal__tile-icon" aria-hidden="true"><Icon name={a.icon} size={20} /></span>
                <span>
                  <strong>{a.title}</strong>
                  <small>{a.text}</small>
                </span>
              </Link>
            ))}
          </div>
        </div>
        {image && (
          <div className="home-portal__visual" data-reveal style={{ '--delay': '120ms' }} aria-hidden="true">
            <img src={image} alt="" loading="lazy" />
            <span className="home-portal__badge home-portal__badge--top"><Icon name="check" size={14} /> Verified alumni</span>
            <span className="home-portal__badge home-portal__badge--bottom"><Icon name="tag" size={14} /> Partner discounts</span>
          </div>
        )}
      </div>
    </section>
  );
}

export default function Home() {
  const home = useContent('home');
  const slides = useContent('slides');
  const campaigns = useContent('campaigns');
  const networks = useContent('networks');
  const site = useContent('site');
  const events = useUpcomingEvents(3);

  // Re-scan for [data-reveal] once each section's data has arrived.
  useReveal([home.data, campaigns.data, networks.data, site.data, events.data]);

  return (
    <div className="home">
      <Hero home={home} slides={slides} />

      {home.data && <Stats stats={home.data.stats} />}

      {/* Sections alternate white / purple / light so the page has rhythm */}
      <AsyncContent state={home} skeleton={4}>{(data) => <Pillars pillars={data.pillars} />}</AsyncContent>

      <PortalBand image={site.data?.alumniIdImage} />

      {events.data?.length > 0 && <UpcomingEvents events={events.data} />}

      <AsyncContent state={campaigns} skeleton={6}>{(items) => <Campaigns items={items} />}</AsyncContent>

      {networks.data?.length > 0 && <Networks items={networks.data} />}

      {home.data && <Stories features={home.data.features} />}
    </div>
  );
}
