import ResourcePage from '../../components/admin/ResourcePage.jsx';
import { ActiveBadge } from '../../components/admin/Badge.jsx';
import { formatDate } from '../../components/admin/format.js';
import { assetUrl } from '../../api/client.js';

// e.g. ["SY 2026 - 2027", "SY 2025 - 2026", ...] for the school-year filter
const currentStartYear = new Date().getMonth() >= 5 ? new Date().getFullYear() : new Date().getFullYear() - 1;
const SCHOOL_YEARS = Array.from({ length: 5 }, (_, i) => `SY ${currentStartYear - i} - ${currentStartYear - i + 1}`);

export default function Reports() {
  return (
    <ResourcePage
      title="Transparency reports"
      description="Monthly donation reports (PDF) listed on the Transparency Reports page."
      endpoint="/reports"
      entityLabel="report"
      searchPlaceholder="Search reports"
      columns={[
        { key: 'schoolYear', label: 'School year' },
        { key: 'title', label: 'Report' },
        { key: 'periodStart', label: 'Period', render: (r) => formatDate(r.periodStart) },
        {
          key: 'fileUrl',
          label: 'File',
          render: (r) => (
            <a href={assetUrl(r.fileUrl)} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>Open PDF</a>
          ),
        },
        { key: 'isPublished', label: 'Status', render: (r) => <ActiveBadge active={r.isPublished} on="Published" off="Draft" /> },
      ]}
      filters={[
        { name: 'schoolYear', label: 'School year', options: SCHOOL_YEARS.map((y) => ({ value: y, label: y })) },
        { name: 'isPublished', label: 'Status', options: [{ value: 'true', label: 'Published' }, { value: 'false', label: 'Draft' }] },
      ]}
      initialValues={{ schoolYear: SCHOOL_YEARS[0], isPublished: true }}
      fields={[
        { name: 'schoolYear', label: 'School year', type: 'select', options: SCHOOL_YEARS.map((y) => ({ value: y, label: y })), required: true },
        { name: 'title', label: 'Title', required: true, placeholder: 'August 2025' },
        { name: 'periodStart', label: 'Month covered', type: 'date', hint: 'First day of the month; used for ordering' },
        { name: 'fileUrl', label: 'Report PDF', type: 'document', uploadName: 'file', required: true, hint: 'PDF up to 5 MB' },
        { name: 'isPublished', label: 'Published on the website', type: 'checkbox' },
      ]}
    />
  );
}
