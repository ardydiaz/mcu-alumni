import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import Icon from '../ui/Icon.jsx';
import { assetUrl } from '../../api/client.js';
import { categoryOf } from './eventUtils.js';
import { useEvent, EventAbout } from './EventDetailParts.jsx';
import { DateTile, Chips, Facts, ActionCard } from './EventLayout.jsx';

/**
 * Opens events in a modal on the current page, kept in the address bar as ?event=<slug>:
 * the browser Back button closes it, and the full page (/events/<slug>) stays available for shared links.
 */
export function useEventModal() {
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const slug = params.get('event');
  const [preview, setPreview] = useState(null); // the event from the list, shown while the details load

  const open = useCallback(
    (event) => {
      setPreview(event);
      setParams(
        (p) => {
          const next = new URLSearchParams(p);
          next.set('event', event.slug);
          return next;
        },
        { state: { eventModal: true }, preventScrollReset: true }
      );
    },
    [setParams]
  );

  const close = useCallback(() => {
    if (location.state?.eventModal) navigate(-1); // opened here: going back closes it
    else {
      setParams(
        (p) => {
          const next = new URLSearchParams(p);
          next.delete('event');
          return next;
        },
        { replace: true, preventScrollReset: true }
      );
    }
  }, [location.state, navigate, setParams]);

  return { slug, preview: preview?.slug === slug ? preview : null, open, close };
}

export default function EventModal({ slug, preview, onClose }) {
  const ref = useRef(null);
  const [version, setVersion] = useState(0);
  const { data, loading, error } = useEvent(slug, version);
  const e = data || preview;

  // Native <dialog>: focus trap, Escape and backdrop for free. The page behind doesn't scroll while it's open.
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return undefined;
    if (slug && !dialog.open) dialog.showModal();
    if (!slug && dialog.open) dialog.close();
    document.documentElement.classList.toggle('evm-lock', Boolean(slug));
    return () => document.documentElement.classList.remove('evm-lock');
  }, [slug]);

  const cat = e ? categoryOf(e.category) : null;

  return (
    <dialog
      ref={ref}
      className="evm"
      aria-labelledby="evm-title"
      onCancel={(ev) => {
        ev.preventDefault();
        onClose();
      }}
      onClick={(ev) => ev.target === ref.current && onClose()}
    >
      {slug && (
        // autoFocus: the dialog starts focused on its content (not the close button); Tab still reaches every control.
        // eslint-disable-next-line jsx-a11y/no-autofocus
        <div className="evm__panel" tabIndex={-1} autoFocus style={cat ? { '--cat': cat.color } : undefined}>
          <button type="button" className="evm__close" onClick={onClose} aria-label="Close">
            <Icon name="close" size={20} />
          </button>

          {e ? (
            <>
              <header className={`evm__head${e.image ? ' has-image' : ''}`} style={e.image ? { '--ev-image': `url("${assetUrl(e.image)}")` } : undefined}>
                <DateTile event={e} />
                <div className="evm__heading">
                  <Chips event={e} />
                  <h2 id="evm-title" className={e.status === 'cancelled' ? 'is-cancelled' : ''}>{e.title}</h2>
                  {e.summary && <p>{e.summary}</p>}
                </div>
              </header>

              <Facts event={e} />

              <div className="evm__body">
                <article className="evm__about">
                  {loading && !data ? <div className="skeleton evm__skel" /> : <EventAbout event={e} />}
                  <p className="evm__help">
                    <Icon name="mail" size={16} />
                    <span>Questions? Email <a href="mailto:alumni@mcu.edu.ph">alumni@mcu.edu.ph</a> or call (+63) 917 104 6520.</span>
                  </p>
                </article>
                <aside className="evm__side">
                  <ActionCard event={e} onChange={() => setVersion((v) => v + 1)} />
                </aside>
              </div>
            </>
          ) : error ? (
            <div className="evm__state">
              <span className="ev-empty__icon" aria-hidden="true"><Icon name="calendar" size={26} /></span>
              <h2 id="evm-title">{error.status === 404 ? 'This event could not be found' : "We couldn't load this event"}</h2>
              <p className="muted">It may have been removed or the link is incomplete.</p>
              <button type="button" className="btn btn-primary" onClick={onClose}>Back to events</button>
            </div>
          ) : (
            <div className="evm__state" aria-busy="true">
              <span className="spinner spinner--dark" aria-hidden="true" />
              <h2 id="evm-title" className="sr-only">Loading event</h2>
            </div>
          )}
        </div>
      )}
    </dialog>
  );
}
