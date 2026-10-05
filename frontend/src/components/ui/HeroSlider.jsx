import { Link } from 'react-router-dom';
import Carousel from 'react-bootstrap/Carousel';
import Icon from './Icon.jsx';
import { assetUrl } from '../../api/client.js';

// Site paths ("/give") use the router; full URLs open normally.
function SlideButton({ href, className, children }) {
  if (!href) return null;
  return /^https?:\/\//.test(href) ? (
    <a href={href} className={className} target="_blank" rel="noreferrer">{children}</a>
  ) : (
    <Link to={href} className={className}>{children}</Link>
  );
}

// Homepage hero slider (React Bootstrap Carousel) styled with the MCU hero design.
// Slides come from GET /api/v1/slides and are managed in Admin > Homepage slider.
export default function HeroSlider({ slides }) {
  if (!slides?.length) return null;

  // Respect "reduce motion": no auto-advance or slide animation.
  const reduceMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const multiple = slides.length > 1;

  return (
    <Carousel
      className="hero-slider"
      interval={reduceMotion || !multiple ? null : 6000}
      pause="hover"
      fade
      slide={!reduceMotion}
      indicators={multiple}
      controls={multiple}
      touch
      aria-label="Highlights"
    >
      {slides.map((s, i) => (
        <Carousel.Item key={s.id ?? s.title}>
          <section className="hero hero-slider__slide" style={{ '--hero-image': `url("${assetUrl(s.image)}")` }}>
            <div className="container hero__inner">
              {s.eyebrow && <span className="eyebrow eyebrow--light">{s.eyebrow}</span>}
              {/* Only the first slide is the page's main heading. */}
              {i === 0 ? <h1>{s.title}</h1> : <h2 className="hero-slider__title">{s.title}</h2>}
              {s.subtitle && <p>{s.subtitle}</p>}
              {(s.primaryLabel || s.secondaryLabel) && (
                <div className="hero__actions">
                  {s.primaryLabel && (
                    <SlideButton href={s.primaryLink} className="btn btn-gold btn-lg">
                      {s.primaryLabel} <Icon name="arrowRight" size={18} />
                    </SlideButton>
                  )}
                  {s.secondaryLabel && (
                    <SlideButton href={s.secondaryLink} className="btn btn-outline-light btn-lg">
                      {s.secondaryLabel}
                    </SlideButton>
                  )}
                </div>
              )}
            </div>
          </section>
        </Carousel.Item>
      ))}
    </Carousel>
  );
}
