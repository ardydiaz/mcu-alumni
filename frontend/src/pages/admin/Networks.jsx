import ResourcePage from '../../components/admin/ResourcePage.jsx';
import { ActiveBadge } from '../../components/admin/Badge.jsx';
import { TitleCell } from '../../components/admin/cells.jsx';

export default function Networks() {
  return (
    <ResourcePage
      title="Networks"
      description="Alumni associations and chapters listed on the Networks page."
      endpoint="/networks"
      entityLabel="network"
      searchPlaceholder="Search associations"
      columns={[
        { key: 'name', label: 'Association', render: (r) => <TitleCell image={r.logo ?? null} round title={r.name} subtitle={r.contactEmail} /> },
        { key: 'president', label: 'President' },
        { key: 'sortOrder', label: 'Order', className: 'num' },
        { key: 'isActive', label: 'Status', render: (r) => <ActiveBadge active={r.isActive} /> },
      ]}
      filters={[{ name: 'isActive', label: 'Status', options: [{ value: 'true', label: 'Active' }, { value: 'false', label: 'Hidden' }] }]}
      initialValues={{ isActive: true, sortOrder: 0 }}
      fields={[
        { name: 'name', label: 'Association name', required: true, span: 2 },
        { name: 'president', label: 'President' },
        { name: 'contactEmail', label: 'Contact email', type: 'email' },
        { name: 'facebookUrl', label: 'Facebook page URL', type: 'url', span: 2 },
        { name: 'logo', label: 'Logo', type: 'image', hint: 'Square logo works best' },
        { name: 'description', label: 'Description', type: 'textarea' },
        { name: 'sortOrder', label: 'Display order', type: 'number' },
        { name: 'isActive', label: 'Show on the website', type: 'checkbox' },
      ]}
    />
  );
}
