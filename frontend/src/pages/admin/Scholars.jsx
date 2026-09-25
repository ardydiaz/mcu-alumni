import ResourcePage from '../../components/admin/ResourcePage.jsx';
import { ActiveBadge } from '../../components/admin/Badge.jsx';
import { TitleCell } from '../../components/admin/cells.jsx';

export default function Scholars() {
  return (
    <ResourcePage
      title="Scholars"
      description="Students featured on the Support-a-Centralino page."
      endpoint="/scholars"
      entityLabel="scholar"
      searchPlaceholder="Search by name or college"
      columns={[
        { key: 'name', label: 'Scholar', render: (r) => <TitleCell image={r.image ?? null} round title={r.name} subtitle={r.yearLevel} /> },
        { key: 'college', label: 'College' },
        { key: 'sortOrder', label: 'Order', className: 'num' },
        { key: 'isActive', label: 'Status', render: (r) => <ActiveBadge active={r.isActive} /> },
      ]}
      filters={[{ name: 'isActive', label: 'Status', options: [{ value: 'true', label: 'Active' }, { value: 'false', label: 'Hidden' }] }]}
      initialValues={{ isActive: true, sortOrder: 0 }}
      fields={[
        { name: 'name', label: 'Full name', required: true, hint: 'Format: Last name, First name Middle name' },
        { name: 'college', label: 'College / Program', required: true, placeholder: 'College of Nursing' },
        { name: 'yearLevel', label: 'Year level', placeholder: '3rd year' },
        { name: 'videoUrl', label: 'Video URL', type: 'url' },
        { name: 'image', label: 'Photo', type: 'image', hint: 'Portrait photo, JPG/PNG/WEBP up to 5 MB' },
        { name: 'story', label: 'Story', type: 'textarea' },
        { name: 'sortOrder', label: 'Display order', type: 'number' },
        { name: 'isActive', label: 'Show on the website', type: 'checkbox' },
      ]}
    />
  );
}
