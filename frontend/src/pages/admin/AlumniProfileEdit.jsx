import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import PageHeader from '../../components/admin/PageHeader.jsx';
import { useToast } from '../../components/admin/Toast.jsx';
import Icon from '../../components/ui/Icon.jsx';
import ProfileEditor from '../../components/profile/ProfileEditor.jsx';
import { LABELS, SECTIONS } from '../../components/profile/profileConfig.js';
import { useContent } from '../../hooks/useContent.js';
import { adminApi } from '../../api/admin.js';
import '../../styles/profile.css';

const SECTION_LABEL = { profile: 'Profile', ...Object.fromEntries(SECTIONS.map((s) => [s.key, s.label])) };
const ACTION_LABEL = { create: 'Created profile', verify: 'Verified and linked to portal account', update: 'Updated', add: 'Added', edit: 'Edited', remove: 'Removed' };
const ACTOR_LABEL = { alumni: 'Alumnus', staff: 'EAO staff', system: 'System' };
const dateTime = (d) => new Date(d).toLocaleString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
const val = (v) => (v === null || v === '' || v === undefined ? 'empty' : String(v));

// Who changed what, when (old -> new).
function History({ profileId, version }) {
  const [rows, setRows] = useState(null);
  useEffect(() => {
    adminApi.fetch(`/profiles/${profileId}/changes`).then(setRows).catch(() => setRows([]));
  }, [profileId, version]);

  if (!rows) return <div className="pf-card"><p className="muted">Loading…</p></div>;
  return (
    <section className="pf-card">
      <header className="pf-card__head">
        <span className="pf-card__icon"><Icon name="clock" size={18} /></span>
        <div>
          <h3>Change history</h3>
          <p>Every change to this profile, by the alumnus, EAO staff or the Graduate Tracer.</p>
        </div>
      </header>
      {rows.length ? (
        <ul className="pf-history">
          {rows.map((c) => {
            // PSGC codes travel with the readable names; show only the names.
            const { title, ...all } = c.changes || {};
            const fields = Object.fromEntries(Object.entries(all).filter(([k]) => !/Code$/.test(k)));
            return (
              <li key={c.id}>
                <time>{dateTime(c.createdAt)}</time>
                <div>
                  <strong>
                    {ACTION_LABEL[c.action] || c.action} · {SECTION_LABEL[c.section] || c.section}
                    {title ? `: ${title}` : ''}
                  </strong>
                  <span className="muted"> by {c.actorName || ACTOR_LABEL[c.actorType]} ({ACTOR_LABEL[c.actorType]})</span>
                  {Object.keys(fields).length > 0 && (
                    <ul>
                      {Object.entries(fields).map(([field, [from, to]]) => (
                        <li key={field}>
                          {LABELS[field] || field}: <del>{val(from)}</del> → <strong>{val(to)}</strong>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="pf-empty">No changes recorded yet.</p>
      )}
    </section>
  );
}

export default function AlumniProfileEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const notify = useToast();
  const options = useContent('form-options');
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    adminApi.get('/profiles', id).then(setProfile).catch(setError);
  }, [id]);

  const onChange = useCallback(
    (p) => {
      setProfile(p);
      setVersion((v) => v + 1);
    },
    []
  );

  // ProfileEditor api: each call returns the full profile.
  const api = useMemo(
    () => ({
      saveProfile: async (data, photo) => (await adminApi.update('/profiles', id, data, photo ? { photo } : {})).data,
      addItem: async (section, data) => (await adminApi.send(`/profiles/${id}/${section}`, 'POST', data)).data,
      editItem: async (section, itemId, data) => (await adminApi.send(`/profiles/${id}/${section}/${itemId}`, 'PATCH', data)).data,
      removeItem: async (section, itemId) => (await adminApi.send(`/profiles/${id}/${section}/${itemId}`, 'DELETE')).data,
    }),
    [id]
  );
  const extraTabs = useMemo(() => [{ key: 'history', label: 'History', icon: 'clock', render: () => <History profileId={id} version={version} /> }], [id, version]);

  const remove = async () => {
    if (!window.confirm(`Delete the profile of ${profile.firstName} ${profile.surname}? This removes all sections and history and cannot be undone.`)) return;
    try {
      await adminApi.remove('/profiles', id);
      notify('Profile deleted');
      navigate('/admin/profiles');
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  if (error) return <div className="admin-empty"><h2>{error.status === 404 ? 'Profile not found' : "Couldn't load this profile"}</h2><Link to="/admin/profiles">Back to alumni profiles</Link></div>;
  if (!profile) return <div className="skeleton" style={{ height: 300, borderRadius: 20 }} />;

  return (
    <>
      <PageHeader
        title="Alumni profile"
        description={profile.alumniAccountId ? `Linked to Alumni Portal account #${profile.alumniAccountId}. The alumnus can also update the non-verified fields.` : 'Encoded by EAO. Not linked to an Alumni Portal account yet.'}
        actions={
          <>
            <Link to="/admin/profiles" className="btn admin-btn-ghost btn-sm"><Icon name="arrowRight" size={14} style={{ transform: 'rotate(180deg)' }} /> All profiles</Link>
            <button type="button" className="btn btn-sm btn-danger-ghost" onClick={remove}>Delete</button>
          </>
        }
      />
      <ProfileEditor profile={profile} mode="staff" api={api} onChange={onChange} choices={{ jobCategories: options.data?.jobCategories || [] }} extraTabs={extraTabs} />
    </>
  );
}
