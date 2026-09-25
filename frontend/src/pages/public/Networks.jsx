import PageHero from '../../components/ui/PageHero.jsx';
import SectionHeading from '../../components/ui/SectionHeading.jsx';
import AsyncContent from '../../components/ui/AsyncContent.jsx';
import Icon from '../../components/ui/Icon.jsx';
import { useContent } from '../../hooks/useContent.js';
import { assetUrl } from '../../api/client.js';

export default function Networks() {
  const networks = useContent('networks');

  return (
    <>
      <PageHero
        eyebrow="Alumni Networks"
        title="Join the legacy, sign up today!"
        subtitle="Embrace connections, opportunities, and lifelong memories through organizing alumni chapters."
        image="https://alumni.mcu.edu.ph/wp-content/uploads/2025/06/1-19-scaled-1-1200x800.webp"
      />

      <section className="section">
        <div className="container">
          <SectionHeading eyebrow="Chapters" title="MCU alumni associations" text="Connect with the association of your college and stay involved with your batch." />
          <AsyncContent state={networks} skeleton={6}>
            {(items) => (
              <div className="grid grid-3">
                {items.map((n) => (
                  <article key={n.name} className="card network">
                    <div className="network__logo"><img src={assetUrl(n.logo)} alt="" loading="lazy" /></div>
                    <h3>{n.name}</h3>
                    {n.president && <p><small>President</small>{n.president}</p>}
                  </article>
                ))}
              </div>
            )}
          </AsyncContent>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="cta-band">
            <div>
              <h2>Want to start a chapter?</h2>
              <p>Organize an alumni chapter for your college, batch, or city. We'll help you get started.</p>
            </div>
            <div className="cta-band__actions">
              <a href="mailto:alumni@mcu.edu.ph?subject=Organizing%20an%20alumni%20chapter" className="btn btn-gold btn-lg">
                <Icon name="mail" size={18} /> Email us
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
