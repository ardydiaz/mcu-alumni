const dateFmt = new Intl.DateTimeFormat('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
const dateTimeFmt = new Intl.DateTimeFormat('en-PH', { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

export const formatDate = (value) => (value ? dateFmt.format(new Date(value)) : '—');
export const formatDateTime = (value) => (value ? dateTimeFmt.format(new Date(value)) : '—');

export function formatMoney(amount, currency = 'PHP') {
  if (amount === null || amount === undefined || amount === '') return '—';
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency, maximumFractionDigits: 2 }).format(Number(amount));
}

export const formatNumber = (n) => new Intl.NumberFormat('en-PH').format(Number(n) || 0);

// "not_requested" -> "Not requested", "login_failed" -> "Login failed"
export const humanize = (value) => {
  if (value === null || value === undefined || value === '') return '—';
  const s = String(value).replace(/[_-]+/g, ' ');
  return s.charAt(0).toUpperCase() + s.slice(1);
};

export const fullName = (row) => row?.fullname || [row?.firstName, row?.lastName].filter(Boolean).join(' ') || row?.name || '—';

// Builds <select> options from a list of raw values.
export const toOptions = (values) => values.map((value) => ({ value, label: humanize(value) }));
