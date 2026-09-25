import { useState } from 'react';
import { Link } from 'react-router-dom';
import PageHero from '../../components/ui/PageHero.jsx';
import SectionHeading from '../../components/ui/SectionHeading.jsx';
import AsyncContent from '../../components/ui/AsyncContent.jsx';
import Icon from '../../components/ui/Icon.jsx';
import { useContent } from '../../hooks/useContent.js';
import { assetUrl } from '../../api/client.js';

function PartnerGrid({ partners }) {
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const filtered = partners.filter((p) => `${p.name} ${p.offer}`.toLowerCase().includes(q));

  return (
    <>
      <div className="toolbar toolbar--end">
        <label className="search">
          <Icon name="search" size={18} />
          <input type="search" placeholder="Search partners or offers" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search merchant partners" />
        </label>
      </div>
      {filtered.length ? (
        <div className="grid grid-3">
          {filtered.map((p) => (
            <article key={p.id} className="card perk">
              <div className="perk__logo"><img src={assetUrl(p.logo)} alt={p.name} loading="lazy" /></div>
              <div className="perk__body">
                <h3>{p.name}</h3>
                <p className="perk__offer"><Icon name="tag" size={16} /> {p.offer}</p>
                <span className={`perk__validity ${p.validity ? '' : 'is-open'}`}>
                  <Icon name="clock" size={14} /> {p.validity || 'Ongoing'}
                </span>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="empty">No partners match your search.</p>
      )}
    </>
  );
}

export default function MerchantPartners() {
  const merchants = useContent('merchant-partners');
  const site = useContent('site');

  return (
    <>
      <PageHero
        eyebrow="Merchant Partners"
        title="Exclusive perks for Centralinos"
        subtitle="As Centralinos, we believe in the power of community and connections that extend beyond the campus."
        image="https://alumni.mcu.edu.ph/wp-content/uploads/2024/10/alumni-id-1024x614.webp"
      />

      <section className="section">
        <div className="container split">
          <div>
            <SectionHeading
              align="left"
              eyebrow="Your Alumni ID"
              title="Present your MCU Alumni ID and save"
              text="Get your official MCU Alumni ID to enjoy discounts from our growing list of merchant partners, from dining and travel to health and wellness."
            />
            <Link to="/alumni-contact-update#alumni-id" className="btn btn-primary btn-lg"><Icon name="id" size={18} /> Get your Alumni ID</Link>
          </div>
          <div className="split__media split__media--contain">
            {site.data && <img src={site.data.alumniIdImage} alt="Sample MCU Alumni ID card" loading="lazy" />}
          </div>
        </div>
      </section>

      <section className="section section--tinted">
        <div className="container">
          <SectionHeading eyebrow="Partners" title="Current offers" text="Terms and validity are set by each partner. Present your Alumni ID upon purchase." />
          <AsyncContent state={merchants} skeleton={6}>
            {(data) => <PartnerGrid partners={data} />}
          </AsyncContent>
        </div>
      </section>
    </>
  );
}
