import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHero from '../../components/ui/PageHero.jsx';
import AsyncContent from '../../components/ui/AsyncContent.jsx';
import Icon from '../../components/ui/Icon.jsx';
import { useContent } from '../../hooks/useContent.js';
import { useReveal } from '../../hooks/useReveal.js';
import { assetUrl } from '../../api/client.js';
import '../../styles/industry-partners.css';

const BENEFITS = [
  { icon: 'handshake', title: 'Career opportunities', text: 'Partners that hire and welcome Centralinos.' },
  { icon: 'rocket', title: 'Professional growth', text: 'Training and pathways beyond graduation.' },
  { icon: 'building', title: 'Industry linkages', text: 'Hospitals, clinics, pharma and more.' },
];
const TONES = 4; // avatar color variants in the stylesheet

const initials = (name) =>
  name
    .replace(/[^A-Za-z\s]/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

// Stable color per partner so avatars don't all look the same.
const tone = (name) => [...name].reduce((sum, c) => sum + c.charCodeAt(0), 0) % TONES;

function siteLabel(url) {
  try {
    const { hostname, pathname } = new URL(url);
    const host = hostname.replace(/^(www|site)\./, '');
    // Social pages: show the page name, not just "facebook.com"
    return /facebook|linkedin/.test(host) ? `${host}${pathname.replace(/\/$/, '')}` : host;
  } catch {
    return url;
  }
}

const firstLetter = (name) => {
  const c = name.trim()[0]?.toUpperCase() || '#';
  return /[A-Z]/.test(c) ? c : '#';
};

function PartnerCard({ partner, index }) {
  const Tag = partner.website ? 'a' : 'div';
  const linkProps = partner.website ? { href: partner.website, target: '_blank', rel: 'noreferrer' } : {};
  return (
    <Tag className="ip-card" style={{ '--i': Math.min(index, 15) }} {...linkProps}>
      {partner.logo ? (
        <span className="ip-card__logo"><img src={assetUrl(partner.logo)} alt="" loading="lazy" /></span>
      ) : (
        <span className={`ip-card__avatar ip-tone-${tone(partner.name)}`} aria-hidden="true">{initials(partner.name)}</span>
      )}
      <span className="ip-card__text">
        <strong>{partner.name}</strong>
        {partner.website && <small>{siteLabel(partner.website)}</small>}
      </span>
      {partner.website && (
        <span className="ip-card__go" aria-hidden="true"><Icon name="external" size={15} /></span>
      )}
    </Tag>
  );
}

function PartnerDirectory({ partners }) {
  const [letter, setLetter] = useState('All');
  const [query, setQuery] = useState('');

  const sorted = useMemo(() => [...partners].sort((a, b) => a.name.localeCompare(b.name)), [partners]);
  const letters = useMemo(() => ['All', ...new Set(sorted.map((p) => firstLetter(p.name)))], [sorted]);

  const q = query.trim().toLowerCase();
  const filtered = sorted.filter(
    (p) => (letter === 'All' || firstLetter(p.name) === letter) && `${p.name} ${p.website || ''}`.toLowerCase().includes(q)
  );
  const clear = () => {
    setLetter('All');
    setQuery('');
  };

  return (
    <>
      <div className="ip-toolbar">
        <div className="ip-letters" role="group" aria-label="Filter by first letter">
          {letters.map((l) => (
            <button key={l} type="button" className={`ip-letter ${letter === l ? 'is-selected' : ''}`} aria-pressed={letter === l} onClick={() => setLetter(l)}>
              {l}
            </button>
          ))}
        </div>
        <label className="ip-search">
          <Icon name="search" size={18} />
          <input type="search" placeholder="Search partners" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search industry partners" />
        </label>
      </div>

      <p className="ip-results" aria-live="polite">
        Showing <strong>{filtered.length}</strong> of {partners.length} partners
      </p>

      {filtered.length ? (
        <div className="ip-grid" key={`${letter}|${q}`}>
          {filtered.map((p, i) => <PartnerCard key={p.id} partner={p} index={i} />)}
        </div>
      ) : (
        <div className="ip-empty">
          <span className="ip-empty__icon" aria-hidden="true"><Icon name="search" size={24} /></span>
          <strong>No partners match your search</strong>
          <p>Try another name or letter.</p>
          <button type="button" className="btn btn-outline" onClick={clear}>Clear filters</button>
        </div>
      )}
    </>
  );
}

export default function IndustryPartners() {
  const partners = useContent('industry-partners');
  useReveal([partners.data]);

  return (
    <div className="ip">
      <PageHero
        eyebrow="Industry Partners"
        title="Advancing industries through unity"
        subtitle="We believe in building a community that extends to the professional realm, offering a supportive environment for your career journey."
        image="/images/industry-partners-banner.webp"
        variant="glass"
        imagePosition="center 40%"
      >
        <Link to="/graduate-tracer" className="btn btn-gold btn-lg">Fill out the Graduate Tracer <Icon name="arrowRight" size={18} /></Link>
        <a href="#partners" className="btn btn-outline-light btn-lg">Browse partners</a>
      </PageHero>

      {/* What partnerships bring: overlaps the bottom of the banner */}
      <div className="container">
        <ul className="ip-benefits">
          {partners.data && (
            <li className="ip-benefits__stat">
              <strong>{partners.data.length}</strong>
              <span>industry partners</span>
            </li>
          )}
          {BENEFITS.map((b) => (
            <li key={b.title}>
              <span className="ip-benefits__icon" aria-hidden="true"><Icon name={b.icon} size={20} /></span>
              <div>
                <strong>{b.title}</strong>
                <span>{b.text}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <section className="ip-section" id="partners">
        <div className="container">
          <div className="ip-heading" data-reveal>
            <div>
              <span className="ip-eyebrow">Our partners</span>
              <h2>Organizations that open doors for Centralinos</h2>
            </div>
            <p>Hospitals, clinics, pharmaceutical companies and industry leaders that partner with MCU for employment and professional growth.</p>
          </div>
          <AsyncContent state={partners} skeleton={6}>
            {(items) => <PartnerDirectory partners={items} />}
          </AsyncContent>
        </div>
      </section>

      <section className="ip-section ip-section--cta">
        <div className="container ip-ctas">
          <div className="ip-cta ip-cta--purple" data-reveal>
            <span className="ip-cta__icon" aria-hidden="true"><Icon name="file" size={22} /></span>
            <span className="ip-cta__eyebrow">For alumni</span>
            <h2>Help us track your career journey</h2>
            <p>Your Graduate Tracer answers help MCU build stronger industry linkages for future Centralinos.</p>
            <Link to="/graduate-tracer" className="btn btn-gold btn-lg">Fill out the Graduate Tracer <Icon name="arrowRight" size={18} /></Link>
          </div>
          <div className="ip-cta ip-cta--light" data-reveal style={{ '--delay': '120ms' }}>
            <span className="ip-cta__icon" aria-hidden="true"><Icon name="building" size={22} /></span>
            <span className="ip-cta__eyebrow">For organizations</span>
            <h2>Become an industry partner</h2>
            <p>Connect with skilled MCU graduates in health, sciences, business and more.</p>
            <a href="mailto:alumni@mcu.edu.ph?subject=Industry%20partnership" className="btn btn-primary btn-lg"><Icon name="mail" size={18} /> Get in touch</a>
          </div>
        </div>
      </section>
    </div>
  );
}
