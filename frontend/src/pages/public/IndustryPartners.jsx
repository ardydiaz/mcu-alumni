import { Link } from 'react-router-dom';
import PageHero from '../../components/ui/PageHero.jsx';
import SectionHeading from '../../components/ui/SectionHeading.jsx';
import AsyncContent from '../../components/ui/AsyncContent.jsx';
import Icon from '../../components/ui/Icon.jsx';
import { useContent } from '../../hooks/useContent.js';

const initials = (name) =>
  name
    .replace(/[^A-Za-z\s]/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

export default function IndustryPartners() {
  const partners = useContent('industry-partners');

  return (
    <>
      <PageHero
        eyebrow="Industry Partners"
        title="Advancing industries through unity"
        subtitle="We believe in building a community that extends to the professional realm, offering a supportive environment for your career journey."
        image="https://alumni.mcu.edu.ph/wp-content/uploads/2023/12/PGT-Science-Bldg.webp"
      >
        <Link to="/graduate-tracer" className="btn btn-gold btn-lg">Fill out the Graduate Tracer <Icon name="arrowRight" size={18} /></Link>
      </PageHero>

      <section className="section">
        <div className="container">
          <SectionHeading
            eyebrow="Our partners"
            title="Organizations that open doors for Centralinos"
            text="Hospitals, clinics, pharmaceutical companies and industry leaders that partner with MCU for employment and professional growth."
          />
          <AsyncContent state={partners} skeleton={6}>
            {(items) => (
              <div className="grid grid-4">
                {items.map((p) => (
                  <a key={p.id} href={p.website} target="_blank" rel="noreferrer" className="card partner">
                    <span className="partner__avatar" aria-hidden="true">{initials(p.name)}</span>
                    <span className="partner__name">{p.name}</span>
                    <Icon name="external" size={16} className="partner__ext" />
                  </a>
                ))}
              </div>
            )}
          </AsyncContent>
        </div>
      </section>
    </>
  );
}
