import ResourcePage from '../../components/admin/ResourcePage.jsx';
import Badge from '../../components/admin/Badge.jsx';
import { TitleCell } from '../../components/admin/cells.jsx';
import { formatDate, formatDateTime, formatMoney, fullName, toOptions } from '../../components/admin/format.js';
import { useContent } from '../../hooks/useContent.js';

const STATUS = ['pledged', 'confirmed', 'cancelled'];

export default function Donations() {
  const campaigns = useContent('campaigns');
  const campaignOptions = (campaigns.data || []).map((c) => ({ value: c.id, label: c.title }));

  return (
    <ResourcePage
      title="Donations"
      description="Pledges submitted from the Give page. Confirm a pledge once the bank deposit has been verified."
      endpoint="/donations"
      entityLabel="donation"
      searchPlaceholder="Search donor, email or reference no."
      canCreate={false}
      rowTitle={(r) => `${fullName(r)} · ${formatMoney(r.amount, r.currency)}`}
      columns={[
        { key: 'createdAt', label: 'Date', render: (r) => formatDate(r.createdAt) },
        { key: 'donor', label: 'Donor', render: (r) => <TitleCell title={fullName(r)} subtitle={r.email} /> },
        { key: 'campaign', label: 'Campaign', render: (r) => r.campaign?.title },
        { key: 'amount', label: 'Amount', render: (r) => formatMoney(r.amount, r.currency), className: 'num' },
        { key: 'status', label: 'Status', render: (r) => <Badge value={r.status} /> },
      ]}
      filters={[
        { name: 'status', label: 'Status', options: toOptions(STATUS) },
        { name: 'campaignId', label: 'Campaign', options: campaignOptions },
        { name: 'currency', label: 'Currency', options: [{ value: 'PHP', label: 'PHP' }, { value: 'USD', label: 'USD' }] },
      ]}
      details={[
        { key: 'amount', label: 'Amount', render: (r) => <strong>{formatMoney(r.amount, r.currency)}</strong> },
        { key: 'status', label: 'Status', render: (r) => <Badge value={r.status} /> },
        { key: 'campaign', label: 'Campaign', render: (r) => r.campaign?.title },
        { key: 'createdAt', label: 'Pledged on', render: (r) => formatDateTime(r.createdAt) },
        { key: 'email', label: 'Email', render: (r) => <a href={`mailto:${r.email}`}>{r.email}</a> },
        { key: 'phone', label: 'Phone', render: (r) => <a href={`tel:${r.phone}`}>{r.phone}</a> },
        { key: 'course', label: 'Course / Department' },
        { key: 'location', label: 'Location', render: (r) => [r.city, r.country].filter(Boolean).join(', ') },
        { key: 'confirmedAt', label: 'Confirmed on', render: (r) => formatDateTime(r.confirmedAt) },
        { key: 'message', label: 'Message from donor', wide: true },
      ]}
      fields={[
        { name: 'status', label: 'Status', type: 'select', options: toOptions(STATUS) },
        { name: 'referenceNo', label: 'Bank reference no.' },
        { name: 'notes', label: 'Internal notes', type: 'textarea' },
      ]}
    />
  );
}
