import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/admin/PageHeader.jsx';
import Icon from '../../components/ui/Icon.jsx';
import Badge from '../../components/admin/Badge.jsx';
import { StatTile, BarList } from '../../components/admin/Stats.jsx';
import { adminApi } from '../../api/admin.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { formatMoney, formatNumber, formatDate, fullName, humanize } from '../../components/admin/format.js';

function useDashboard() {
  const [state, setState] = useState({ loading: true, error: null, stats: null, recent: null, tracer: null });
  useEffect(() => {
    Promise.all([adminApi.fetch('/dashboard/stats'), adminApi.fetch('/dashboard/recent', { limit: 5 }), adminApi.fetch('/tracer/summary')])
      .then(([stats, recent, tracer]) => setState({ loading: false, error: null, stats, recent, tracer }))
      .catch((error) => setState((s) => ({ ...s, loading: false, error })));
  }, []);
  return state;
}

const moneyList = (amounts = {}) =>
  Object.entries(amounts).map(([currency, amount]) => formatMoney(amount, currency)).join(' + ') || formatMoney(0);

function RecentList({ title, to, items, render }) {
  return (
    <section className="admin-card">
      <div className="admin-card__head">
        <h2>{title}</h2>
        <Link to={to} className="link-arrow">View all</Link>
      </div>
      {items.length ? <ul className="recent-list">{items.map(render)}</ul> : <p className="muted">Nothing yet.</p>}
    </section>
  );
}

export default function Dashboard() {
  const { user, isSuperAdmin } = useAuth();
  const { loading, error, stats, recent, tracer } = useDashboard();

  const header = <PageHeader title={`Welcome back, ${String(user?.fullname || '').split(' ')[0]}`} description="Here's what's happening across the MCU Alumni website." />;

  if (loading) {
    return (
      <>
        {header}
        <div className="stat-grid">{Array.from({ length: 4 }, (_, i) => <div key={i} className="skeleton skeleton--tile" />)}</div>
      </>
    );
  }
  if (error) return <>{header}<div className="alert alert--error" role="alert">Could not load the dashboard: {error.message}</div></>;

  const donations = stats.donations.byStatus;
  const byCampaign = stats.donations.confirmedByCampaign;
  const currencies = [...new Set(byCampaign.map((d) => d.currency))];

  return (
    <>
      {header}

      {isSuperAdmin && stats.users?.pendingAccessRequests > 0 && (
        <Link to="/admin/users" className="notice-banner">
          <Icon name="users" size={20} />
          <span>
            <strong>{stats.users.pendingAccessRequests} access {stats.users.pendingAccessRequests === 1 ? 'request' : 'requests'}</strong> waiting for
            approval
          </span>
          <span className="link-arrow">Review <Icon name="arrowRight" size={16} /></span>
        </Link>
      )}

      <div className="stat-grid">
        <StatTile label="Pledges awaiting confirmation" value={formatNumber(donations.pledged?.count || 0)} hint={moneyList(donations.pledged?.amount)} icon="heart" to="/admin/donations" />
        <StatTile label="Confirmed donations" value={moneyList(donations.confirmed?.amount)} hint={`${formatNumber(donations.confirmed?.count || 0)} gifts`} icon="check" to="/admin/donations" />
        <StatTile label="Alumni ID requests" value={formatNumber(stats.alumni.pendingAlumniIds)} hint={`${formatNumber(stats.alumni.total)} alumni records`} icon="id" to="/admin/alumni" />
        <StatTile label="Unread messages" value={formatNumber(stats.messages.unread)} hint={`${formatNumber(stats.volunteers.new)} new volunteers`} icon="mail" to="/admin/messages" />
      </div>

      <div className="admin-grid-2">
        <section className="admin-card">
          <div className="admin-card__head">
            <h2>Confirmed donations by campaign</h2>
          </div>
          {currencies.length ? (
            currencies.map((currency) => (
              <BarList
                key={currency}
                title={currencies.length > 1 ? currency : undefined}
                items={byCampaign.filter((d) => d.currency === currency).map((d) => ({ label: d.campaign, value: d.total }))}
                format={(v) => formatMoney(v, currency)}
              />
            ))
          ) : (
            <p className="muted">No confirmed donations yet. Confirm pledges from the Donations page once the deposit is verified.</p>
          )}
        </section>

        <section className="admin-card">
          <div className="admin-card__head">
            <h2>Graduate tracer</h2>
            <Link to="/admin/tracer" className="link-arrow">Responses</Link>
          </div>
          <div className="stat-inline">
            <div><strong>{formatNumber(tracer.total)}</strong><span>responses</span></div>
            <div><strong>{tracer.employmentRate}%</strong><span>currently employed</span></div>
          </div>
          <BarList
            title="Employment"
            items={tracer.total ? Object.entries(tracer.employment).map(([label, value]) => ({ label, value })) : []}
            emptyMessage="No tracer responses yet."
          />
        </section>
      </div>

      <div className="admin-grid-2">
        <RecentList
          title="Latest pledges"
          to="/admin/donations"
          items={recent.donations}
          render={(d) => (
            <li key={d.id}>
              <div><strong>{fullName(d)}</strong><small>{d.campaign?.title} · {formatDate(d.createdAt)}</small></div>
              <span className="recent-list__end">{formatMoney(d.amount, d.currency)} <Badge value={d.status} /></span>
            </li>
          )}
        />
        <RecentList
          title="Latest alumni updates"
          to="/admin/alumni"
          items={recent.alumni}
          render={(a) => (
            <li key={a.id}>
              <div><strong>{fullName(a)}</strong><small>{a.course} · {a.yearGraduated}</small></div>
              {a.alumniIdStatus !== 'not_requested' && <Badge value={a.alumniIdStatus} label={`ID: ${humanize(a.alumniIdStatus)}`} />}
            </li>
          )}
        />
        <RecentList
          title="Latest messages"
          to="/admin/messages"
          items={recent.messages}
          render={(m) => (
            <li key={m.id}>
              <div><strong>{m.name}</strong><small>{m.subject || 'No subject'} · {formatDate(m.createdAt)}</small></div>
              {!m.isRead && <Badge value="unread" label="Unread" />}
            </li>
          )}
        />
        <RecentList
          title="Latest volunteers"
          to="/admin/volunteers"
          items={recent.volunteers}
          render={(v) => (
            <li key={v.id}>
              <div><strong>{fullName(v)}</strong><small>{humanize(v.role)} · {formatDate(v.createdAt)}</small></div>
              <Badge value={v.status} />
            </li>
          )}
        />
      </div>
    </>
  );
}
