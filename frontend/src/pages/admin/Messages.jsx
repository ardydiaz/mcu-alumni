import ResourcePage from '../../components/admin/ResourcePage.jsx';
import Badge from '../../components/admin/Badge.jsx';
import { TitleCell, Truncate } from '../../components/admin/cells.jsx';
import { formatDateTime } from '../../components/admin/format.js';
import { adminApi } from '../../api/admin.js';

export default function Messages() {
  // Opening an unread message marks it as read.
  const markRead = async (row) => {
    if (row.isRead) return null;
    const res = await adminApi.update('/messages', row.id, { isRead: true });
    return res.data;
  };

  return (
    <ResourcePage
      title="Messages"
      description={'Messages sent through the "Leave us a message" form.'}
      endpoint="/messages"
      entityLabel="message"
      searchPlaceholder="Search name, email or message"
      canCreate={false}
      onOpen={markRead}
      rowTitle={(r) => r.subject || `Message from ${r.name}`}
      columns={[
        { key: 'isRead', label: 'Status', render: (r) => (r.isRead ? <Badge value="read" label="Read" tone="neutral" /> : <Badge value="unread" label="Unread" />) },
        { key: 'from', label: 'From', render: (r) => <TitleCell title={r.name} subtitle={r.email} /> },
        { key: 'subject', label: 'Message', render: (r) => <TitleCell title={r.subject || 'No subject'} subtitle={<Truncate text={r.message} max={70} />} /> },
        { key: 'createdAt', label: 'Received', render: (r) => formatDateTime(r.createdAt) },
      ]}
      filters={[{ name: 'isRead', label: 'Status', options: [{ value: 'false', label: 'Unread' }, { value: 'true', label: 'Read' }] }]}
      details={[
        { key: 'name', label: 'From' },
        { key: 'email', label: 'Email', render: (r) => <a href={`mailto:${r.email}?subject=${encodeURIComponent(`Re: ${r.subject || 'Your message to MCU Alumni'}`)}`}>{r.email}</a> },
        { key: 'createdAt', label: 'Received', render: (r) => formatDateTime(r.createdAt) },
        { key: 'readAt', label: 'Read', render: (r) => formatDateTime(r.readAt) },
        { key: 'message', label: 'Message', wide: true, render: (r) => <p className="pre-wrap">{r.message}</p> },
      ]}
      fields={[{ name: 'isRead', label: 'Mark as read', type: 'checkbox' }]}
    />
  );
}
