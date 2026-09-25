import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHero from '../../components/ui/PageHero.jsx';
import SectionHeading from '../../components/ui/SectionHeading.jsx';
import AsyncContent from '../../components/ui/AsyncContent.jsx';
import Icon from '../../components/ui/Icon.jsx';
import { useContent } from '../../hooks/useContent.js';
import { assetUrl } from '../../api/client.js';

function ScholarPhoto({ scholar }) {
  const [failed, setFailed] = useState(false);
  if (!scholar.image || failed) {
    const [last, first = ''] = scholar.name.split(',').map((s) => s.trim());
    return <div className="scholar__placeholder" aria-hidden="true">{`${first[0] || ''}${last[0] || ''}`}</div>;
  }
  return <img src={assetUrl(scholar.image)} alt={scholar.name} loading="lazy" onError={() => setFailed(true)} />;
}

function ScholarGrid({ scholars }) {
  const [college, setCollege] = useState('All');
  const [query, setQuery] = useState('');

  const colleges = useMemo(() => ['All', ...new Set(scholars.map((s) => s.college))], [scholars]);
  const filtered = scholars.filter(
    (s) => (college === 'All' || s.college === college) && s.name.toLowerCase().includes(query.trim().toLowerCase())
  );

  return (
    <>
      <div className="toolbar">
        <div className="chips">
          {colleges.map((c) => (
            <button key={c} type="button" className={`chip ${college === c ? 'is-selected' : ''}`} onClick={() => setCollege(c)}>
              {c.replace('College of ', '')}
            </button>
          ))}
        </div>
        <label className="search">
          <Icon name="search" size={18} />
          <input type="search" placeholder="Search scholars" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search scholars" />
        </label>
      </div>

      {filtered.length ? (
        <div className="grid grid-4">
          {filtered.map((s) => (
            <article key={s.id} className="card scholar">
              <div className="scholar__img"><ScholarPhoto scholar={s} /></div>
              <div className="scholar__body">
                <h3>{s.name}</h3>
                <span>{s.college}</span>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="empty">No scholars match your search.</p>
      )}
    </>
  );
}

export default function SupportCentralino() {
  const scholars = useContent('scholars');

  return (
    <>
      <PageHero
        eyebrow="Support-a-Centralino"
        title="Shape a Future: Empower MCU Scholars and Ignite the Legacy!"
        subtitle="Help deserving students complete their academic journey. Your support turns potential into purpose."
        image="https://alumni.mcu.edu.ph/wp-content/uploads/2024/10/volunteer3-1024x538.webp"
      >
        <Link to="/give?campaign=scholarship" className="btn btn-gold btn-lg"><Icon name="heart" size={18} /> Sponsor a scholar</Link>
        <a href="tel:+639171046520" className="btn btn-outline-light btn-lg"><Icon name="phone" size={18} /> 0917 104 6520</a>
      </PageHero>

      <section className="section">
        <div className="container">
          <SectionHeading
            eyebrow="Meet our scholars"
            title="Centralinos you can support today"
            text="These students are working hard toward their degrees in nursing, medical technology, optometry, psychology and more."
          />
          <AsyncContent state={scholars} skeleton={8}>
            {(data) => <ScholarGrid scholars={data} />}
          </AsyncContent>
        </div>
      </section>
    </>
  );
}
