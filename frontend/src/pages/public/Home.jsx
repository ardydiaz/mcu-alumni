import { Link } from 'react-router-dom';
import Icon from '../../components/ui/Icon.jsx';
import SectionHeading from '../../components/ui/SectionHeading.jsx';
import AsyncContent from '../../components/ui/AsyncContent.jsx';
import { useContent } from '../../hooks/useContent.js';
import { assetUrl } from '../../api/client.js';

const pillarIcons = { connect: 'users', engage: 'calendar', empower: 'rocket', give: 'heart' };
const campaignIcons = {
  'lrc-auditorium': 'building',
  scholarship: 'award',
  athletics: 'trophy',
  'education-research': 'book',
  community: 'handshake',
  mission: 'flag',
};

export default function Home() {
  const home = useContent('home');
  const campaigns = useContent('campaigns');
  const networks = useContent('networks');
  const hero = home.data?.hero;

  return (
    <>
      <section className="hero" style={hero ? { '--hero-image': `url("${hero.image}")` } : undefined}>
        <div className="container hero__inner">
          <span className="eyebrow eyebrow--light">Manila Central University Alumni</span>
          <h1>{hero?.title || 'Join the 50,000+ Centralino graduates worldwide!'}</h1>
          <p>{hero?.subtitle || 'Connect with your fellow Centralinos from all over the world.'}</p>
          <div className="hero__actions">
            <Link to="/alumni-contact-update" className="btn btn-gold btn-lg">
              Stay Connected <Icon name="arrowRight" size={18} />
            </Link>
            <Link to="/alumni-contact-update#alumni-id" className="btn btn-outline-light btn-lg">
              <Icon name="id" size={18} /> Get Alumni ID
            </Link>
            <Link to="/volunteer" className="btn btn-ghost-light btn-lg">Volunteer</Link>
          </div>
        </div>
      </section>

      {home.data && (
        <div className="container">
          <div className="stats">
            {home.data.stats.map((s) => (
              <div key={s.label} className="stat">
                <strong>{s.value}</strong>
                <span>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <section className="section">
        <div className="container">
          <SectionHeading
            eyebrow="Why stay connected"
            title="Once a Centralino, always a Centralino"
            text="Your MCU journey doesn't end at graduation. Here's how the alumni community keeps you close to your Alma Mater."
          />
          <AsyncContent state={home} skeleton={4}>
            {(data) => (
              <div className="grid grid-4">
                {data.pillars.map((p) => (
                  <article key={p.key} className="card pillar">
                    <div className="icon-badge"><Icon name={pillarIcons[p.key]} size={26} /></div>
                    <h3>{p.title}</h3>
                    <p>{p.text}</p>
                  </article>
                ))}
              </div>
            )}
          </AsyncContent>
        </div>
      </section>

      <section className="section section--tinted">
        <div className="container">
          <SectionHeading
            eyebrow="Giving campaign"
            title="Invest in the next generation of Centralinos"
            text="Every gift, big or small, goes directly to the area you care about most."
          />
          <AsyncContent state={campaigns} skeleton={6}>
            {(items) => (
              <div className="grid grid-3">
                {items.map((c) => (
                  <Link key={c.id} to={`/give?campaign=${c.slug}`} className="card campaign">
                    <div className="campaign__head">
                      <div className="icon-badge icon-badge--sm"><Icon name={campaignIcons[c.slug] || 'heart'} /></div>
                      <span className="tag">{c.area}</span>
                    </div>
                    <h3>{c.title}</h3>
                    <p>{c.description}</p>
                    <span className="link-arrow">Donate to this cause <Icon name="arrowRight" size={16} /></span>
                  </Link>
                ))}
              </div>
            )}
          </AsyncContent>
          <div className="center mt-lg">
            <Link to="/give" className="btn btn-primary btn-lg"><Icon name="heart" size={18} /> Give Now</Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHeading eyebrow="Stay in the loop" title="Stories from our community" />
          <AsyncContent state={home} skeleton={4}>
            {(data) => (
              <div className="grid grid-4">
                {data.features.map((f) => (
                  <a key={f.title} href={f.url} target="_blank" rel="noreferrer" className="card media-card">
                    <div className="media-card__img"><img src={f.image} alt="" loading="lazy" /></div>
                    <div className="media-card__body">
                      <h3>{f.title}</h3>
                      <p>{f.text}</p>
                      <span className="link-arrow">Read more <Icon name="external" size={15} /></span>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </AsyncContent>
        </div>
      </section>

      <section className="section section--tinted">
        <div className="container">
          <SectionHeading
            eyebrow="Alumni networks"
            title="Find your chapter"
            text="Join one of our college alumni associations and reconnect with your batchmates."
          />
          <AsyncContent state={networks} skeleton={4}>
            {(items) => (
              <div className="logo-strip">
                {items.map((n) => (
                  <Link key={n.name} to="/networks" className="logo-strip__item" title={n.name}>
                    <img src={assetUrl(n.logo)} alt={n.name} loading="lazy" />
                  </Link>
                ))}
              </div>
            )}
          </AsyncContent>
          <div className="center mt-lg">
            <Link to="/networks" className="btn btn-outline">View all networks <Icon name="arrowRight" size={16} /></Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="cta-band">
            <div>
              <h2>Update your info and claim your Alumni ID</h2>
              <p>Get exclusive discounts from our merchant partners and stay updated on reunions and events.</p>
            </div>
            <div className="cta-band__actions">
              <Link to="/alumni-contact-update" className="btn btn-gold btn-lg">Update My Info</Link>
              <Link to="/graduate-tracer" className="btn btn-outline-light btn-lg">Graduate Tracer</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
