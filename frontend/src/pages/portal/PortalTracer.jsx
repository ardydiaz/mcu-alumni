import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import AsyncContent from '../../components/ui/AsyncContent.jsx';
import Icon from '../../components/ui/Icon.jsx';
import Field from '../../components/forms/Field.jsx';
import FormStatus from '../../components/forms/FormStatus.jsx';
import SubmitButton from '../../components/forms/SubmitButton.jsx';
import { useContent } from '../../hooks/useContent.js';
import { usePortalAuth } from '../../context/PortalAuthContext.jsx';
import { portalApi } from '../../api/portal.js';
import { useForm } from '../../hooks/useForm.js';
import { JobCategories } from '../public/GraduateTracer.jsx';
import { PortalPageHead } from './PortalLayout.jsx';
import '../../styles/tracer.css';

// Graduate Tracer inside the Alumni Portal:
// existing profile appears -> alumnus reviews it -> updates only what changed -> tracer questions -> submit.

const YES_NO = ['Yes', 'No'];
const OTHER = 'Other';

const STEPS = [
  { key: 'profile', icon: 'id', title: 'Review profile', text: 'Check the details we have' },
  { key: 'employment', icon: 'building', title: 'Employment', text: 'Your current work' },
  { key: 'studies', icon: 'book', title: 'Further studies', text: 'A few more questions' },
  { key: 'review', icon: 'check', title: 'Review & submit', text: 'Confirm your answers' },
];

const EMPTY = {
  fullName: '', sex: '', email: '', phone: '', address: '', yearGraduated: '', degree: '',
  isEmployed: '', employer: '', jobCategories: [], jobCategoryOther: '', position: '', relatedToDegree: '', timeToFirstJob: '',
  furtherStudies: '', furtherStudiesTiming: '', consent: false,
};

const LABELS = {
  fullName: 'Full name', sex: 'Sex', email: 'Contact email', phone: 'Contact number', address: 'Complete address',
  yearGraduated: 'Year graduated', degree: 'Course / degree', isEmployed: 'Currently employed', employer: 'Company name',
  jobCategories: 'Job category', position: 'Job title / position', relatedToDegree: 'Job related to degree',
  timeToFirstJob: 'Time to first job', furtherStudies: 'Pursued further studies', furtherStudiesTiming: 'When further studies started',
};

// Profile cards on step 1. The verified record is read-only (it comes from the account the Alumni Office
// verified); personal and contact details can be updated and are saved back to the account on submit.
const PROFILE_GROUPS = [
  { key: 'verified', icon: 'shield', title: 'Verified record', fields: ['fullName', 'degree', 'yearGraduated', 'email'], locked: true },
  { key: 'personal', icon: 'users', title: 'Personal & contact', fields: ['sex', 'phone', 'address'] },
];

const CORRECTION_LINK = 'mailto:alumni@mcu.edu.ph?subject=' + encodeURIComponent('Alumni Portal: correction to my verified record');

const same = (a, b) => JSON.stringify(a ?? '') === JSON.stringify(b ?? '');

const STEP_OF = {
  fullName: 0, sex: 0, email: 0, phone: 0, address: 0, yearGraduated: 0, degree: 0,
  isEmployed: 1, employer: 1, jobCategories: 1, jobCategoryOther: 1, position: 1, relatedToDegree: 1, timeToFirstJob: 1,
  furtherStudies: 2, furtherStudiesTiming: 2, consent: 3,
};

const isBlank = (v) => (Array.isArray(v) ? v.length === 0 : v === '' || v == null || v === false);
const show = (v) => (Array.isArray(v) ? v.join(', ') : v);

// Light checks before moving to the next step; the server re-checks everything on submit.
function stepErrors(step, v) {
  const e = {};
  const need = (k, msg = 'Please answer this question') => isBlank(v[k]) && (e[k] = msg);
  if (step === 0) {
    need('fullName');
    if (v.fullName && !/^[^,]+,\s*[^,]+/.test(v.fullName)) e.fullName = 'Please follow the format: Dela Cruz, Juan Carlo, M.';
    ['sex', 'email', 'phone', 'yearGraduated', 'degree'].forEach((k) => need(k));
    need('address', 'Please enter your complete address');
    if (v.address && v.address.trim().length < 10) e.address = 'Please include house number, street, barangay, city and ZIP code';
  }
  if (step === 1) {
    need('isEmployed');
    if (v.isEmployed === 'Yes') {
      ['employer', 'position', 'relatedToDegree', 'timeToFirstJob'].forEach((k) => need(k));
      need('jobCategories', 'Please choose at least one job category');
      if (v.jobCategories.includes(OTHER)) need('jobCategoryOther', 'Please specify your job category');
    }
  }
  if (step === 2) ['furtherStudies', 'furtherStudiesTiming'].forEach((k) => need(k));
  if (step === 3) need('consent', 'Please give your consent to continue');
  return e;
}

function Stepper({ current, onGo }) {
  return (
    <ol className="ptw-steps">
      {STEPS.map((s, i) => (
        <li key={s.key} className={i < current ? 'is-done' : i === current ? 'is-current' : ''}>
          <button type="button" onClick={() => onGo(i)} disabled={i > current} aria-current={i === current ? 'step' : undefined}>
            <span className="ptw-steps__dot" aria-hidden="true"><Icon name={i < current ? 'check' : s.icon} size={16} /></span>
            <span className="ptw-steps__text">
              <small>Step {i + 1}</small>
              <strong>{s.title}</strong>
            </span>
          </button>
        </li>
      ))}
    </ol>
  );
}

// One profile card: shows saved values; "Edit" switches to inputs. Cards with missing answers open in edit mode.
function ProfileCard({ group, values, baseline, errors, editing, onEdit, renderField }) {
  const missing = group.fields.filter((k) => isBlank(values[k]));
  const changed = group.fields.filter((k) => !isBlank(baseline[k]) && !same(values[k], baseline[k]));
  // `editing` stays on once a card is opened, so it doesn't close while the alumnus is typing.
  const open = !group.locked && (editing || group.fields.some((k) => errors[k]));

  return (
    <section className={`ptw-card ${open ? 'is-editing' : ''} ${group.locked ? 'ptw-card--locked' : ''}`}>
      <header className="ptw-card__head">
        <span className="ptw-card__icon" aria-hidden="true"><Icon name={group.icon} size={18} /></span>
        <h3>{group.title}</h3>
        {group.locked && <span className="ptw-chip ptw-chip--locked"><Icon name="check" size={12} /> Verified by the Alumni Office</span>}
        {!group.locked && missing.length > 0 && <span className="ptw-chip ptw-chip--missing">{missing.length} to answer</span>}
        {changed.length > 0 && <span className="ptw-chip ptw-chip--updated">Updated</span>}
        {!open && !group.locked && <button type="button" className="ptw-card__edit" onClick={onEdit}><Icon name="file" size={14} /> Edit</button>}
        {group.locked && <a className="ptw-card__edit" href={CORRECTION_LINK}><Icon name="mail" size={14} /> Request a correction</a>}
      </header>
      {open ? (
        <div className="ptw-card__fields">{group.fields.map((k) => renderField(k))}</div>
      ) : (
        <dl className="ptw-card__values">
          {group.fields.map((k) => (
            <div key={k}>
              <dt>{LABELS[k]}</dt>
              <dd>{show(values[k])}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}

function TracerWizard({ options, prefill, lastSubmittedAt, onSubmitted }) {
  const baseline = useMemo(() => ({ ...EMPTY, ...prefill }), [prefill]);
  // Submitted to /portal/tracer with the alumni session: saved as a new response linked to the account.
  const { values, errors, field, setValue, status, onSubmit } = useForm('portal-tracer', baseline, { submit: portalApi.submitTracer });
  const [step, setStep] = useState(0);
  const [localErrors, setLocalErrors] = useState({});
  // Cards with unanswered fields start open; the others show the saved values with an Edit button.
  const [editing, setEditing] = useState(() =>
    Object.fromEntries(PROFILE_GROUPS.map((g) => [g.key, g.fields.some((k) => isBlank(baseline[k]))]))
  );
  const [done, setDone] = useState(false);

  const allErrors = { ...errors, ...localErrors };
  const answer = (name, value) => {
    field(name).onChange({ target: { name, value, type: 'text' } });
    if (localErrors[name]) setLocalErrors(({ [name]: _r, ...rest }) => rest);
  };
  const bind = (name) => ({ ...field(name), error: allErrors[name], onChange: (e) => answer(name, e.target.type === 'checkbox' ? e.target.checked : e.target.value) });

  // Server-side errors: jump back to the first step that has one.
  useEffect(() => {
    const keys = Object.keys(errors);
    if (keys.length) setStep(Math.min(...keys.map((k) => STEP_OF[k] ?? 3)));
  }, [errors]);
  useEffect(() => {
    if (status.state !== 'success') return;
    setDone(true);
    onSubmitted(); // the account may have new contact details
  }, [status, onSubmitted]);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step, done]);

  const next = () => {
    const e = stepErrors(step, values);
    setLocalErrors(e);
    if (!Object.keys(e).length) setStep((s) => s + 1);
  };
  const submit = (e) => {
    const errs = stepErrors(3, values);
    setLocalErrors(errs);
    if (Object.keys(errs).length) return e.preventDefault();
    return onSubmit(e);
  };

  const onFurtherStudies = (e) => {
    answer('furtherStudies', e.target.value);
    if (e.target.value === 'No') answer('furtherStudiesTiming', 'N/A');
    else if (values.furtherStudiesTiming === 'N/A') setValue('furtherStudiesTiming', '');
  };
  const timingOptions = values.furtherStudies === 'Yes' ? options.furtherStudiesTiming.filter((t) => t !== 'N/A') : options.furtherStudiesTiming;
  const toggleCategory = (c) =>
    answer('jobCategories', values.jobCategories.includes(c) ? values.jobCategories.filter((x) => x !== c) : [...values.jobCategories, c]);

  // Only the editable profile fields (the verified record is read-only).
  const renderProfileField = (k) => {
    if (k === 'sex') return <Field key={k} label="Sex" as="select" options={options.sexes} required {...bind('sex')} />;
    if (k === 'address')
      return <Field key={k} label="Complete address" as="textarea" rows={2} hint="House number, street, barangay, city/municipality, province and ZIP code." required {...bind('address')} />;
    return <Field key={k} label="Contact number" type="tel" required {...bind('phone')} />;
  };

  // Review rows: compared with the saved answers (account + last tracer): updated, newly answered or the same.
  const withOther = (cats) => cats.map((c) => (c === OTHER && values.jobCategoryOther ? `Other: ${values.jobCategoryOther}` : c));
  const reviewRows = Object.keys(LABELS)
    .filter((k) => values.isEmployed === 'Yes' || STEP_OF[k] !== 1 || k === 'isEmployed')
    .map((k) => {
      const v = k === 'jobCategories' ? withOther(values.jobCategories) : values[k];
      const tag = isBlank(baseline[k]) ? 'new' : same(values[k], baseline[k]) ? 'same' : 'updated';
      return { k, v, tag, step: STEP_OF[k] };
    });
  const updatedCount = reviewRows.filter((r) => r.tag === 'updated').length;

  if (done) {
    return (
      <section className="ptw-done">
        <span className="ptw-done__icon" aria-hidden="true"><Icon name="check" size={34} /></span>
        <h2>{status.message || 'Thank you for completing the Graduate Tracer!'}</h2>
        <p>Your answers were saved to your MCU alumni record. Next time, they will be filled in for you, so you only update what changed.</p>
        <div className="ptw-done__actions">
          <Link to="/portal/account" className="btn btn-primary btn-lg">Back to dashboard</Link>
          <Link to="/portal/perks" className="btn btn-outline btn-lg">See alumni perks</Link>
        </div>
      </section>
    );
  }

  return (
    <form onSubmit={submit} className="form ptw" noValidate>
      <Stepper current={step} onGo={(i) => i <= step && setStep(i)} />

      {step === 0 && (
        <div className="ptw-panel">
          <div className="ptw-intro">
            <Icon name="id" size={20} />
            {lastSubmittedAt ? (
              <p>
                <strong>Your answers from {new Date(lastSubmittedAt).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })} are filled in.</strong>{' '}
                Review them and update only what has changed since then.
              </p>
            ) : (
              <p><strong>We've filled in what we already know.</strong> Review your details and edit only what has changed. Fields marked "to answer" are new.</p>
            )}
          </div>
          <div className="ptw-cards">
            {PROFILE_GROUPS.map((g) => (
              <ProfileCard
                key={g.key}
                group={g}
                values={values}
                baseline={baseline}
                errors={allErrors}
                editing={editing[g.key]}
                onEdit={() => setEditing((s) => ({ ...s, [g.key]: true }))}
                renderField={renderProfileField}
              />
            ))}
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="ptw-panel ptw-section">
          <h2 className="ptw-section__title"><Icon name="building" size={18} /> Employment information</h2>
          <div className="ptw-yesno" role="radiogroup" aria-label="Are you currently employed?">
            <p className="ptw-q">Are you currently employed? <span className="req">*</span></p>
            {YES_NO.map((o) => (
              <button key={o} type="button" role="radio" aria-checked={values.isEmployed === o} className={`ptw-choice ${values.isEmployed === o ? 'is-selected' : ''}`} onClick={() => answer('isEmployed', o)}>
                <Icon name={o === 'Yes' ? 'check' : 'close'} size={16} /> {o === 'Yes' ? 'Yes, I am employed' : 'No, not at the moment'}
              </button>
            ))}
            {allErrors.isEmployed && <small className="field__error">{allErrors.isEmployed}</small>}
          </div>
          {values.isEmployed === 'Yes' && (
            <div className="tracer-reveal">
              <div className="form-grid">
                <Field label="Company name" hint="If retired, your last employer." required {...bind('employer')} />
                <Field label="Job title / position" hint="If retired, your last position." required {...bind('position')} />
              </div>
              <JobCategories
                options={options.jobCategories}
                values={values.jobCategories}
                otherValue={values.jobCategoryOther}
                error={allErrors.jobCategories}
                otherError={allErrors.jobCategoryOther}
                onToggle={toggleCategory}
                onOther={(v) => answer('jobCategoryOther', v)}
              />
              <div className="form-grid">
                <Field label="Is your current job related to your degree?" as="select" options={YES_NO} required {...bind('relatedToDegree')} />
                <Field label="How long did it take to get your first job after graduation?" as="select" options={options.timeToFirstJob} required {...bind('timeToFirstJob')} />
              </div>
            </div>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="ptw-panel ptw-section">
          <h2 className="ptw-section__title"><Icon name="book" size={18} /> Further studies</h2>
          <div className="form-grid">
            <Field label="Did you pursue further studies?" as="select" options={YES_NO} required {...bind('furtherStudies')} onChange={onFurtherStudies} />
            <Field
              label="If yes, how long after graduation?"
              as="select"
              options={timingOptions}
              hint="If No, this is set to N/A."
              required
              disabled={values.furtherStudies === 'No'}
              {...bind('furtherStudiesTiming')}
            />
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="ptw-panel ptw-section">
          <div className="ptw-review__head">
            <h2 className="ptw-section__title"><Icon name="check" size={18} /> Review your answers</h2>
            <span className="ptw-chip ptw-chip--updated">{updatedCount} updated</span>
          </div>
          {STEPS.slice(0, 3).map((s, i) => (
            <div key={s.key} className="ptw-review">
              <div className="ptw-review__group">
                <strong>{i === 0 ? 'Profile' : s.title}</strong>
                <button type="button" onClick={() => setStep(i)}>Edit</button>
              </div>
              <dl>
                {reviewRows.filter((r) => r.step === i).map((r) => (
                  <div key={r.k} className={`ptw-review__row is-${r.tag}`}>
                    <dt>{LABELS[r.k]}</dt>
                    <dd>
                      {show(r.v) || '—'}
                      {r.tag === 'updated' && <span className="ptw-chip ptw-chip--updated">Updated</span>}
                      {r.tag === 'updated' && <small>was: {show(baseline[r.k])}</small>}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
          <Field
            as="checkbox"
            label="I agree to let Manila Central University use my responses for graduate tracer studies and accreditation, in accordance with the Data Privacy Act of 2012."
            required
            {...bind('consent')}
          />
        </div>
      )}

      <FormStatus status={status} />
      <div className="ptw-nav">
        {step > 0 ? (
          <button type="button" className="btn btn-outline btn-lg" onClick={() => setStep((s) => s - 1)}>Back</button>
        ) : (
          <span />
        )}
        <span className="ptw-nav__count">Step {step + 1} of {STEPS.length}</span>
        {step < 3 ? (
          <button type="button" className="btn btn-primary btn-lg" onClick={next}>
            {step === 0 ? 'Looks good, continue' : 'Continue'} <Icon name="arrowRight" size={18} />
          </button>
        ) : (
          <SubmitButton status={status} className="btn-lg"><Icon name="check" size={18} /> Submit tracer</SubmitButton>
        )}
      </div>
    </form>
  );
}

// Loads what the portal already knows (account + the alumnus's latest tracer answers).
function usePrefill() {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  useEffect(() => {
    let active = true;
    portalApi
      .tracer()
      .then((res) => active && setState({ data: res.data, loading: false, error: null }))
      .catch((error) => active && setState({ data: null, loading: false, error }));
    return () => {
      active = false;
    };
  }, []);
  return state;
}

export default function PortalTracer() {
  const { refresh } = usePortalAuth();
  const options = useContent('form-options');
  const prefill = usePrefill();
  const ready = options.data && prefill.data;

  return (
    <>
      <PortalPageHead
        icon="file"
        eyebrow="Graduate Tracer"
        title="Tell us where your journey has taken you"
        text="Your profile is already filled in. Review it, update only what has changed, then answer a few tracer questions."
      />
      {ready ? (
        <TracerWizard options={options.data} prefill={prefill.data.values} lastSubmittedAt={prefill.data.lastSubmittedAt} onSubmitted={refresh} />
      ) : (
        <AsyncContent state={options.error ? options : prefill} skeleton={1}>{() => null}</AsyncContent>
      )}
    </>
  );
}
