import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Icon from '../../components/ui/Icon.jsx';
import { getEvent, eventIcsUrl, assetUrl } from '../../api/client.js';
import { categoryOf, longDate, timeRange, deadlineInfo, isPast, shortDate, time } from '../../components/events/eventUtils.js';
import '../../styles/events.css';

function useEvent(slug) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  useEffect(() => {
    let active = true;
    setState({ data: null, loading: true, error: null });
    getEvent(slug)
      .then((data) => active && setState({ data, loading: false, error: null }))
      .catch((error) => active && setState({ data: null, loading: false, error }));
    return () => {
      active = false;
    };
  }, [slug]);
  return state;
}

function CopyLink() {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };
  return (
    <button type="button" className="btn btn-outline btn-block" onClick={copy}>
      <Icon name={copied ? 'check' : 'copy'} size={16} /> {copied ? 'Link copied' : 'Copy link to share'}
    </button>
  );
}

export default function EventDetail() {
  const { slug } = useParams();
  const { data: e, loading, error } = useEvent(slug);

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

  const cat = categoryOf(e.category);
  const deadline = deadlineInfo(e);
  const cancelled = e.status === 'cancelled';
  const past = isPast(e);
  const canRegister = e.registrationUrl && !cancelled && !past && !(deadline && deadline.closed);

  return (
    <div className="ev-detail" style={{ '--cat': cat.color }}>
      <header className="ev-hero" style={e.image ? { '--ev-image': `url("${assetUrl(e.image)}")` } : undefined}>
        <div className="container ev-hero__inner">
          <Link to="/events" className="ev-hero__back"><Icon name="arrowRight" size={14} /> All events</Link>
          <div className="ev-hero__chips">
            <span className="ev-chip ev-chip--light"><Icon name={cat.icon} size={12} /> {cat.label}</span>
            {cancelled && <span className="ev-chip ev-chip--cancelled">Cancelled</span>}
            {past && !cancelled && <span className="ev-chip ev-chip--light">Past event</span>}
            {e.network && <span className="ev-chip ev-chip--light"><Icon name="users" size={12} /> {e.network.name}</span>}
          </div>
          <h1 className={cancelled ? 'is-cancelled' : ''}>{e.title}</h1>
          {e.summary && <p>{e.summary}</p>}
          <div className="ev-hero__when">
            <span><Icon name="calendar" size={16} /> {longDate(e.startAt)}</span>
            <span><Icon name="clock" size={16} /> {timeRange(e)}</span>
            {e.venue && <span><Icon name="pin" size={16} /> {e.venue}</span>}
          </div>
        </div>
      </header>

      <section className="ev-section ev-section--detail">
        <div className="container ev-detail__grid">
          <article className="ev-detail__body">
            {cancelled && (
              <div className="ev-notice ev-notice--cancelled">
                <Icon name="close" size={18} />
                <p><strong>This event has been cancelled.</strong> Please contact the Alumni Relations Office for details.</p>
              </div>
            )}
            <h2>About this event</h2>
            {e.description ? (
              e.description.split(/\n{2,}/).map((para, i) => <p key={i}>{para}</p>)
            ) : (
              <p className="muted">More details will be posted soon.</p>
            )}
          </article>

          <aside className="ev-detail__side">
            <div className="ev-info">
              <h3>Event details</h3>
              <dl>
                <div><dt><Icon name="calendar" size={16} /> Date</dt><dd>{longDate(e.startAt)}{e.endAt && longDate(e.endAt) !== longDate(e.startAt) ? ` to ${longDate(e.endAt)}` : ''}</dd></div>
                <div><dt><Icon name="clock" size={16} /> Time</dt><dd>{timeRange(e)} <small>(Philippine time)</small></dd></div>
                {e.venue && <div><dt><Icon name="pin" size={16} /> Venue</dt><dd>{e.venue}</dd></div>}
                {e.onlineUrl && <div><dt><Icon name="external" size={16} /> Online</dt><dd><a href={e.onlineUrl} target="_blank" rel="noreferrer">Join online</a></dd></div>}
                {e.capacity && <div><dt><Icon name="users" size={16} /> Slots</dt><dd>{e.capacity.toLocaleString()} participants</dd></div>}
                {e.registrationDeadline && (
                  <div>
                    <dt><Icon name="clock" size={16} /> Registration</dt>
                    <dd>
                      Until {shortDate(e.registrationDeadline)}, {time(e.registrationDeadline)}
                      {deadline && <span className={`ev-chip ${deadline.closed ? 'ev-chip--cancelled' : deadline.soon ? 'ev-chip--soon' : 'ev-chip--ok'}`}>{deadline.closed ? 'Closed' : deadline.countdown}</span>}
                    </dd>
                  </div>
                )}
              </dl>
              <div className="ev-info__actions">
                {canRegister && (
                  <a href={e.registrationUrl} target="_blank" rel="noreferrer" className="btn btn-gold btn-lg btn-block">
                    Register now <Icon name="external" size={16} />
                  </a>
                )}
                {!cancelled && !past && (
                  <a href={eventIcsUrl(e.slug)} className="btn btn-primary btn-block" download>
                    <Icon name="calendar" size={16} /> Add to my calendar
                  </a>
                )}
                <CopyLink />
              </div>
            </div>
            <div className="ev-help">
              <Icon name="mail" size={18} />
              <p>Questions about this event? Email <a href="mailto:alumni@mcu.edu.ph">alumni@mcu.edu.ph</a> or call (+63) 917 104 6520.</p>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
