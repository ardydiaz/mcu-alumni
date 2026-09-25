import ResourcePage from '../../components/admin/ResourcePage.jsx';
import Badge, { ActiveBadge } from '../../components/admin/Badge.jsx';
import { TitleCell, Truncate } from '../../components/admin/cells.jsx';
import { toOptions } from '../../components/admin/format.js';

const STATUS = ['planned', 'ongoing', 'completed'];

export default function Projects() {
  return (
    <ResourcePage
      title="Projects"
      description="Campus development projects shown on the Campus Development page."
      endpoint="/projects"
      entityLabel="project"
      searchPlaceholder="Search projects"
      columns={[
        { key: 'title', label: 'Project', render: (r) => <TitleCell image={r.image ?? null} title={r.title} /> },
        { key: 'description', label: 'Description', render: (r) => <Truncate text={r.description} max={70} /> },
        { key: 'status', label: 'Progress', render: (r) => <Badge value={r.status} /> },
        { key: 'isActive', label: 'Status', render: (r) => <ActiveBadge active={r.isActive} /> },
      ]}
      filters={[{ name: 'status', label: 'Progress', options: toOptions(STATUS) }]}
      initialValues={{ status: 'planned', isActive: true, sortOrder: 0 }}
      fields={[
        { name: 'title', label: 'Title', required: true },
        { name: 'status', label: 'Progress', type: 'select', options: toOptions(STATUS) },
        { name: 'image', label: 'Perspective image', type: 'image' },
        { name: 'description', label: 'Description', type: 'textarea' },
        { name: 'sortOrder', label: 'Display order', type: 'number' },
        { name: 'isActive', label: 'Show on the website', type: 'checkbox' },
      ]}
    />
  );
}
