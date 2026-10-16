import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHero from '../../components/ui/PageHero.jsx';
import AsyncContent from '../../components/ui/AsyncContent.jsx';
import Icon from '../../components/ui/Icon.jsx';
import { useContent } from '../../hooks/useContent.js';
import { useReveal } from '../../hooks/useReveal.js';
import { assetUrl } from '../../api/client.js';
import '../../styles/merchant-partners.css';

const ID_LINK = '/alumni-contact-update#alumni-id';
const SOON_DAYS = 30;
const REDEEM = [
  { icon: 'id', title: 'Get your Alumni ID', text: 'Request your official MCU Alumni ID card.' },
  { icon: 'pin', title: 'Visit a partner', text: 'Pick any merchant from the list below.' },
  { icon: 'tag', title: 'Present and save', text: 'Show your Alumni ID upon purchase.' },
];
const FILTERS = [
  { key: 'all', label: 'All offers' },
  { key: 'limited', label: 'Limited time' },
  { key: 'ongoing', label: 'Ongoing' },
];

// Today as YYYY-MM-DD in local time, to compare with DATEONLY values.
function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function daysUntil(date) {
  return Math.round((new Date(`${date}T00:00:00`) - new Date(`${today()}T00:00:00`)) / 86400000);
}

// "ongoing" (no end date), "active", "soon" (ends within SOON_DAYS) or "ended".
function offerState(p) {
  if (!p.validUntil) return 'ongoing';
  const days = daysUntil(p.validUntil);
  if (days < 0) return 'ended';
  return days <= SOON_DAYS ? 'soon' : 'active';
}

// Pulls the headline discount out of the offer text, e.g. "20%", "30-50%", "₱200".
function headline(offer = '') {
  const range = offer.match(/(\d+)%\s*(?:to|-)\s*(\d+)%/i);
  if (range) return `${range[1]}–${range[2]}%`;
  const pct = offer.match(/(\d+)%/);
  if (pct) return `${/^up to/i.test(offer) ? 'Up to ' : ''}${pct[1]}%`;
  const php = offer.match(/PHP\s?([\d,]+)/i);
  if (php) return `₱${php[1]}`;
  return null;
}

function Validity({ partner, state }) {
  const label = {
    ongoing: 'Ongoing offer',
    active: partner.validity,
    soon: `Ends in ${daysUntil(partner.validUntil)} day${daysUntil(partner.validUntil) === 1 ? '' : 's'}`,
    ended: 'Offer ended',
  }[state];
  return (
    <span className={`mp-validity mp-validity--${state}`} title={partner.validity || undefined}>
      <Icon name={state === 'ongoing' ? 'check' : 'clock'} size={14} /> {label || 'Limited time'}
    </span>
  );
}

function PartnerCard({ partner, index }) {
  const state = offerState(partner);
  const deal = headline(partner.offer);
  return (
    <article className={`mp-card ${state === 'ended' ? 'is-ended' : ''}`} style={{ '--i': Math.min(index, 11) }}>
      <div className="mp-card__logo">
        <img src={assetUrl(partner.logo)} alt={partner.name} loading="lazy" />
        {deal && <span className="mp-card__deal">{deal}<small>off</small></span>}
      </div>
      <div className="mp-card__body">
        <h3>{partner.name}</h3>
        <p>{partner.offer}</p>
        <div className="mp-card__foot">
          <Validity partner={partner} state={state} />
        </div>
      </div>
    </article>
  );
}

export function PartnerGrid({ partners }) {
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [showEnded, setShowEnded] = useState(false);

  const withState = useMemo(() => partners.map((p) => ({ ...p, state: offerState(p) })), [partners]);
  const live = withState.filter((p) => p.state !== 'ended');
  const ended = withState.filter((p) => p.state === 'ended');
  const counts = {
    all: live.length,
    limited: live.filter((p) => p.state !== 'ongoing').length,
    ongoing: live.filter((p) => p.state === 'ongoing').length,
  };

  const q = query.trim().toLowerCase();
  const matches = (p) => `${p.name} ${p.offer}`.toLowerCase().includes(q);
  const filtered = live.filter(
    (p) => matches(p) && (filter === 'all' || (filter === 'ongoing' ? p.state === 'ongoing' : p.state !== 'ongoing'))
  );
  const endedShown = ended.filter(matches);
  const clear = () => {
    setFilter('all');
    setQuery('');
  };

  return (
    <>
      <div className="mp-toolbar">
        <div className="mp-filters" role="group" aria-label="Filter offers">
          {FILTERS.map((f) => (
            <button key={f.key} type="button" className={`mp-filter ${filter === f.key ? 'is-selected' : ''}`} aria-pressed={filter === f.key} onClick={() => setFilter(f.key)}>
              {f.label}
              <span className="mp-filter__count">{counts[f.key]}</span>
            </button>
          ))}
        </div>
        <label className="mp-search">
          <Icon name="search" size={18} />
          <input type="search" placeholder="Search partners or offers" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search merchant partners" />
        </label>
      </div>

      {filtered.length ? (
        <div className="mp-grid" key={`${filter}|${q}`}>
          {filtered.map((p, i) => <PartnerCard key={p.id} partner={p} index={i} />)}
        </div>
      ) : (
        <div className="mp-empty">
          <span className="mp-empty__icon" aria-hidden="true"><Icon name="search" size={24} /></span>
          <strong>No offers match your search</strong>
          <p>Try another partner name or keyword.</p>
          <button type="button" className="btn btn-outline" onClick={clear}>Clear filters</button>
        </div>
      )}

      {endedShown.length > 0 && (
        <div className="mp-ended">
          <button type="button" className="mp-ended__toggle" aria-expanded={showEnded} onClick={() => setShowEnded((v) => !v)}>
            <Icon name="chevronDown" size={16} /> {showEnded ? 'Hide' : 'Show'} ended offers ({endedShown.length})
          </button>
          {showEnded && (
            <div className="mp-grid">
              {endedShown.map((p, i) => <PartnerCard key={p.id} partner={p} index={i} />)}
            </div>
          )}
        </div>
      )}
    </>
  );
}

export default function MerchantPartners() {
  const merchants = useContent('merchant-partners');
  const site = useContent('site');
  useReveal([merchants.data, site.data]);
  const liveCount = merchants.data?.filter((p) => offerState(p) !== 'ended').length;

  return (
    <div className="mp">
      <PageHero
        eyebrow="Merchant Partners"
        title="Exclusive perks for Centralinos"
        subtitle="As Centralinos, we believe in the power of community and connections that extend beyond the campus."
        image="/images/merchant-partners-banner.webp"
        variant="glass"
        imagePosition="88% 40%"
      >
        <a href="#offers" className="btn btn-gold btn-lg"><Icon name="tag" size={18} /> Browse offers</a>
        <Link to={ID_LINK} className="btn btn-outline-light btn-lg"><Icon name="id" size={18} /> Get your Alumni ID</Link>
      </PageHero>

      {/* How to redeem: overlaps the bottom of the banner */}
      <div className="container">
        <ol className="mp-redeem">
          {REDEEM.map((s, i) => (
            <li key={s.title}>
              <span className="mp-redeem__icon" aria-hidden="true"><Icon name={s.icon} size={20} /></span>
              <div>
                <small>Step {i + 1}</small>
                <strong>{s.title}</strong>
                <span>{s.text}</span>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <section className="mp-section">
        <div className="container mp-id">
          <div className="mp-id__text" data-reveal>
            <span className="mp-eyebrow">Your Alumni ID</span>
            <h2>Present your MCU Alumni ID and save</h2>
            <p>Get your official MCU Alumni ID to enjoy discounts from our growing list of merchant partners, from dining and travel to health and wellness.</p>
            <ul className="mp-id__list">
              <li><Icon name="check" size={16} /> Discounts on dining, travel, health and wellness</li>
              <li><Icon name="check" size={16} /> Birthday treats from selected partners</li>
              <li><Icon name="check" size={16} /> New partners added throughout the year</li>
            </ul>
            <Link to={ID_LINK} className="btn btn-primary btn-lg"><Icon name="id" size={18} /> Get your Alumni ID</Link>
          </div>
          <div className="mp-id__media" data-reveal style={{ '--delay': '120ms' }}>
            {site.data && <img src={site.data.alumniIdImage} alt="Sample MCU Alumni ID card" loading="lazy" />}
            {liveCount > 0 && (
              <div className="mp-id__badge">
                <strong>{liveCount}</strong>
                <span>partner offers available now</span>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="mp-section mp-section--tinted" id="offers">
        <div className="container">
          <div className="mp-heading" data-reveal>
            <div>
              <span className="mp-eyebrow">Partners</span>
              <h2>Current offers</h2>
            </div>
            <p>Terms and validity are set by each partner. Present your Alumni ID upon purchase.</p>
          </div>
          <AsyncContent state={merchants} skeleton={6}>
            {(data) => <PartnerGrid partners={data} />}
          </AsyncContent>
        </div>
      </section>

      <section className="mp-section mp-section--cta">
        <div className="container">
          <div className="mp-cta" data-reveal>
            <div>
              <span className="mp-cta__eyebrow">For business owners</span>
              <h2>Want to offer perks to Centralinos?</h2>
              <p>Partner with MCU Alumni Relations and reach our community of graduates.</p>
            </div>
            <div className="mp-cta__actions">
              <a href="mailto:alumni@mcu.edu.ph?subject=Merchant%20partnership" className="btn btn-gold btn-lg"><Icon name="mail" size={18} /> Become a partner</a>
              <a href="tel:+639171046520" className="btn btn-outline-light btn-lg"><Icon name="phone" size={18} /> Call us</a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
