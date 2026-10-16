import { env } from '../../config/env.js';

// "Add to my calendar": one event as an iCalendar (.ics) file (RFC 5545), which Google Calendar,
// Outlook and phones can import. Timed events are written in UTC; all-day events as Manila dates.

const MANILA_OFFSET_MS = 8 * 3600 * 1000;

const utc = (d) => new Date(d).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''); // 20261120T010000Z
const manilaDate = (d, addDays = 0) => {
  const local = new Date(new Date(d).getTime() + MANILA_OFFSET_MS + addDays * 86400000);
  return local.toISOString().slice(0, 10).replace(/-/g, ''); // 20261120
};

// Escape text values and fold long lines at 75 octets.
const escape = (s = '') => String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
function fold(line) {
  const out = [];
  let rest = line;
  while (Buffer.byteLength(rest) > 75) {
    let cut = 75;
    while (Buffer.byteLength(rest.slice(0, cut)) > 75) cut--;
    out.push(rest.slice(0, cut));
    rest = ` ${rest.slice(cut)}`;
  }
  out.push(rest);
  return out.join('\r\n');
}

export function eventToIcs(event) {
  const url = `${env.frontendUrl}/events/${event.slug}`;
  const end = event.endAt || new Date(new Date(event.startAt).getTime() + 3600 * 1000); // no end time: 1 hour
  const where = [event.venue, event.onlineUrl].filter(Boolean).join(' / ');
  const description = [event.summary, event.description, `Details: ${url}`].filter(Boolean).join('\n\n');

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//MCU Alumni//Events//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:event-${event.id}@alumni.mcu.edu.ph`,
    `DTSTAMP:${utc(new Date())}`,
    ...(event.allDay
      ? [`DTSTART;VALUE=DATE:${manilaDate(event.startAt)}`, `DTEND;VALUE=DATE:${manilaDate(event.endAt || event.startAt, 1)}`]
      : [`DTSTART:${utc(event.startAt)}`, `DTEND:${utc(end)}`]),
    `SUMMARY:${escape(event.title)}`,
    `DESCRIPTION:${escape(description)}`,
    ...(where ? [`LOCATION:${escape(where)}`] : []),
    `URL:${url}`,
    `STATUS:${event.status === 'cancelled' ? 'CANCELLED' : 'CONFIRMED'}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return `${lines.map(fold).join('\r\n')}\r\n`;
}
