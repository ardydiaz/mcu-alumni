import { useState } from 'react';
import PageHero from '../../components/ui/PageHero.jsx';
import AsyncContent from '../../components/ui/AsyncContent.jsx';
import Icon from '../../components/ui/Icon.jsx';
import { useContent } from '../../hooks/useContent.js';
import { useReveal } from '../../hooks/useReveal.js';
import { assetUrl } from '../../api/client.js';
import '../../styles/networks.css';

const OFFICE_EMAIL = 'alumni@mcu.edu.ph';
const BENEFITS = [
  { icon: 'users', title: 'Lifelong connections', text: 'Stay close to your batchmates and college.' },
  { icon: 'rocket', title: 'Career and mentorship', text: 'Grow with fellow Centralinos in your field.' },
  { icon: 'heart', title: 'Give back together', text: 'Support students and university projects.' },
];
const START_STEPS = [
  { title: 'Gather your group', text: 'Rally alumni from your college, batch or city.' },
  { title: 'Choose your officers', text: 'Pick a president and core team to lead the chapter.' },
  { title: 'Reach out to us', text: 'Email the Alumni Relations Office with your plans.' },
  { title: 'Launch your chapter', text: 'We help you get recognized and plan your first event.' },
];

const mailto = (subject) => `mailto:${OFFICE_EMAIL}?subject=${encodeURIComponent(subject)}`;

function ChapterLogo({ chapter }) {
  const [failed, setFailed] = useState(false);
  if (!chapter.logo || failed) {
    const letters = chapter.name.replace(/[^A-Z]/g, '').slice(0, 3) || 'MCU';
    return <span className="nw-card__fallback" aria-hidden="true">{letters}</span>;
  }
  return <img src={assetUrl(chapter.logo)} alt="" loading="lazy" onError={() => setFailed(true)} />;
}

function ChapterCard({ chapter, index }) {
  return (
    <article className="nw-card" data-reveal style={{ '--delay': `${(index % 3) * 90}ms` }}>
      <div className="nw-card__top">
        <div className="nw-card__logo"><ChapterLogo chapter={chapter} /></div>
        <span className="nw-card__num">{String(index + 1).padStart(2, '0')}</span>
      </div>
      <h3>{chapter.name}</h3>
      {chapter.description && <p className="nw-card__desc">{chapter.description}</p>}
      {chapter.president && (
        <div className="nw-card__president">
          <span className="nw-card__president-icon" aria-hidden="true"><Icon name="award" size={16} /></span>
          <span>
            <small>President</small>
            <strong>{chapter.president}</strong>
          </span>
        </div>
      )}
      <div className="nw-card__actions">
        <a href={chapter.contactEmail ? `mailto:${chapter.contactEmail}` : mailto(`Joining the ${chapter.name}`)} className="nw-card__join">
          <Icon name="mail" size={16} /> {chapter.contactEmail ? 'Email the chapter' : 'Ask to join'}
        </a>
        {chapter.facebookUrl && (
          <a href={chapter.facebookUrl} target="_blank" rel="noreferrer" className="nw-card__social" aria-label={`${chapter.name} on Facebook`}>
            <Icon name="Facebook" size={16} />
          </a>
        )}
      </div>
    </article>
  );
}

export default function Networks() {
  const networks = useContent('networks');
  useReveal([networks.data]);

  return (
    <div className="nw">
      <PageHero
        eyebrow="Alumni Networks"
        title="Join the legacy, sign up today!"
        subtitle="Embrace connections, opportunities, and lifelong memories through organizing alumni chapters."
        image="/images/networks-banner.webp"
        variant="glass"
        imagePosition="center 35%"
      >
        <a href="#chapters" className="btn btn-gold btn-lg"><Icon name="users" size={18} /> Find your chapter</a>
        <a href="#start" className="btn btn-outline-light btn-lg">Start a chapter</a>
      </PageHero>

      {/* Why join: overlaps the bottom of the banner */}
      <div className="container">
        <ul className="nw-benefits">
          {networks.data && (
            <li className="nw-benefits__stat">
              <strong>{networks.data.length}</strong>
              <span>alumni associations</span>
            </li>
          )}
          {BENEFITS.map((b) => (
            <li key={b.title}>
              <span className="nw-benefits__icon" aria-hidden="true"><Icon name={b.icon} size={20} /></span>
              <div>
                <strong>{b.title}</strong>
                <span>{b.text}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <section className="nw-section" id="chapters">
        <div className="container">
          <div className="nw-heading" data-reveal>
            <div>
              <span className="nw-eyebrow">Chapters</span>
              <h2>MCU alumni associations</h2>
            </div>
            <p>Connect with the association of your college and stay involved with your batch.</p>
          </div>
          <AsyncContent state={networks} skeleton={6}>
            {(items) =>
              items.length ? (
                <div className="nw-grid">
                  {items.map((n, i) => <ChapterCard key={n.id ?? n.name} chapter={n} index={i} />)}
                  <a href="#start" className="nw-card nw-card--new" data-reveal>
                    <span className="nw-card--new__icon" aria-hidden="true"><Icon name="plus" size={26} /></span>
                    <h3>Start your chapter</h3>
                    <p className="nw-card__desc">Don't see your college, batch or city? Organize a new alumni chapter.</p>
                    <span className="nw-card--new__link">Learn how <Icon name="arrowRight" size={16} /></span>
                  </a>
                </div>
              ) : (
                <p className="empty">Alumni associations will be listed here soon.</p>
              )
            }
          </AsyncContent>
        </div>
      </section>

      <section className="nw-section nw-section--tinted" id="start">
        <div className="container nw-start">
          <div className="nw-start__text" data-reveal>
            <span className="nw-eyebrow">Start a chapter</span>
            <h2>Don't see your college, batch or city?</h2>
            <p>Organize an alumni chapter and bring Centralinos together. We'll help you get started.</p>
            <ol className="nw-steps">
              {START_STEPS.map((s, i) => (
                <li key={s.title} data-reveal style={{ '--delay': `${i * 80}ms` }}>
                  <span className="nw-steps__num" aria-hidden="true">{i + 1}</span>
                  <div>
                    <strong>{s.title}</strong>
                    <span>{s.text}</span>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <aside className="nw-contact" data-reveal style={{ '--delay': '120ms' }}>
            <span className="nw-contact__icon" aria-hidden="true"><Icon name="handshake" size={26} /></span>
            <span className="nw-contact__eyebrow">We're here to help</span>
            <h3>Talk to the Alumni Relations Office</h3>
            <p>Tell us about the chapter you'd like to organize and we'll guide you through the next steps.</p>
            <a href={mailto('Organizing an alumni chapter')} className="btn btn-gold btn-lg btn-block"><Icon name="mail" size={18} /> Email us</a>
            <a href="tel:+639171046520" className="btn btn-outline-light btn-lg btn-block"><Icon name="phone" size={18} /> (+63) 917 104 6520</a>
          </aside>
        </div>
      </section>
    </div>
  );
}
