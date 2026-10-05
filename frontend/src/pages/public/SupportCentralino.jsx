import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHero from '../../components/ui/PageHero.jsx';
import AsyncContent from '../../components/ui/AsyncContent.jsx';
import Icon from '../../components/ui/Icon.jsx';
import { useContent } from '../../hooks/useContent.js';
import { useReveal } from '../../hooks/useReveal.js';
import { assetUrl } from '../../api/client.js';
import '../../styles/support-centralino.css';

const SPONSOR_LINK = '/give?campaign=scholarship';
const STEPS = [
  { icon: 'users', title: 'Meet our scholars', text: 'Browse the Centralinos below who are working toward their degrees.' },
  { icon: 'heart', title: 'Pledge your support', text: 'Submit a pledge to the Enabling Excellence scholarship campaign.' },
  { icon: 'building', title: 'Transfer to MCU', text: 'Deposit to our BPI or PNB account and we confirm your gift.' },
];

// Names are stored as "Last, First Middle".
function splitName(name) {
  const [last, first = ''] = name.split(',').map((s) => s.trim());
  return { last, first };
}

function shortCollege(college) {
  return college.replace('College of ', '');
}

function ScholarPhoto({ scholar }) {
  const [failed, setFailed] = useState(false);
  if (!scholar.image || failed) {
    const { last, first } = splitName(scholar.name);
    return <div className="sac-scholar__placeholder" aria-hidden="true">{`${first[0] || ''}${last[0] || ''}`}</div>;
  }
  return <img src={assetUrl(scholar.image)} alt={scholar.name} loading="lazy" onError={() => setFailed(true)} />;
}

function ScholarCard({ scholar, index }) {
  const { last, first } = splitName(scholar.name);
  return (
    <article className="sac-scholar" style={{ '--i': Math.min(index, 11) }}>
      <div className="sac-scholar__img">
        <ScholarPhoto scholar={scholar} />
        <span className="sac-scholar__college">{shortCollege(scholar.college)}</span>
      </div>
      <div className="sac-scholar__body">
        <h3>
          <span className="sac-scholar__last">{last}</span>
          {first}
        </h3>
        <Link to={SPONSOR_LINK} className="sac-scholar__cta" aria-label={`Sponsor ${scholar.name}`}>
          Sponsor <Icon name="arrowRight" size={15} />
        </Link>
      </div>
    </article>
  );
}

function ScholarGrid({ scholars }) {
  const [college, setCollege] = useState('All');
  const [query, setQuery] = useState('');

  const colleges = useMemo(() => {
    const counts = new Map();
    scholars.forEach((s) => counts.set(s.college, (counts.get(s.college) || 0) + 1));
    return [['All', scholars.length], ...counts];
  }, [scholars]);

  const q = query.trim().toLowerCase();
  const filtered = scholars.filter((s) => (college === 'All' || s.college === college) && s.name.toLowerCase().includes(q));
  const clear = () => {
    setCollege('All');
    setQuery('');
  };

  return (
    <>
      <div className="sac-toolbar">
        <div className="sac-filters" role="group" aria-label="Filter by college">
          {colleges.map(([c, count]) => (
            <button
              key={c}
              type="button"
              className={`sac-filter ${college === c ? 'is-selected' : ''}`}
              aria-pressed={college === c}
              onClick={() => setCollege(c)}
            >
              {shortCollege(c)}
              <span className="sac-filter__count">{count}</span>
            </button>
          ))}
        </div>
        <label className="sac-search">
          <Icon name="search" size={18} />
          <input type="search" placeholder="Search by name" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search scholars" />
        </label>
      </div>

      <p className="sac-results" aria-live="polite">
        Showing <strong>{filtered.length}</strong> of {scholars.length} scholars
      </p>

      {filtered.length ? (
        // key re-mounts the grid so the cards animate in again after filtering
        <div className="sac-grid" key={`${college}|${q}`}>
          {filtered.map((s, i) => <ScholarCard key={s.id} scholar={s} index={i} />)}
        </div>
      ) : (
        <div className="sac-empty">
          <span className="sac-empty__icon" aria-hidden="true"><Icon name="search" size={24} /></span>
          <strong>No scholars match your search</strong>
          <p>Try another name or college.</p>
          <button type="button" className="btn btn-outline" onClick={clear}>Clear filters</button>
        </div>
      )}
    </>
  );
}

export default function SupportCentralino() {
  const scholars = useContent('scholars');
  useReveal([scholars.data]);

  const stats = scholars.data
    ? [
        { icon: 'users', value: scholars.data.length, label: 'Scholars to support' },
        { icon: 'building', value: new Set(scholars.data.map((s) => s.college)).size, label: 'Colleges represented' },
        { icon: 'award', value: '1904', label: 'Shaping Centralinos since' },
      ]
    : null;

  return (
    <div className="sac">
      <PageHero
        eyebrow="Support-a-Centralino"
        title="Shape a Future: Empower MCU Scholars and Ignite the Legacy!"
        subtitle="Help deserving students complete their academic journey. Your support turns potential into purpose."
        image="/images/support-centralino-banner.webp"
        variant="glass"
        imagePosition="center 28%"
      >
        <Link to={SPONSOR_LINK} className="btn btn-gold btn-lg"><Icon name="heart" size={18} /> Sponsor a scholar</Link>
        <a href="tel:+639171046520" className="btn btn-outline-light btn-lg"><Icon name="phone" size={18} /> 0917 104 6520</a>
      </PageHero>

      {/* Impact numbers: overlap the bottom of the banner */}
      {stats && (
        <div className="container">
          <ul className="sac-stats">
            {stats.map((s) => (
              <li key={s.label}>
                <span className="sac-stats__icon" aria-hidden="true"><Icon name={s.icon} size={20} /></span>
                <div>
                  <strong>{s.value}</strong>
                  <span>{s.label}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <section className="sac-section">
        <div className="container sac-how">
          <div className="sac-how__text" data-reveal>
            <span className="sac-eyebrow">Why sponsor</span>
            <h2>Every scholar is one step closer to a white coat</h2>
            <p>
              Our scholars are future nurses, medical technologists, optometrists and psychologists. Your gift helps
              them stay in school, focus on their studies and give back to the communities they will serve.
            </p>
            <Link to={SPONSOR_LINK} className="btn btn-primary btn-lg">Start sponsoring <Icon name="arrowRight" size={18} /></Link>
          </div>
          <ol className="sac-steps">
            {STEPS.map((s, i) => (
              <li key={s.title} data-reveal style={{ '--delay': `${i * 100}ms` }}>
                <span className="sac-steps__num" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                <div>
                  <strong>{s.title}</strong>
                  <span>{s.text}</span>
                </div>
                <span className="sac-steps__icon" aria-hidden="true"><Icon name={s.icon} size={20} /></span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="sac-section sac-section--tinted" id="scholars">
        <div className="container">
          <div className="sac-heading" data-reveal>
            <span className="sac-eyebrow">Meet our scholars</span>
            <h2>Centralinos you can support today</h2>
            <p>These students are working hard toward their degrees in nursing, medical technology, optometry, psychology and more.</p>
          </div>
          <AsyncContent state={scholars} skeleton={8}>
            {(data) => <ScholarGrid scholars={data} />}
          </AsyncContent>
        </div>
      </section>

      <section className="sac-section sac-section--cta">
        <div className="container">
          <div className="sac-cta" data-reveal>
            <div>
              <span className="sac-cta__eyebrow">Be the reason they graduate</span>
              <h2>Turn potential into purpose today</h2>
              <p>Gifts of any amount go to the scholarship campaign. Our team will reach out to confirm your donation.</p>
            </div>
            <div className="sac-cta__actions">
              <Link to={SPONSOR_LINK} className="btn btn-gold btn-lg"><Icon name="heart" size={18} /> Sponsor a scholar</Link>
              <a href="tel:+639171046520" className="btn btn-outline-light btn-lg"><Icon name="phone" size={18} /> Call us</a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
