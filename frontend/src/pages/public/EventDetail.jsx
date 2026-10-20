import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Icon from '../../components/ui/Icon.jsx';
import { assetUrl } from '../../api/client.js';
import { categoryOf } from '../../components/events/eventUtils.js';
import { useEvent, EventAbout } from '../../components/events/EventDetailParts.jsx';
import { DateTile, Chips, Facts, ActionCard } from '../../components/events/EventLayout.jsx';
import '../../styles/events.css';

// Full event page (/events/:slug), for shared links. Same design as the event modal, at page size.
export default function EventDetail() {
  const { slug } = useParams();
  const [version, setVersion] = useState(0);
  const { data: e, loading, error } = useEvent(slug, version);

  if (loading) {
    return (
      <div className="ev-detail-loading container">
        <div className="skeleton" style={{ height: 320 }} />
      </div>
    );
  }
  if (error || !e) {
    return (
      <section className="ev-section">
        <div className="container ev-empty">
          <span className="ev-empty__icon" aria-hidden="true"><Icon name="calendar" size={26} /></span>
          <strong>{error?.status === 404 ? 'This event could not be found' : "We couldn't load this event"}</strong>
          <p>It may have been removed or the link is incomplete.</p>
          <div className="ev-empty__actions"><Link to="/events" className="btn btn-primary">See all events</Link></div>
        </div>
      </section>
    );
  }

  return (
    <div className="evp" style={{ '--cat': categoryOf(e.category).color }}>
      <header className={`evm__head evp__head${e.image ? ' has-image' : ''}`} style={e.image ? { '--ev-image': `url("${assetUrl(e.image)}")` } : undefined}>
        <div className="container evp__head-inner">
          <Link to="/events" className="evp__back"><Icon name="arrowRight" size={14} /> All events</Link>
          <div className="evp__title">
            <DateTile event={e} />
            <div className="evm__heading">
              <Chips event={e} />
              <h1 className={e.status === 'cancelled' ? 'is-cancelled' : ''}>{e.title}</h1>
              {e.summary && <p>{e.summary}</p>}
            </div>
          </div>
        </div>
      </header>

      <div className="container evp__wrap">
        <Facts event={e} />
        <div className="evm__body evp__body">
          <article className="evm__about evp__about">
            <EventAbout event={e} />
            <p className="evm__help">
              <Icon name="mail" size={16} />
              <span>Questions? Email <a href="mailto:alumni@mcu.edu.ph">alumni@mcu.edu.ph</a> or call (+63) 917 104 6520.</span>
            </p>
          </article>
          <aside className="evm__side evp__side">
            <ActionCard event={e} onChange={() => setVersion((v) => v + 1)} fullPageLink={false} />
          </aside>
        </div>
      </div>
    </div>
  );
}
