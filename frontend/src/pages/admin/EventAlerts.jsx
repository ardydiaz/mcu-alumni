import { useEffect, useState } from 'react';
import ResourcePage from '../../components/admin/ResourcePage.jsx';
import Badge from '../../components/admin/Badge.jsx';
import Icon from '../../components/ui/Icon.jsx';
import { StatTile } from '../../components/admin/Stats.jsx';
import { useToast } from '../../components/admin/Toast.jsx';
import { formatDateTime, formatNumber } from '../../components/admin/format.js';
import { adminApi } from '../../api/admin.js';
import { authDownload, saveBlob } from '../../api/client.js';

// Emails left in the homepage "Notify me" box. They're emailed automatically, once, when a Homecoming event
// is published; staff can also export the list.
function Summary() {
  const notify = useToast();
  const [summary, setSummary] = useState(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    adminApi.fetch('/event-alerts/summary').then(setSummary).catch(() => setSummary(null));
  }, []);

  const exportCsv = async () => {
    setBusy(true);
    try {
      const { blob, fileName } = await authDownload('/event-alerts/export');
      saveBlob(blob, fileName);
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="stat-grid">
        <StatTile label="Subscribed" value={formatNumber(summary?.active ?? 0)} hint="Get the next Homecoming alert" icon="bell" />
        <StatTile label="Unsubscribed" value={formatNumber(summary?.unsubscribed ?? 0)} icon="close" />
      </div>
      <div className="admin-card admin-note">
        <Icon name="mail" size={18} />
        <p>
          When you publish an event with the <b>Homecoming</b> category, every subscriber is emailed once with the event details and an
          unsubscribe link. Saving the event again doesn't send a second email.
        </p>
        <button type="button" className="btn btn-outline btn-sm" onClick={exportCsv} disabled={busy}>
          <Icon name="download" size={16} /> {busy ? 'Exporting...' : 'Export CSV'}
        </button>
      </div>
    </>
  );
}

export default function EventAlerts() {
  return (
    <ResourcePage
      title="Event alerts"
      description={'Emails from the homepage "Get notified when Grand Alumni Homecoming registration opens" box.'}
      endpoint="/event-alerts"
      entityLabel="subscriber"
      searchPlaceholder="Search email"
      canCreate={false}
      rowTitle={(r) => r.email}
      headerExtra={<Summary />}
      columns={[
        { key: 'email', label: 'Email', render: (r) => <a href={`mailto:${r.email}`}>{r.email}</a> },
        { key: 'active', label: 'Status', render: (r) => (r.active ? <Badge value="active" tone="success" label="Subscribed" /> : <Badge value="off" tone="neutral" label="Unsubscribed" />) },
        { key: 'createdAt', label: 'Signed up', render: (r) => formatDateTime(r.createdAt) },
        { key: 'lastNotifiedAt', label: 'Last alert', render: (r) => formatDateTime(r.lastNotifiedAt) },
      ]}
      filters={[{ name: 'active', label: 'Status', options: [{ value: 'true', label: 'Subscribed' }, { value: 'false', label: 'Unsubscribed' }] }]}
      details={[
        { key: 'email', label: 'Email' },
        { key: 'active', label: 'Status', render: (r) => (r.active ? 'Subscribed' : 'Unsubscribed') },
        { key: 'createdAt', label: 'Signed up', render: (r) => formatDateTime(r.createdAt) },
        { key: 'unsubscribedAt', label: 'Unsubscribed', render: (r) => formatDateTime(r.unsubscribedAt) },
        { key: 'lastNotifiedAt', label: 'Last alert sent', render: (r) => formatDateTime(r.lastNotifiedAt) },
      ]}
    />
  );
}
