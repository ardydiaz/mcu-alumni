import { useEffect, useState } from 'react';
import PageHero from '../../components/ui/PageHero.jsx';
import AsyncContent from '../../components/ui/AsyncContent.jsx';
import Icon from '../../components/ui/Icon.jsx';
import Field from '../../components/forms/Field.jsx';
import FormStatus from '../../components/forms/FormStatus.jsx';
import SubmitButton from '../../components/forms/SubmitButton.jsx';
import DegreeField from '../../components/forms/DegreeField.jsx';
import { useContent } from '../../hooks/useContent.js';
import { useForm } from '../../hooks/useForm.js';
import '../../styles/tracer.css';

const OTHER = 'Other';
const YES_NO = ['Yes', 'No'];

const initialValues = {
  fullName: '', sex: '', email: '', phone: '', address: '', yearGraduated: '', degree: '',
  isEmployed: '', employer: '', jobCategories: [], jobCategoryOther: '', position: '', relatedToDegree: '', timeToFirstJob: '',
  furtherStudies: '', furtherStudiesTiming: '', consent: false,
};

function Section({ icon, title, children }) {
  return (
    <section className="tracer-section">
      <header className="tracer-section__head">
        <Icon name={icon} size={18} />
        <h2>{title}</h2>
      </header>
      <div className="tracer-section__body">{children}</div>
    </section>
  );
}

export function JobCategories({ options, values, otherValue, error, otherError, onToggle, onOther }) {
  const hasOther = values.includes(OTHER);
  return (
    <fieldset className={`field tracer-checks ${error ? 'has-error' : ''}`}>
      <legend>Job Category <span className="req" aria-hidden="true">*</span></legend>
      <small className="field__hint">Check all that apply.</small>
      <div className="tracer-checks__list">
        {options.map((o) => (
          <label key={o} className={`tracer-check ${values.includes(o) ? 'is-checked' : ''}`}>
            <input type="checkbox" checked={values.includes(o)} onChange={() => onToggle(o)} />
            <span className="tracer-check__box" aria-hidden="true"><Icon name="check" size={13} /></span>
            <span>{o === OTHER ? 'Other:' : o}</span>
          </label>
        ))}
      </div>
      {hasOther && (
        <input
          className={`tracer-other ${otherError ? 'has-error' : ''}`}
          placeholder="Please specify your job category"
          aria-label="Other job category"
          value={otherValue}
          onChange={(e) => onOther(e.target.value)}
        />
      )}
      {(error || otherError) && <small className="field__error">{error || otherError}</small>}
    </fieldset>
  );
}

// `initial` pre-fills fields (e.g. from the Alumni Portal account).
export function TracerForm({ options, initial }) {
  const { values, errors, field, setValue, status, onSubmit } = useForm('tracer', { ...initialValues, ...initial });
  const employed = values.isEmployed === 'Yes';
  // Sets a value the way typing does, so the field's error clears once it is answered.
  const answer = (name, value) => field(name).onChange({ target: { name, value, type: 'text' } });

  // The form clears after a successful submit; remount the degree picker so it leaves "Other" mode.
  const [resetKey, setResetKey] = useState(0);
  useEffect(() => {
    if (status.state === 'success') setResetKey((k) => k + 1);
  }, [status]);

  const toggleCategory = (c) => {
    const next = values.jobCategories.includes(c) ? values.jobCategories.filter((x) => x !== c) : [...values.jobCategories, c];
    answer('jobCategories', next);
  };

  // "If No, choose N/A": filled in automatically.
  const onFurtherStudies = (e) => {
    field('furtherStudies').onChange(e);
    if (e.target.value === 'No') answer('furtherStudiesTiming', 'N/A');
    else if (values.furtherStudiesTiming === 'N/A') setValue('furtherStudiesTiming', '');
  };
  const timingOptions = values.furtherStudies === 'Yes' ? options.furtherStudiesTiming.filter((t) => t !== 'N/A') : options.furtherStudiesTiming;

  return (
    <form onSubmit={onSubmit} className="form tracer-form" noValidate>
      <Section icon="id" title="Graduate Profile">
        <Field
          label="Full Name (Last Name, Given Name, M.I.)"
          hint="Please follow the format: Dela Cruz, Juan Carlo, M."
          placeholder="Dela Cruz, Juan Carlo, M."
          autoComplete="name"
          required
          {...field('fullName')}
        />
        <div className="form-grid">
          <Field label="Sex" as="select" options={options.sexes} required {...field('sex')} />
          <Field label="Year Graduated" type="number" inputMode="numeric" min="1950" max={new Date().getFullYear()} required {...field('yearGraduated')} />
          <Field label="Contact Email" type="email" autoComplete="email" required {...field('email')} />
          <Field label="Contact Number" type="tel" autoComplete="tel" placeholder="09XX XXX XXXX" required {...field('phone')} />
        </div>
        <Field
          label="Complete Address"
          as="textarea"
          rows={2}
          hint="Please include house number, street, barangay, city/municipality, province and ZIP code."
          autoComplete="street-address"
          required
          {...field('address')}
        />
        <DegreeField key={resetKey} groups={options.degreeGroups} value={values.degree} error={errors.degree} onChange={(v) => answer('degree', v)} />
      </Section>

      <Section icon="building" title="Employment Information">
        <Field label="Are you currently employed?" as="select" options={YES_NO} required className="tracer-short" {...field('isEmployed')} />
        {!values.isEmployed && (
          <p className="tracer-note">
            <Icon name="building" size={16} /> Choose <strong>Yes</strong> to answer the questions about your company, job category and position.
          </p>
        )}
        {employed && (
          <div className="tracer-reveal">
            <Field label="Company Name" hint="If retired, please specify your last employer." autoComplete="organization" required {...field('employer')} />
            <JobCategories
              options={options.jobCategories}
              values={values.jobCategories}
              otherValue={values.jobCategoryOther}
              error={errors.jobCategories}
              otherError={errors.jobCategoryOther}
              onToggle={toggleCategory}
              onOther={(v) => answer('jobCategoryOther', v)}
            />
            <Field label="Job Title / Position" hint="If retired, please specify your last position." autoComplete="organization-title" required {...field('position')} />
            <div className="form-grid">
              <Field label="Is your current job related to your degree?" as="select" options={YES_NO} required {...field('relatedToDegree')} />
              <Field label="How long did it take you to get your first job after graduation?" as="select" options={options.timeToFirstJob} required {...field('timeToFirstJob')} />
            </div>
          </div>
        )}
      </Section>

      <Section icon="book" title="Additional Information">
        <div className="form-grid">
          <Field label="Did you pursue further studies?" as="select" options={YES_NO} required {...field('furtherStudies')} onChange={onFurtherStudies} />
          <Field
            label="If yes, how long after graduation did you pursue further studies?"
            as="select"
            options={timingOptions}
            hint="If No, choose N/A."
            required
            disabled={values.furtherStudies === 'No'}
            {...field('furtherStudiesTiming')}
          />
        </div>
      </Section>

      <div className="tracer-submit">
        <Field
          as="checkbox"
          label="I agree to let Manila Central University use my responses for graduate tracer studies and accreditation, in accordance with the Data Privacy Act of 2012."
          required
          {...field('consent')}
        />
        <FormStatus status={status} />
        <SubmitButton status={status} className="btn-lg btn-block">Submit tracer form</SubmitButton>
      </div>
    </form>
  );
}

export default function GraduateTracer() {
  const options = useContent('form-options');

  return (
    <>
      <PageHero
        eyebrow="Update Your Info Now"
        title="Graduate Tracer"
        subtitle="Tell us where your MCU journey has taken you. Your answers help us improve our programs and connect you with opportunities."
      />
      <section className="section section--tinted">
        <div className="container form-layout">
          <aside className="form-aside">
            <h2 className="h3">Why it matters</h2>
            <ul className="checklist">
              <li><Icon name="check" size={18} /> Helps MCU improve its curriculum</li>
              <li><Icon name="check" size={18} /> Supports accreditation of your program</li>
              <li><Icon name="check" size={18} /> Connects you with industry partners</li>
            </ul>
            <p className="muted">It takes about 5 minutes. Fields marked <span className="req">*</span> are required.</p>
          </aside>
          <div>
            {options.data?.degreeGroups ? (
              <TracerForm options={options.data} />
            ) : (
              <AsyncContent state={options} skeleton={1}>{() => null}</AsyncContent>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
