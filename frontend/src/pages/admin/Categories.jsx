import ResourcePage from '../../components/admin/ResourcePage.jsx';
import { ActiveBadge } from '../../components/admin/Badge.jsx';
import { TitleCell } from '../../components/admin/cells.jsx';
import { formatMoney } from '../../components/admin/format.js';

// Categories = the giving campaigns donors choose from on the Give page.
export default function Categories() {
  return (
    <ResourcePage
      title="Categories"
      description="Giving campaigns donors can choose on the Give page. Hidden campaigns stop accepting new pledges."
      endpoint="/campaigns"
      entityLabel="category"
      searchPlaceholder="Search campaigns"
      columns={[
        { key: 'title', label: 'Campaign', render: (r) => <TitleCell title={r.title} subtitle={`/give?campaign=${r.slug}`} /> },
        { key: 'area', label: 'Area' },
        { key: 'goalAmount', label: 'Goal', render: (r) => (r.goalAmount ? formatMoney(r.goalAmount) : '—'), className: 'num' },
        { key: 'sortOrder', label: 'Order', className: 'num' },
        { key: 'isActive', label: 'Status', render: (r) => <ActiveBadge active={r.isActive} /> },
      ]}
      filters={[{ name: 'isActive', label: 'Status', options: [{ value: 'true', label: 'Active' }, { value: 'false', label: 'Hidden' }] }]}
      initialValues={{ isActive: true, sortOrder: 0 }}
      fields={[
        { name: 'title', label: 'Title', required: true, placeholder: 'Enabling Excellence' },
        { name: 'area', label: 'Area', required: true, placeholder: 'Scholarships' },
        { name: 'slug', label: 'Slug', required: true, hint: 'Used in links, e.g. /give?campaign=scholarship. Lowercase letters, numbers and dashes.' },
        { name: 'goalAmount', label: 'Goal amount (PHP)', type: 'number' },
        { name: 'description', label: 'Short description', type: 'textarea' },
        { name: 'sortOrder', label: 'Display order', type: 'number', hint: 'Lower numbers appear first' },
        { name: 'isActive', label: 'Show on the website and accept pledges', type: 'checkbox' },
      ]}
    />
  );
}
