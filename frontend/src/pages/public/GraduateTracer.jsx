import PageHero from '../../components/ui/PageHero.jsx';
import AsyncContent from '../../components/ui/AsyncContent.jsx';
import Icon from '../../components/ui/Icon.jsx';
import Field from '../../components/forms/Field.jsx';
import FormStatus from '../../components/forms/FormStatus.jsx';
import SubmitButton from '../../components/forms/SubmitButton.jsx';
import { useContent } from '../../hooks/useContent.js';
import { useForm } from '../../hooks/useForm.js';

const initialValues = {
  firstName: '', lastName: '', email: '', phone: '', course: '', yearGraduated: '',
  employmentStatus: '', employer: '', position: '', industry: '', workLocation: '',
  relatedToCourse: '', timeToFirstJob: '', monthlyIncome: '', licensure: '', feedback: '', consent: false,
};

function TracerForm({ courses, options }) {
  const { values, field, status, onSubmit } = useForm('tracer', initialValues);
  const working = ['Employed', 'Self-employed'].includes(values.employmentStatus);

  return (
    <form onSubmit={onSubmit} className="form" noValidate>
      <fieldset>
        <legend>About you</legend>
        <div className="form-grid">
          <Field label="First name" autoComplete="given-name" required {...field('firstName')} />
          <Field label="Last name" autoComplete="family-name" required {...field('lastName')} />
          <Field label="Email" type="email" autoComplete="email" required {...field('email')} />
          <Field label="Mobile number" type="tel" autoComplete="tel" required {...field('phone')} />
          <Field label="Course / Department" as="select" options={courses} required {...field('course')} />
          <Field label="Year graduated" type="number" inputMode="numeric" required {...field('yearGraduated')} />
        </div>
      </fieldset>

      <fieldset>
        <legend>Employment</legend>
        <div className="form-grid">
          <Field label="Current employment status" as="select" options={options.employmentStatus} required className="span-2" {...field('employmentStatus')} />
          {working && (
            <>
              <Field label="Company / Employer" autoComplete="organization" {...field('employer')} />
              <Field label="Position / Job title" autoComplete="organization-title" {...field('position')} />
              <Field label="Industry" hint="e.g. Healthcare, Education, BPO" {...field('industry')} />
              <Field label="Work location (city, country)" {...field('workLocation')} />
              <Field label="Is your job related to your MCU course?" as="select" options={['Yes', 'No']} {...field('relatedToCourse')} />
              <Field label="Monthly income" as="select" options={options.monthlyIncome} {...field('monthlyIncome')} />
            </>
          )}
          <Field label="How long did it take to land your first job?" as="select" options={options.timeToFirstJob} className="span-2" {...field('timeToFirstJob')} />
          <Field label="Licensure exam passed (if any)" hint="e.g. Nurse Licensure Exam, 2023" className="span-2" {...field('licensure')} />
        </div>
      </fieldset>

      <fieldset>
        <legend>Feedback</legend>
        <Field label="How did your MCU education prepare you for your career?" as="textarea" {...field('feedback')} />
      </fieldset>

      <Field
        as="checkbox"
        label="I agree to let Manila Central University use my responses for graduate tracer studies and accreditation, in accordance with the Data Privacy Act of 2012."
        required
        {...field('consent')}
      />

      <FormStatus status={status} />
      <SubmitButton status={status} className="btn-lg btn-block">Submit tracer form</SubmitButton>
    </form>
  );
}

export default function GraduateTracer() {
  const courses = useContent('courses');
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
            <p className="muted">It takes about 5 minutes.</p>
          </aside>
          <div className="card card--padded">
            {courses.data && options.data ? (
              <TracerForm courses={courses.data} options={options.data} />
            ) : (
              <AsyncContent state={courses.error ? courses : options} skeleton={1}>{() => null}</AsyncContent>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
