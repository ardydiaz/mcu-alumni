import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHero from '../../components/ui/PageHero.jsx';
import Icon from '../../components/ui/Icon.jsx';
import EventCard, { modalClick } from '../../components/events/EventCard.jsx';
import EventModal, { useEventModal } from '../../components/events/EventModal.jsx';
import { getEvents } from '../../api/client.js';
import { CATEGORIES, categoryOf, eventDays, monthGrid, monthTitle, todayKey, longDate, timeRange } from '../../components/events/eventUtils.js';
import '../../styles/events.css';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Fetches events for the given query; re-runs when the query changes.
function useEvents(params) {
  const key = JSON.stringify(params);
  const [state, setState] = useState({ data: [], loading: true, error: null });
  useEffect(() => {
    let active = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    getEvents(JSON.parse(key))
      .then((res) => active && setState({ data: res.data, loading: false, error: null }))
      .catch((error) => active && setState({ data: [], loading: false, error }));
    return () => {
      active = false;
    };
  }, [key]);
  return state;
}

function CategoryFilter({ value, onChange }) {
  return (
    <div className="ev-filters" role="group" aria-label="Filter by type">
      <button type="button" className={`ev-filter ${!value ? 'is-selected' : ''}`} aria-pressed={!value} onClick={() => onChange('')}>All events</button>
      {Object.entries(CATEGORIES).map(([key, c]) => (
        <button key={key} type="button" className={`ev-filter ${value === key ? 'is-selected' : ''}`} aria-pressed={value === key} style={{ '--cat': c.color }} onClick={() => onChange(key)}>
          <span className="ev-dot" aria-hidden="true" /> {c.label}
        </button>
      ))}
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="ev-empty">
      <span className="ev-empty__icon" aria-hidden="true"><Icon name="calendar" size={26} /></span>
      <strong>{text}</strong>
      <p>New reunions, homecoming activities and chapter events will appear here. Meanwhile, join a chapter or volunteer.</p>
      <div className="ev-empty__actions">
        <Link to="/networks" className="btn btn-outline">Find your chapter</Link>
        <Link to="/volunteer" className="btn btn-primary">Volunteer</Link>
      </div>
    </div>
  );
}

function MonthCalendar({ category, onOpen }) {
  const today = todayKey();
  const [cursor, setCursor] = useState(() => ({ y: Number(today.slice(0, 4)), m: Number(today.slice(5, 7)) - 1 }));
  const [selected, setSelected] = useState(today);
  const grid = useMemo(() => monthGrid(cursor.y, cursor.m), [cursor]);

  // Everything that touches the visible 6 weeks, in Manila time.
  const { data, loading, error } = useEvents({
    from: `${grid[0].key}T00:00:00+08:00`,
    to: `${grid[41].key}T23:59:59+08:00`,
    category,
    limit: 100,
  });

  const byDay = useMemo(() => {
    const map = {};
    for (const e of data) for (const k of eventDays(e)) (map[k] ||= []).push(e);
    return map;
  }, [data]);

  const move = (delta) => {
    setCursor(({ y, m }) => {
      const d = new Date(Date.UTC(y, m + delta, 1));
      return { y: d.getUTCFullYear(), m: d.getUTCMonth() };
    });
  };
  const goToday = () => {
    setCursor({ y: Number(today.slice(0, 4)), m: Number(today.slice(5, 7)) - 1 });
    setSelected(today);
  };

  const monthKey = `${cursor.y}-${String(cursor.m + 1).padStart(2, '0')}`;
  const inMonth = data.filter((e) => eventDays(e).some((k) => k.startsWith(monthKey)));
  const selectedEvents = byDay[selected] || [];
  const selectedInMonth = selected.startsWith(monthKey);

  return (
    <div className="ev-cal-layout">
      <section className="ev-cal" aria-label="Events calendar">
        <header className="ev-cal__head">
          <h2>{monthTitle(cursor.y, cursor.m)}</h2>
          <div className="ev-cal__nav">
            <button type="button" className="ev-cal__today" onClick={goToday}>Today</button>
            <button type="button" className="ev-cal__arrow ev-cal__arrow--prev" onClick={() => move(-1)} aria-label="Previous month"><Icon name="arrowRight" size={18} /></button>
            <button type="button" className="ev-cal__arrow" onClick={() => move(1)} aria-label="Next month"><Icon name="arrowRight" size={18} /></button>
          </div>
        </header>
        <div className="ev-cal__weekdays" aria-hidden="true">
          {WEEKDAYS.map((d) => <span key={d}>{d}</span>)}
        </div>
        <div className={`ev-cal__grid ${loading ? 'is-loading' : ''}`} role="grid">
          {grid.map((cell) => {
            const events = byDay[cell.key] || [];
            return (
              <button
                key={cell.key}
                type="button"
                role="gridcell"
                className={['ev-day', !cell.inMonth && 'is-outside', cell.key === today && 'is-today', cell.key === selected && 'is-selected', events.length && 'has-events'].filter(Boolean).join(' ')}
                onClick={() => setSelected(cell.key)}
                aria-label={`${longDate(`${cell.key}T12:00:00+08:00`)}${events.length ? `, ${events.length} event${events.length > 1 ? 's' : ''}` : ''}`}
                aria-pressed={cell.key === selected}
              >
                <span className="ev-day__num">{cell.day}</span>
                <span className="ev-day__events">
                  {events.slice(0, 2).map((e) => (
                    <span key={e.id} className={`ev-pill ${e.status === 'cancelled' ? 'is-cancelled' : ''}`} style={{ '--cat': categoryOf(e.category).color }}>{e.title}</span>
                  ))}
                  {events.length > 2 && <span className="ev-more">+{events.length - 2} more</span>}
                </span>
                {events.length > 0 && (
                  <span className="ev-day__dots" aria-hidden="true">
                    {events.slice(0, 3).map((e) => <span key={e.id} style={{ '--cat': categoryOf(e.category).color }} />)}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        {error && <p className="ev-error">We couldn't load events right now. Please try again later.</p>}
      </section>

      <aside className="ev-side">
        <div className="ev-side__card">
          <span className="ev-side__eyebrow">{selectedInMonth || selectedEvents.length ? 'Selected day' : 'This month'}</span>
          <h3>{longDate(`${selected}T12:00:00+08:00`)}</h3>
          {selectedEvents.length ? (
            <div className="ev-side__list">{selectedEvents.map((e) => <EventCard key={e.id} event={e} compact onOpen={onOpen} />)}</div>
          ) : (
            <p className="muted ev-side__none">No events on this day.</p>
          )}
        </div>
        <div className="ev-side__card">
          <span className="ev-side__eyebrow">In {monthTitle(cursor.y, cursor.m)}</span>
          {inMonth.length ? (
            <ul className="ev-side__month">
              {inMonth.map((e) => (
                <li key={e.id}>
                  <Link to={`/events/${e.slug}`} onClick={modalClick(onOpen, e)} aria-haspopup="dialog" style={{ '--cat': categoryOf(e.category).color }}>
                    <span className="ev-dot" aria-hidden="true" />
                    <span>
                      <strong>{e.title}</strong>
                      <small>{longDate(e.startAt)} · {timeRange(e)}</small>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted ev-side__none">{loading ? 'Loading…' : 'No events this month yet.'}</p>
          )}
        </div>
      </aside>
    </div>
  );
}

function UpcomingList({ category, onOpen }) {
  const { data, loading, error } = useEvents({ upcoming: true, category, limit: 50 });
  if (loading) return <div className="ev-list">{[1, 2, 3].map((i) => <div key={i} className="skeleton ev-skel" />)}</div>;
  if (error) return <p className="ev-error">We couldn't load events right now. Please try again later.</p>;
  if (!data.length) return <EmptyState text="No upcoming events yet" />;

  // Group by month: "November 2026"
  const groups = data.reduce((acc, e) => {
    const k = new Intl.DateTimeFormat('en-PH', { month: 'long', year: 'numeric', timeZone: 'Asia/Manila' }).format(new Date(e.startAt));
    (acc[k] ||= []).push(e);
    return acc;
  }, {});

  return (
    <div className="ev-list">
      {Object.entries(groups).map(([month, events]) => (
        <section key={month} className="ev-list__group">
          <h3>{month}</h3>
          {events.map((e) => <EventCard key={e.id} event={e} onOpen={onOpen} />)}
        </section>
      ))}
    </div>
  );
}

export default function Events() {
  const [view, setView] = useState(() => (typeof window !== 'undefined' && window.innerWidth < 760 ? 'list' : 'calendar'));
  const [category, setCategory] = useState('');
  const modal = useEventModal(); // event details open in a modal (?event=slug)

  return (
    <div className="ev">
      <PageHero
        eyebrow="Alumni Events and Activities"
        title="What's happening for Centralinos"
        subtitle="Reunions, homecoming activities, chapter gatherings and alumni programs. Browse by month or see what's coming up next."
      />
      <section className="ev-section">
        <div className="container">
          <div className="ev-toolbar">
            <CategoryFilter value={category} onChange={setCategory} />
            <div className="ev-views" role="group" aria-label="View">
              <button type="button" className={view === 'calendar' ? 'is-active' : ''} aria-pressed={view === 'calendar'} onClick={() => setView('calendar')}>
                <Icon name="calendar" size={16} /> Calendar
              </button>
              <button type="button" className={view === 'list' ? 'is-active' : ''} aria-pressed={view === 'list'} onClick={() => setView('list')}>
                <Icon name="file" size={16} /> Upcoming
              </button>
            </div>
          </div>
          {view === 'calendar' ? <MonthCalendar category={category} onOpen={modal.open} /> : <UpcomingList category={category} onOpen={modal.open} />}
        </div>
      </section>
      <EventModal slug={modal.slug} preview={modal.preview} onClose={modal.close} />
    </div>
  );
}
