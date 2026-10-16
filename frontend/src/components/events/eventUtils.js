// Alumni events: categories and date formatting. Event times are always shown in Philippine time,
// whatever the visitor's own time zone is.
export const TZ = 'Asia/Manila';

export const CATEGORIES = {
  alumni: { label: 'Alumni activity', icon: 'users', color: '#5c297c' },
  homecoming: { label: 'Homecoming', icon: 'award', color: '#d29528' },
  chapter: { label: 'Chapter activity', icon: 'handshake', color: '#0f7f86' },
  program: { label: 'Alumni program', icon: 'rocket', color: '#b0306f' },
};
export const categoryOf = (key) => CATEGORIES[key] || CATEGORIES.alumni;

const fmt = (opts) => new Intl.DateTimeFormat('en-PH', { timeZone: TZ, ...opts });
const parts = (d) => Object.fromEntries(fmt({ year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(d)).map((p) => [p.type, p.value]));

// "2026-11-20" (Manila calendar day of a moment)
export const dayKey = (d) => {
  const p = parts(d);
  return `${p.year}-${p.month}-${p.day}`;
};
export const todayKey = () => dayKey(new Date());

export const longDate = (d) => fmt({ weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(d));
export const shortDate = (d) => fmt({ month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(d));
export const time = (d) => fmt({ hour: 'numeric', minute: '2-digit' }).format(new Date(d));
export const monthShort = (d) => fmt({ month: 'short' }).format(new Date(d)).toUpperCase();
export const dayNumber = (d) => fmt({ day: 'numeric' }).format(new Date(d));
export const weekdayShort = (d) => fmt({ weekday: 'short' }).format(new Date(d));

// "9:00 AM – 5:00 PM" / "All day" / "Nov 20 – Nov 22, 2026"
export function timeRange(e) {
  const multiDay = e.endAt && dayKey(e.endAt) !== dayKey(e.startAt);
  if (multiDay) return `${shortDate(e.startAt)}${e.allDay ? '' : `, ${time(e.startAt)}`} – ${shortDate(e.endAt)}${e.allDay ? '' : `, ${time(e.endAt)}`}`;
  if (e.allDay) return 'All day';
  return e.endAt ? `${time(e.startAt)} – ${time(e.endAt)}` : time(e.startAt);
}

// Registration deadline state for badges.
export function deadlineInfo(e, now = new Date()) {
  if (!e.registrationDeadline) return null;
  const ms = new Date(e.registrationDeadline) - now;
  if (ms <= 0) return { closed: true, label: 'Registration closed' };
  const days = Math.ceil(ms / 86400000);
  return {
    closed: false,
    soon: days <= 7,
    label: days <= 1 ? 'Registration closes today' : `Register by ${shortDate(e.registrationDeadline)}`,
    countdown: days <= 1 ? 'Closes today' : `${days} days left to register`,
  };
}

export const isPast = (e, now = new Date()) => new Date(e.endAt || e.startAt) < now;

// Each Manila day an event covers ("2026-11-20", "2026-11-21", ...), for the month grid.
export function eventDays(e) {
  const start = dayKey(e.startAt);
  const end = e.endAt ? dayKey(e.endAt) : start;
  const days = [];
  for (let d = new Date(`${start}T00:00:00Z`); ; d.setUTCDate(d.getUTCDate() + 1)) {
    const k = d.toISOString().slice(0, 10);
    days.push(k);
    if (k >= end || days.length > 62) break;
  }
  return days;
}

// Month grid (Sunday first): 6 weeks of "YYYY-MM-DD" keys around the given month.
export function monthGrid(year, month /* 0-11 */) {
  const first = new Date(Date.UTC(year, month, 1));
  const start = new Date(first);
  start.setUTCDate(1 - first.getUTCDay());
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);
    return { key: d.toISOString().slice(0, 10), day: d.getUTCDate(), inMonth: d.getUTCMonth() === month };
  });
}

export const monthTitle = (year, month) =>
  new Intl.DateTimeFormat('en-PH', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(year, month, 1)));

// Admin form: ISO from the API <-> "YYYY-MM-DDTHH:mm" in Manila time for <input type="datetime-local">.
export function toManilaInput(iso) {
  if (!iso) return '';
  const p = Object.fromEntries(
    fmt({ year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
      .formatToParts(new Date(iso))
      .map((x) => [x.type, x.value])
  );
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}
export const fromManilaInput = (v) => (v ? `${v}:00+08:00` : null);
