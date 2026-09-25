import ResourcePage from '../../components/admin/ResourcePage.jsx';
import Badge, { ActiveBadge } from '../../components/admin/Badge.jsx';
import { TitleCell, Truncate } from '../../components/admin/cells.jsx';

const TYPES = [
  { value: 'merchant', label: 'Merchant (alumni discount)' },
  { value: 'industry', label: 'Industry (employer)' },
];

export default function Partners() {
  return (
    <ResourcePage
      title="Partners"
      description="Merchant partners offer Alumni ID discounts; industry partners employ Centralinos."
      endpoint="/partners"
      entityLabel="partner"
      searchPlaceholder="Search partners or offers"
      columns={[
        { key: 'name', label: 'Partner', render: (r) => <TitleCell image={r.logo ?? null} title={r.name} subtitle={r.website} /> },
        { key: 'type', label: 'Type', render: (r) => <Badge value={r.type} tone={r.type === 'merchant' ? 'info' : 'neutral'} /> },
        { key: 'offer', label: 'Offer', render: (r) => <Truncate text={r.offer} max={60} /> },
        { key: 'validity', label: 'Validity', render: (r) => r.validity || (r.type === 'merchant' ? 'Ongoing' : '—') },
        { key: 'isActive', label: 'Status', render: (r) => <ActiveBadge active={r.isActive} /> },
      ]}
      filters={[
        { name: 'type', label: 'Type', options: [{ value: 'merchant', label: 'Merchant' }, { value: 'industry', label: 'Industry' }] },
        { name: 'isActive', label: 'Status', options: [{ value: 'true', label: 'Active' }, { value: 'false', label: 'Hidden' }] },
      ]}
      initialValues={{ type: 'merchant', isActive: true, sortOrder: 0 }}
      fields={[
        { name: 'type', label: 'Partner type', type: 'select', options: TYPES, required: true },
        { name: 'name', label: 'Name', required: true },
        { name: 'offer', label: 'Offer (merchants)', span: 2, placeholder: '10% off all services with your Alumni ID' },
        { name: 'validity', label: 'Validity text', placeholder: 'Until December 31, 2026' },
        { name: 'validUntil', label: 'Valid until (date)', type: 'date', hint: 'Used for sorting and expiry reminders' },
        { name: 'website', label: 'Website', type: 'url', span: 2 },
        { name: 'logo', label: 'Logo', type: 'image' },
        { name: 'sortOrder', label: 'Display order', type: 'number' },
        { name: 'isActive', label: 'Show on the website', type: 'checkbox' },
      ]}
    />
  );
}
