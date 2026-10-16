import ResourcePage from '../../components/admin/ResourcePage.jsx';
import Badge from '../../components/admin/Badge.jsx';
import { TitleCell } from '../../components/admin/cells.jsx';
import { useContent } from '../../hooks/useContent.js';
import { CATEGORIES, categoryOf, longDate, timeRange, shortDate, time } from '../../components/events/eventUtils.js';

// Alumni Events and Activities calendar. Drafts are only visible here; published events appear on /events,
// cancelled ones stay on the calendar marked as cancelled.
const CATEGORY_OPTIONS = Object.entries(CATEGORIES).map(([value, c]) => ({ value, label: c.label }));
const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft (not public yet)' },
  { value: 'published', label: 'Published' },
  { value: 'cancelled', label: 'Cancelled' },
];
const STATUS_TONE = { draft: 'neutral', published: 'success', cancelled: 'danger' };
const StatusBadge = ({ value }) => <Badge value={value} tone={STATUS_TONE[value]} label={value === 'draft' ? 'Draft' : value === 'published' ? 'Published' : 'Cancelled'} />;
const when = (r) => `${longDate(r.startAt)} · ${timeRange(r)}`;

export default function AdminEvents() {
  const networks = useContent('networks');
  const networkOptions = (networks.data || []).map((n) => ({ value: n.id, label: n.name }));

  return (
    <ResourcePage
      title="Events"
      description="Alumni events and activities shown on the public calendar (/events), the homepage and the Alumni Portal. Times are in Philippine time."
      endpoint="/events"
      entityLabel="event"
      searchPlaceholder="Search title, summary or venue"
      rowTitle={(r) => r.title}
      columns={[
        { key: 'startAt', label: 'Date', render: (r) => <TitleCell title={shortDate(r.startAt)} subtitle={timeRange(r)} /> },
        { key: 'title', label: 'Event', render: (r) => <TitleCell title={r.title} subtitle={categoryOf(r.category).label + (r.network ? ` · ${r.network.name}` : '')} /> },
        { key: 'venue', label: 'Venue', render: (r) => r.venue || (r.onlineUrl ? 'Online' : '—') },
        { key: 'registrationDeadline', label: 'Registration until', render: (r) => (r.registrationDeadline ? `${shortDate(r.registrationDeadline)}, ${time(r.registrationDeadline)}` : '—') },
        { key: 'status', label: 'Status', render: (r) => <StatusBadge value={r.status} /> },
      ]}
      filters={[
        { name: 'status', label: 'Status', options: STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label.replace(' (not public yet)', '') })) },
        { name: 'category', label: 'Type', options: CATEGORY_OPTIONS },
      ]}
      initialValues={{ status: 'draft', category: 'alumni', allDay: false }}
      fields={[
        { name: 'image', label: 'Cover photo (optional)', type: 'image', hint: 'Landscape photo, at least 1600 × 900 px (JPG, PNG or WEBP, up to 5 MB). Shown behind the title on the event page.' },
        { name: 'title', label: 'Event title', required: true, placeholder: 'Grand Alumni Homecoming 2027', span: 2 },
        { name: 'summary', label: 'Short summary', placeholder: 'One or two sentences for the calendar and event cards', span: 2 },
        { name: 'description', label: 'Full description', type: 'textarea', placeholder: 'Program, dress code, who can join, what to bring… Leave a blank line between paragraphs.' },
        { name: 'category', label: 'Type of event', type: 'select', options: CATEGORY_OPTIONS, required: true },
        { name: 'networkId', label: 'Hosting chapter (optional)', type: 'select', options: networkOptions, hint: 'For chapter activities' },
        { name: 'startAt', label: 'Starts', type: 'datetime-local', required: true },
        { name: 'endAt', label: 'Ends (optional)', type: 'datetime-local' },
        { name: 'allDay', label: 'All-day event (no specific time)', type: 'checkbox' },
        { name: 'venue', label: 'Venue', placeholder: 'MCU Caloocan, Learning Resource Center' },
        { name: 'onlineUrl', label: 'Online link (optional)', type: 'url', placeholder: 'https://…', hint: 'For online or hybrid events' },
        { name: 'registrationDeadline', label: 'Registration deadline (optional)', type: 'datetime-local' },
        { name: 'capacity', label: 'Slots (optional)', type: 'number', placeholder: '200' },
        { name: 'registrationUrl', label: 'Registration link (optional)', type: 'url', placeholder: 'https://forms.office.com/…', hint: 'Shows a "Register now" button until the deadline', span: 2 },
        { name: 'status', label: 'Status', type: 'select', options: STATUS_OPTIONS, required: true, hint: 'Drafts are only visible here' },
      ]}
      details={[
        { key: 'title', label: 'Title' },
        { key: 'status', label: 'Status', render: (r) => <StatusBadge value={r.status} /> },
        { key: 'category', label: 'Type', render: (r) => categoryOf(r.category).label },
        { key: 'network', label: 'Chapter', render: (r) => r.network?.name || '—' },
        { key: 'when', label: 'When', render: when, wide: true },
        { key: 'venue', label: 'Venue' },
        { key: 'onlineUrl', label: 'Online link', render: (r) => (r.onlineUrl ? <a href={r.onlineUrl} target="_blank" rel="noreferrer">{r.onlineUrl}</a> : '—') },
        { key: 'registrationDeadline', label: 'Registration deadline', render: (r) => (r.registrationDeadline ? `${longDate(r.registrationDeadline)}, ${time(r.registrationDeadline)}` : '—') },
        { key: 'capacity', label: 'Slots' },
        { key: 'link', label: 'Public page', wide: true, render: (r) => (r.status === 'draft' ? 'Not public (draft)' : <a href={`/events/${r.slug}`} target="_blank" rel="noreferrer">/events/{r.slug}</a>) },
        { key: 'summary', label: 'Summary', wide: true },
        { key: 'description', label: 'Description', wide: true },
      ]}
    />
  );
}
