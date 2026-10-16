import { humanize } from './format.js';

// Status values -> tone. Status colors are always paired with a text label.
const TONES = {
  success: ['confirmed', 'released', 'active', 'completed', 'published', 'true', 'login', 'super admin', 'read', 'employed'],
  warning: ['pledged', 'requested', 'contacted', 'unpublished', 'login_failed', 'pending', 'export'],
  info: ['processing', 'new', 'ongoing', 'create', 'update', 'administrator', 'merchant', 'unread'],
  danger: ['cancelled', 'delete'],
};

export function toneFor(value) {
  const key = String(value).toLowerCase();
  return Object.keys(TONES).find((tone) => TONES[tone].includes(key)) || 'neutral';
}

export default function Badge({ value, label, tone }) {
  return <span className={`badge badge--${tone || toneFor(value)}`}>{label ?? humanize(value)}</span>;
}

export const ActiveBadge = ({ active, on = 'Active', off = 'Hidden' }) => (
  <Badge value={active ? 'active' : 'inactive'} label={active ? on : off} tone={active ? 'success' : 'neutral'} />
);
