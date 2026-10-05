import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHero from '../../components/ui/PageHero.jsx';
import AsyncContent from '../../components/ui/AsyncContent.jsx';
import Icon from '../../components/ui/Icon.jsx';
import { useContent } from '../../hooks/useContent.js';
import { useReveal } from '../../hooks/useReveal.js';
import { assetUrl } from '../../api/client.js';
import '../../styles/campus-development.css';

const GIVE_LINK = '/give?campaign=lrc-auditorium';
const STATUS = {
  planned: { label: 'Planned', icon: 'compass' },
  ongoing: { label: 'In progress', icon: 'clock' },
  completed: { label: 'Completed', icon: 'check' },
};
const PILLARS = [
  { icon: 'book', title: 'Better learning spaces', text: 'Classrooms built for collaboration and technology.' },
  { icon: 'award', title: 'Room to discover', text: 'Laboratories for science and health education.' },
  { icon: 'users', title: 'A campus for everyone', text: 'Venues and play areas for the whole community.' },
];

const number = (i) => String(i + 1).padStart(2, '0');

function StatusBadge({ status }) {
  const s = STATUS[status] || STATUS.planned;
  return (
    <span className={`cd-status cd-status--${status in STATUS ? status : 'planned'}`}>
      <Icon name={s.icon} size={13} /> {s.label}
    </span>
  );
}

// Full-size view of a project perspective. Native <dialog> handles Esc and focus.
function Lightbox({ project, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    if (project && !dialog.open) dialog.showModal();
    if (!project && dialog.open) dialog.close();
  }, [project]);

  return (
    <dialog ref={ref} className="cd-lightbox" onClose={onClose} onClick={(e) => e.target === ref.current && onClose()}>
      {project && (
        <figure>
          <img src={assetUrl(project.image)} alt={`${project.title} perspective`} />
          <figcaption>
            <strong>{project.title}</strong>
            <span>{project.description}</span>
          </figcaption>
        </figure>
      )}
      <button type="button" className="cd-lightbox__close" onClick={onClose} aria-label="Close">
        <Icon name="close" size={20} />
      </button>
    </dialog>
  );
}

function ZoomButton({ project, onOpen }) {
  return (
    <button type="button" className="cd-zoom" onClick={() => onOpen(project)} aria-label={`View ${project.title} full size`}>
      <Icon name="image" size={16} /> View
    </button>
  );
}

function FeaturedProject({ project, onOpen }) {
  return (
    <article className="cd-featured" data-reveal>
      <div className="cd-featured__media">
        <img src={assetUrl(project.image)} alt={`${project.title} perspective`} loading="lazy" />
        <ZoomButton project={project} onOpen={onOpen} />
      </div>
      <div className="cd-featured__body">
        <div className="cd-meta">
          <span className="cd-num">{number(0)}</span>
          <StatusBadge status={project.status} />
        </div>
        <h3>{project.title}</h3>
        <p>{project.description}</p>
        <Link to={GIVE_LINK} className="btn btn-primary">Contribute to this project <Icon name="arrowRight" size={16} /></Link>
      </div>
    </article>
  );
}

function ProjectCard({ project, index, onOpen }) {
  return (
    <article className="cd-card" data-reveal style={{ '--delay': `${(index % 3) * 90}ms` }}>
      <div className="cd-card__media">
        <img src={assetUrl(project.image)} alt={`${project.title} perspective`} loading="lazy" />
        <span className="cd-card__num">{number(index)}</span>
        <ZoomButton project={project} onOpen={onOpen} />
      </div>
      <div className="cd-card__body">
        <StatusBadge status={project.status} />
        <h3>{project.title}</h3>
        <p>{project.description}</p>
        <Link to={GIVE_LINK} className="cd-card__link">Contribute <Icon name="arrowRight" size={16} /></Link>
      </div>
    </article>
  );
}

function Projects({ items }) {
  const [open, setOpen] = useState(null);
  if (!items.length) return <p className="empty">Projects will be announced soon.</p>;
  const [featured, ...rest] = items;

  return (
    <>
      <FeaturedProject project={featured} onOpen={setOpen} />
      {rest.length > 0 && (
        <div className="cd-grid">
          {rest.map((p, i) => <ProjectCard key={p.id ?? p.title} project={p} index={i + 1} onOpen={setOpen} />)}
        </div>
      )}
      <Lightbox project={open} onClose={() => setOpen(null)} />
    </>
  );
}

export default function CampusDevelopment() {
  const projects = useContent('projects');
  useReveal([projects.data]);

  return (
    <div className="cd">
      <PageHero
        eyebrow="Campus Development"
        title="Building spaces where innovation thrives"
        subtitle="Your investment in our infrastructure ensures an environment where innovation thrives, contributing to the betterment of our community and nation."
        image="/images/campus-development-banner.webp"
        overlay="soft"
        imagePosition="center 60%"
      >
        <Link to={GIVE_LINK} className="btn btn-gold btn-lg"><Icon name="building" size={18} /> Support a project</Link>
        <a href="#projects" className="btn btn-outline-light btn-lg">See the projects</a>
      </PageHero>

      {/* What your gift builds: overlaps the bottom of the banner */}
      <div className="container">
        <ul className="cd-pillars">
          {PILLARS.map((p) => (
            <li key={p.title}>
              <span className="cd-pillars__icon" aria-hidden="true"><Icon name={p.icon} size={20} /></span>
              <div>
                <strong>{p.title}</strong>
                <span>{p.text}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <section className="cd-section" id="projects">
        <div className="container">
          <div className="cd-heading" data-reveal>
            <div>
              <span className="cd-eyebrow">Projects</span>
              <h2>What we're building together</h2>
            </div>
            <p>Architectural perspectives of the campus improvements your gifts make possible.</p>
          </div>
          <AsyncContent state={projects} skeleton={3}>
            {(items) => <Projects items={items} />}
          </AsyncContent>
        </div>
      </section>

      <section className="cd-section cd-section--cta">
        <div className="container">
          <div className="cd-cta" data-reveal>
            <div>
              <span className="cd-cta__eyebrow">Leave a lasting mark</span>
              <h2>Help build the next chapter of MCU</h2>
              <p>Every gift brings these spaces closer to reality for generations of Centralinos.</p>
            </div>
            <div className="cd-cta__actions">
              <Link to={GIVE_LINK} className="btn btn-gold btn-lg"><Icon name="heart" size={18} /> Make a pledge</Link>
              <a href="tel:+639171046520" className="btn btn-outline-light btn-lg"><Icon name="phone" size={18} /> Call us</a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
