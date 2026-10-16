import { useEffect, useMemo, useState } from 'react';
import Icon from '../ui/Icon.jsx';
import Field from '../forms/Field.jsx';
import AddressPicker from './AddressPicker.jsx';
import { assetUrl } from '../../api/client.js';
import { SECTIONS, SEXES, CIVIL_STATUS, YES_NO, LABELS, fullName, initials } from './profileConfig.js';

// Alumni profile editor (Step 4), shared by the Alumni Portal ("My Profile") and the admin panel.
//   mode "alumni": the verified record is read-only (correction request link); other fields are editable.
//   mode "staff":  EAO can edit everything except the system-generated Alumni Number.
// api: { saveProfile(data, photoFile), addItem(section, data), editItem(section, id, data), removeItem(section, id) }
// Each call resolves with the updated full profile, which is passed to onChange.

const CORRECTION = 'mailto:alumni@mcu.edu.ph?subject=' + encodeURIComponent('Alumni profile: correction to my verified record');
const PH = 'Philippines';

const pick = (obj, keys) => Object.fromEntries(keys.map((k) => [k, obj[k] ?? '']));
const show = (v) => (v === null || v === undefined || v === '' ? '—' : v);
const longDate = (d) => (d ? new Date(`${String(d).slice(0, 10)}T00:00:00`).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' }) : '—');

function useSaver(onChange) {
  const [state, setState] = useState({ busy: false, errors: {}, message: '', ok: false });
  const run = async (fn, success) => {
    setState({ busy: true, errors: {}, message: '', ok: false });
    try {
      const profile = await fn();
      onChange(profile);
      setState({ busy: false, errors: {}, message: success, ok: true });
      return true;
    } catch (err) {
      setState({ busy: false, errors: err.fields || {}, message: err.message || 'Something went wrong', ok: false });
      return false;
    }
  };
  return [state, run, () => setState((s) => ({ ...s, message: '' }))];
}

function SaveBar({ state, label = 'Save changes' }) {
  return (
    <div className="pf-savebar">
      {state.message && (
        <span className={`pf-msg ${state.ok ? 'is-ok' : 'is-error'}`} role="status">
          <Icon name={state.ok ? 'check' : 'close'} size={14} /> {state.message}
        </span>
      )}
      <button type="submit" className="btn btn-primary" disabled={state.busy}>
        {state.busy ? <span className="spinner" aria-hidden="true" /> : <Icon name="check" size={16} />} {label}
      </button>
    </div>
  );
}

// ---- Header: who + completeness --------------------------------------------
function Header({ profile }) {
  const { percent, missing } = profile.completeness;
  return (
    <section className="pf-head">
      <span className="pf-avatar" aria-hidden="true">
        {profile.photo ? <img src={assetUrl(profile.photo)} alt="" /> : initials(profile)}
      </span>
      <div className="pf-head__who">
        <h2>{fullName(profile)}</h2>
        <div className="pf-head__chips">
          <span className="pf-chip pf-chip--gold"><Icon name="id" size={13} /> {profile.alumniNumber || 'Alumni No. pending'}</span>
          <span className="pf-chip">Student ID {profile.studentNumber}</span>
          <span className="pf-chip">{profile.program} · {profile.yearGraduated}</span>
        </div>
      </div>
      <div className="pf-progress" title={missing.length ? `Missing: ${missing.join(', ')}` : 'Complete'}>
        <div className="pf-progress__top">
          <strong>{percent}%</strong>
          <span>profile complete</span>
        </div>
        <div className="pf-progress__bar"><span style={{ width: `${percent}%` }} /></div>
        {missing.length > 0 && <small>Still missing: {missing.slice(0, 3).join(', ')}{missing.length > 3 ? ` +${missing.length - 3} more` : ''}</small>}
      </div>
    </section>
  );
}

// ---- Tab: A. Profile ----------------------------------------------------------
const VERIFIED_FIELDS = ['studentNumber', 'surname', 'firstName', 'middleName', 'suffix', 'birthDate', 'program', 'yearGraduated', 'email'];
const PERSONAL_FIELDS = ['maidenName', 'sex', 'nationality', 'birthPlace', 'civilStatus', 'religion', 'phone'];

function ProfileTab({ profile, mode, api, onChange }) {
  const staff = mode === 'staff';
  const editable = staff ? [...VERIFIED_FIELDS, ...PERSONAL_FIELDS] : [...PERSONAL_FIELDS, ...(profile.birthDate ? [] : ['birthDate'])];
  const [values, setValues] = useState(() => pick(profile, editable));
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState(null);
  const [state, run] = useSaver(onChange);

  useEffect(() => {
    setValues(pick(profile, editable));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);
  useEffect(() => {
    if (!photo) return setPreview(null);
    const url = URL.createObjectURL(photo);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  const bind = (name) => ({ name, value: values[name] ?? '', error: state.errors[name], onChange: (e) => setValues((v) => ({ ...v, [name]: e.target.value })) });
  const save = (e) => {
    e.preventDefault();
    run(() => api.saveProfile(values, photo), 'Saved').then((ok) => ok && setPhoto(null));
  };

  return (
    <form className="pf-panel" onSubmit={save} noValidate>
      <section className={`pf-card ${staff ? '' : 'pf-card--locked'}`}>
        <header className="pf-card__head">
          <span className="pf-card__icon"><Icon name="shield" size={18} /></span>
          <div>
            <h3>Verified record</h3>
            <p>{staff ? 'Verified details. Changes are recorded in the history.' : 'Verified by the Alumni Relations Office.'}</p>
          </div>
          {!staff && <a href={CORRECTION} className="pf-link"><Icon name="mail" size={14} /> Request a correction</a>}
        </header>
        {staff ? (
          <div className="form-grid">
            <Field label="Alumni number" value={profile.alumniNumber || 'Assigned automatically'} disabled hint="System-generated" />
            <Field label="Student ID number" required {...bind('studentNumber')} />
            <Field label="Surname" required {...bind('surname')} />
            <Field label="First name" required {...bind('firstName')} />
            <Field label="Middle name" {...bind('middleName')} />
            <Field label="Suffix" placeholder="Jr., III" {...bind('suffix')} />
            <Field label="Date of birth" type="date" {...bind('birthDate')} />
            <Field label="Email" type="email" {...bind('email')} />
            <Field label="Degree / program" required {...bind('program')} />
            <Field label="Year graduated" type="number" required {...bind('yearGraduated')} />
          </div>
        ) : (
          <dl className="pf-values">
            <div><dt>Alumni number</dt><dd>{show(profile.alumniNumber)}</dd></div>
            <div><dt>Student ID number</dt><dd>{profile.studentNumber}</dd></div>
            <div><dt>Full name</dt><dd>{fullName(profile)}</dd></div>
            <div><dt>Degree / program</dt><dd>{profile.program}</dd></div>
            <div><dt>Year graduated</dt><dd>{profile.yearGraduated}</dd></div>
            <div><dt>Email</dt><dd>{show(profile.email)}</dd></div>
            {profile.birthDate && <div><dt>Date of birth</dt><dd>{longDate(profile.birthDate)}</dd></div>}
          </dl>
        )}
      </section>

      <section className="pf-card">
        <header className="pf-card__head">
          <span className="pf-card__icon"><Icon name="users" size={18} /></span>
          <div>
            <h3>Personal details</h3>
            <p>Keep these current so we can reach you.</p>
          </div>
        </header>
        <div className="pf-photo">
          <span className="pf-photo__img">
            {preview || profile.photo ? <img src={preview || assetUrl(profile.photo)} alt="" /> : <Icon name="users" size={26} />}
          </span>
          <label className="btn btn-outline btn-sm">
            <Icon name="image" size={15} /> {profile.photo || photo ? 'Change photo' : 'Upload photo'}
            <input type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => setPhoto(e.target.files[0] || null)} />
          </label>
          <small className="muted">A clear, front-facing photo (used for your Alumni ID). JPG or PNG, up to 5 MB.</small>
          {state.errors.photo && <small className="field__error">{state.errors.photo}</small>}
        </div>
        <div className="form-grid">
          {!staff && !profile.birthDate && <Field label="Date of birth" type="date" hint="You can add this once; later changes go through the Alumni Office." {...bind('birthDate')} />}
          <Field label="Sex" as="select" options={SEXES} {...bind('sex')} />
          <Field label="Mobile number" type="tel" placeholder="09XX XXX XXXX" {...bind('phone')} />
          <Field label="Nationality" placeholder="Filipino" {...bind('nationality')} />
          <Field label="Place of birth" placeholder="City / municipality" {...bind('birthPlace')} />
          <Field label="Maiden name" hint="If applicable" {...bind('maidenName')} />
          <Field label="Civil status" as="select" options={CIVIL_STATUS} hint="Optional" {...bind('civilStatus')} />
          <Field label="Religion" hint="Optional. Only Alumni Office staff can see this." {...bind('religion')} />
        </div>
      </section>
      <SaveBar state={state} />
    </form>
  );
}

// ---- Tab: B. Current residential information ------------------------------------
const ADDRESS_FIELDS = ['country', 'houseStreet', 'regionCode', 'provinceCode', 'cityCode', 'barangayCode', 'region', 'province', 'city', 'barangay', 'zipCode'];

function AddressTab({ profile, api, onChange }) {
  const [values, setValues] = useState(() => ({ ...pick(profile, ADDRESS_FIELDS), country: profile.country || PH }));
  const [state, run] = useSaver(onChange);
  const abroad = values.country !== PH;

  useEffect(() => {
    setValues({ ...pick(profile, ADDRESS_FIELDS), country: profile.country || PH });
  }, [profile]);
  const bind = (name) => ({ name, value: values[name] ?? '', error: state.errors[name], onChange: (e) => setValues((v) => ({ ...v, [name]: e.target.value })) });

  const save = (e) => {
    e.preventDefault();
    const data = abroad
      ? pick(values, ['country', 'houseStreet', 'barangay', 'city', 'province', 'region', 'zipCode'])
      : pick(values, ['country', 'houseStreet', 'regionCode', 'provinceCode', 'cityCode', 'barangayCode', 'zipCode']);
    run(() => api.saveProfile(data), 'Address saved');
  };

  return (
    <form className="pf-panel" onSubmit={save} noValidate>
      <section className="pf-card">
        <header className="pf-card__head">
          <span className="pf-card__icon"><Icon name="pin" size={18} /></span>
          <div>
            <h3>Current residential address</h3>
            <p>{profile.city ? `On file: ${[profile.houseStreet, profile.barangay, profile.city, profile.province].filter(Boolean).join(', ')}` : 'Where you live now.'}</p>
          </div>
        </header>
        <div className="pf-country" role="radiogroup" aria-label="Country">
          <button type="button" role="radio" aria-checked={!abroad} className={`pf-choice ${!abroad ? 'is-selected' : ''}`} onClick={() => setValues((v) => ({ ...v, country: PH }))}>
            <Icon name="pin" size={16} /> Philippines
          </button>
          <button type="button" role="radio" aria-checked={abroad} className={`pf-choice ${abroad ? 'is-selected' : ''}`} onClick={() => setValues((v) => ({ ...v, country: v.country && v.country !== PH ? v.country : '' }))}>
            <Icon name="compass" size={16} /> Outside the Philippines
          </button>
        </div>
        <div className="form-grid">
          {abroad && <Field label="Country" required className="span-2" {...bind('country')} />}
          <Field label="House no. / street / subdivision" required className="span-2" {...bind('houseStreet')} />
          {abroad ? (
            <>
              <Field label="City" required {...bind('city')} />
              <Field label="State / province" {...bind('province')} />
            </>
          ) : (
            <AddressPicker value={values} errors={state.errors} onChange={(next) => setValues((v) => ({ ...v, ...next }))} />
          )}
          <Field label="ZIP / postal code" {...bind('zipCode')} />
        </div>
      </section>
      <SaveBar state={state} label="Save address" />
    </form>
  );
}

// ---- Tabs: C. Repeatable sections ----------------------------------------------------
function toForm(section, item = {}) {
  return Object.fromEntries(
    section.fields.map((f) => {
      const v = item[f.name];
      if (f.type === 'checkbox') return [f.name, Boolean(v)];
      if (f.type === 'yesno') return [f.name, v === true ? 'true' : v === false ? 'false' : ''];
      return [f.name, v ?? ''];
    })
  );
}
function fromForm(section, values) {
  return Object.fromEntries(
    section.fields.map((f) => {
      const v = values[f.name];
      if (f.type === 'yesno') return [f.name, v === '' ? null : v === 'true'];
      if (f.type === 'number') return [f.name, v === '' ? null : Number(v)];
      return [f.name, v];
    })
  );
}

function EntryForm({ section, item, choices, onCancel, onSave, state }) {
  const [values, setValues] = useState(() => toForm(section, item));
  const submit = (e) => {
    e.preventDefault();
    onSave(fromForm(section, values));
  };
  return (
    <form className="pf-entry-form" onSubmit={submit} noValidate>
      <div className="form-grid">
        {section.fields.map((f) => {
          const common = {
            key: f.name,
            name: f.name,
            label: f.label,
            required: f.required,
            hint: f.hint,
            error: state.errors[f.name],
            className: f.span === 2 || f.type === 'checkbox' ? 'span-2' : '',
          };
          if (f.type === 'checkbox')
            return <Field {...common} as="checkbox" value={values[f.name]} onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.checked }))} />;
          const onChange = (e) => setValues((v) => ({ ...v, [f.name]: e.target.value }));
          if (f.type === 'select') return <Field {...common} as="select" options={f.options || choices[f.optionsFrom] || []} value={values[f.name]} onChange={onChange} />;
          if (f.type === 'yesno') return <Field {...common} as="select" options={YES_NO} value={values[f.name]} onChange={onChange} />;
          return <Field {...common} type={f.type || 'text'} value={values[f.name]} onChange={onChange} />;
        })}
      </div>
      <div className="pf-entry-form__actions">
        {state.message && !state.ok && <span className="pf-msg is-error"><Icon name="close" size={14} /> {state.message}</span>}
        <button type="button" className="btn btn-outline btn-sm" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-primary btn-sm" disabled={state.busy}>{state.busy ? 'Saving…' : 'Save'}</button>
      </div>
    </form>
  );
}

function SectionTab({ section, profile, api, onChange, choices }) {
  const items = profile[section.key] || [];
  const [editing, setEditing] = useState(null); // 'new' | item id
  const [state, run, clear] = useSaver(onChange);

  const save = async (data) => {
    const ok = await run(
      () => (editing === 'new' ? api.addItem(section.key, data) : api.editItem(section.key, editing, data)),
      editing === 'new' ? 'Added' : 'Saved'
    );
    if (ok) setEditing(null);
  };
  const remove = (item) => {
    if (!window.confirm(`Remove "${section.title(item)}"?`)) return;
    run(() => api.removeItem(section.key, item.id), 'Removed');
  };
  const open = (target) => {
    clear();
    setEditing(target);
  };

  return (
    <div className="pf-panel">
      <section className="pf-card">
        <header className="pf-card__head">
          <span className="pf-card__icon"><Icon name={section.icon} size={18} /></span>
          <div>
            <h3>{section.label}</h3>
            <p>{section.intro}</p>
          </div>
          {editing !== 'new' && (
            <button type="button" className="btn btn-primary btn-sm" onClick={() => open('new')}>
              <Icon name="plus" size={15} /> {section.add}
            </button>
          )}
        </header>

        {editing === 'new' && <EntryForm section={section} choices={choices} state={state} onCancel={() => setEditing(null)} onSave={save} />}

        {items.length ? (
          <ul className="pf-entries">
            {items.map((item) =>
              editing === item.id ? (
                <li key={item.id} className="is-editing">
                  <EntryForm section={section} item={item} choices={choices} state={state} onCancel={() => setEditing(null)} onSave={save} />
                </li>
              ) : (
                <li key={item.id}>
                  <div className="pf-entry">
                    <div>
                      <strong>{section.title(item)}</strong>
                      {section.meta(item) && <span>{section.meta(item)}</span>}
                      {section.badges(item).length > 0 && (
                        <span className="pf-entry__badges">{section.badges(item).map((b) => <span key={b} className="pf-chip">{b}</span>)}</span>
                      )}
                    </div>
                    <div className="pf-entry__actions">
                      <button type="button" onClick={() => open(item.id)} aria-label={`Edit ${section.title(item)}`}><Icon name="file" size={15} /> Edit</button>
                      <button type="button" className="is-danger" onClick={() => remove(item)} aria-label={`Remove ${section.title(item)}`}><Icon name="close" size={15} /></button>
                    </div>
                  </div>
                </li>
              )
            )}
          </ul>
        ) : (
          editing !== 'new' && <p className="pf-empty">Nothing added yet.</p>
        )}
        {state.message && state.ok && <span className="pf-msg is-ok" role="status"><Icon name="check" size={14} /> {state.message}</span>}
      </section>
    </div>
  );
}

// ---- Editor -----------------------------------------------------------------------
export default function ProfileEditor({ profile, mode = 'alumni', api, onChange, choices = {}, extraTabs = [] }) {
  const tabs = useMemo(
    () => [
      { key: 'profile', label: 'Profile', icon: 'id' },
      { key: 'address', label: 'Address', icon: 'pin' },
      ...SECTIONS.map((s) => ({ key: s.key, label: s.label, icon: s.icon, count: (profile[s.key] || []).length })),
      ...extraTabs,
    ],
    [profile, extraTabs]
  );
  const [tab, setTab] = useState('profile');
  const section = SECTIONS.find((s) => s.key === tab);
  const extra = extraTabs.find((t) => t.key === tab);

  return (
    <div className="pf">
      <Header profile={profile} />
      <nav className="pf-tabs" aria-label="Profile sections">
        {tabs.map((t) => (
          <button key={t.key} type="button" className={`pf-tab ${tab === t.key ? 'is-active' : ''}`} aria-current={tab === t.key ? 'page' : undefined} onClick={() => setTab(t.key)}>
            <Icon name={t.icon} size={16} /> {t.label}
            {t.count > 0 && <span className="pf-tab__count">{t.count}</span>}
          </button>
        ))}
      </nav>
      {tab === 'profile' && <ProfileTab profile={profile} mode={mode} api={api} onChange={onChange} />}
      {tab === 'address' && <AddressTab profile={profile} api={api} onChange={onChange} />}
      {section && <SectionTab key={section.key} section={section} profile={profile} api={api} onChange={onChange} choices={choices} />}
      {extra && extra.render()}
    </div>
  );
}

export { LABELS };
