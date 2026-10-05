import { Link } from 'react-router-dom';
import Icon from '../../components/ui/Icon.jsx';
import AsyncContent from '../../components/ui/AsyncContent.jsx';
import HeroSlider from '../../components/ui/HeroSlider.jsx';
import { useContent } from '../../hooks/useContent.js';
import { useReveal } from '../../hooks/useReveal.js';
import { assetUrl } from '../../api/client.js';
import { campaignIcons } from '../../components/ui/campaignIcons.js';
import '../../styles/home.css';

const pillarIcons = { connect: 'users', engage: 'calendar', empower: 'rocket', give: 'heart' };
const statIcon = (label = '') =>
  /graduate/i.test(label) ? 'users' : /found/i.test(label) ? 'flag' : /network/i.test(label) ? 'handshake' : 'building';

// Left-aligned section header with an optional action on the right.
function HomeHeading({ eyebrow, title, text, action, light }) {
  return (
    <div className={`home-heading ${light ? 'home-heading--light' : ''}`} data-reveal>
      <div>
        <span className="home-eyebrow">{eyebrow}</span>
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
          <span className="home-eyebrow">Why stay connected</span>
          <h2>Once a Centralino, always a Centralino</h2>
          <p>
            Your MCU journey doesn't end at graduation. The alumni community keeps you close to your Alma Mater, and to
            the friends and mentors who shaped you.
          </p>
          <div className="home-split__actions">
            <Link to="/alumni-contact-update" className="btn btn-primary btn-lg">
              Update your info <Icon name="arrowRight" size={18} />
            </Link>
            <Link to="/networks" className="link-arrow">Find your chapter <Icon name="arrowRight" size={16} /></Link>
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
        <div className="home-bento">
          {featured && (
            <Link to={`/give?campaign=${featured.slug}`} className="home-bento__featured" data-reveal>
              <span className="home-chip home-chip--light">{featured.area}</span>
              <Icon name={campaignIcons[featured.slug] || 'heart'} size={180} className="home-bento__watermark" />
              <div className="home-bento__featured-body">
                <span className="home-bento__icon"><Icon name={campaignIcons[featured.slug] || 'heart'} size={28} /></span>
                <h3>{featured.title}</h3>
                <p>{featured.description}</p>
                <span className="btn btn-gold">
                  Donate to this cause <Icon name="arrowRight" size={16} />
                </span>
              </div>
            </Link>
          )}
          {others.map((c, i) => (
            <Link key={c.id} to={`/give?campaign=${c.slug}`} className="home-bento__card" data-reveal style={{ '--delay': `${(i % 2) * 80}ms` }}>
              <div className="home-bento__card-top">
                <span className="home-bento__icon home-bento__icon--sm"><Icon name={campaignIcons[c.slug] || 'heart'} size={20} /></span>
                <span className="home-chip">{c.area}</span>
              </div>
              <h3>{c.title}</h3>
              <p>{c.description}</p>
              <span className="home-arrow" aria-hidden="true"><Icon name="arrowRight" size={16} /></span>
            </Link>
          ))}
          <Link to="/give" className="home-bento__give" data-reveal>
            <Icon name="heart" size={26} />
            <strong>Give now</strong>
            <span>Bank details and pledge form</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

function Stories({ features }) {
  return (
    <section className="home-section">
      <div className="container">
        <HomeHeading eyebrow="Stay in the loop" title="Stories from our community" text="News, milestones and the Centralinos making a difference." />
        <div className="home-stories">
          {features.map((f, i) => (
            <a key={f.title} href={f.url} target="_blank" rel="noreferrer" className="home-story" data-reveal style={{ '--delay': `${i * 70}ms` }}>
              <div className="home-story__img"><img src={f.image} alt="" loading="lazy" /></div>
              <div className="home-story__body">
                <h3>{f.title}</h3>
                <p>{f.text}</p>
                <span className="link-arrow">Read more <Icon name="external" size={15} /></span>
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
    <section className="home-section home-section--tinted home-networks">
      <div className="container">
        <HomeHeading
          eyebrow="Alumni networks"
          title="Find your chapter"
          text="Join your college alumni association and reconnect with your batchmates."
          action={<Link to="/networks" className="btn btn-outline">View all networks <Icon name="arrowRight" size={16} /></Link>}
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

function AlumniIdCta({ image }) {
  return (
    <section className="home-section">
      <div className="container">
        <div className="home-cta" data-reveal>
          <div className="home-cta__text">
            <span className="home-eyebrow home-eyebrow--light">MCU Alumni ID</span>
            <h2>Update your info and claim your Alumni ID</h2>
            <p>Get exclusive discounts from our merchant partners and stay updated on reunions and events.</p>
            <ul className="home-cta__perks">
              <li><Icon name="tag" size={16} /> Partner discounts</li>
              <li><Icon name="calendar" size={16} /> Reunion invites</li>
              <li><Icon name="mail" size={16} /> Alumni e-newsletter</li>
            </ul>
            <div className="home-cta__actions">
              <Link to="/alumni-contact-update#alumni-id" className="btn btn-gold btn-lg">Get my Alumni ID</Link>
              <Link to="/graduate-tracer" className="btn btn-outline-light btn-lg">Graduate Tracer</Link>
            </div>
          </div>
          {image && (
            <div className="home-cta__visual" aria-hidden="true">
              <img src={image} alt="" loading="lazy" />
            </div>
          )}
        </div>
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

  // Re-scan for [data-reveal] once each section's data has arrived.
  useReveal([home.data, campaigns.data, networks.data, site.data]);

  return (
    <div className="home">
      <Hero home={home} slides={slides} />

      {home.data && <Stats stats={home.data.stats} />}

      <AsyncContent state={home} skeleton={4}>{(data) => <Pillars pillars={data.pillars} />}</AsyncContent>

      <AsyncContent state={campaigns} skeleton={6}>{(items) => <Campaigns items={items} />}</AsyncContent>

      {home.data && <Stories features={home.data.features} />}

      {networks.data?.length > 0 && <Networks items={networks.data} />}

      <AlumniIdCta image={site.data?.alumniIdImage} />
    </div>
  );
}
