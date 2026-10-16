import Icon from '../../components/ui/Icon.jsx';

// "Dela Cruz, Juan Carlo, M." -> "Juan"
export const firstName = (fullName = '') => (fullName.split(',')[1] || fullName).trim().split(/\s+/)[0];

const STATUS = {
  email_unverified: { label: 'Email not verified', icon: 'mail', tone: 'neutral' },
  pending: { label: 'Pending review', icon: 'clock', tone: 'pending' },
  verified: { label: 'Verified alumni', icon: 'check', tone: 'verified' },
  rejected: { label: 'Not approved', icon: 'close', tone: 'rejected' },
};

export function StatusBadge({ status }) {
  const s = STATUS[status] || STATUS.pending;
  return (
    <span className={`portal-status portal-status--${s.tone}`}>
      <Icon name={s.icon} size={13} /> {s.label}
    </span>
  );
}

// The registration journey, shown beside the forms.
export const JOURNEY = [
  { title: 'Create your account', text: 'Tell us who you are and set a password.' },
  { title: 'Verify your email', text: 'Click the link we send to your inbox.' },
  { title: 'Alumni Office review', text: 'We confirm your record as an MCU graduate.' },
  { title: 'Access the portal', text: 'Use alumni services with your verified account.' },
];

export function Journey({ current = 0 }) {
  return (
    <ol className="portal-journey">
      {JOURNEY.map((s, i) => (
        <li key={s.title} className={i < current ? 'is-done' : i === current ? 'is-current' : ''}>
          <span className="portal-journey__num" aria-hidden="true">{i < current ? <Icon name="check" size={14} /> : i + 1}</span>
          <div>
            <strong>{s.title}</strong>
            <span>{s.text}</span>
          </div>
        </li>
      ))}
    </ol>
  );
}
