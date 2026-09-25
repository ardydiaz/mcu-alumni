import { Link } from 'react-router-dom';
import PageHero from '../../components/ui/PageHero.jsx';
import SectionHeading from '../../components/ui/SectionHeading.jsx';
import AsyncContent from '../../components/ui/AsyncContent.jsx';
import Icon from '../../components/ui/Icon.jsx';
import { useContent } from '../../hooks/useContent.js';
import { assetUrl } from '../../api/client.js';

export default function CampusDevelopment() {
  const projects = useContent('projects');

  return (
    <>
      <PageHero
        eyebrow="Campus Development"
        title="Building spaces where innovation thrives"
        subtitle="Your investment in our infrastructure ensures an environment where innovation thrives, contributing to the betterment of our community and nation."
        image="https://alumni.mcu.edu.ph/wp-content/uploads/2023/12/amphi.webp"
      >
        <Link to="/give?campaign=lrc-auditorium" className="btn btn-gold btn-lg"><Icon name="building" size={18} /> Support a project</Link>
      </PageHero>

      <section className="section">
        <div className="container">
          <SectionHeading eyebrow="Projects" title="What we're building together" text="Architectural perspectives of the campus improvements your gifts make possible." />
          <AsyncContent state={projects} skeleton={2}>
            {(items) => (
              <div className="stack">
                {items.map((p, i) => (
                  <article key={p.title} className={`feature-row ${i % 2 ? 'feature-row--reverse' : ''}`}>
                    <div className="feature-row__media"><img src={assetUrl(p.image)} alt={`${p.title} perspective`} loading="lazy" /></div>
                    <div className="feature-row__body">
                      <span className="tag">Perspective {String(i + 1).padStart(2, '0')}</span>
                      <h3>{p.title}</h3>
                      <p>{p.description}</p>
                      <Link to="/give?campaign=lrc-auditorium" className="link-arrow">Contribute <Icon name="arrowRight" size={16} /></Link>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </AsyncContent>
        </div>
      </section>
    </>
  );
}
