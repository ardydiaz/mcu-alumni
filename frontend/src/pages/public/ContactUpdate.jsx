import PageHero from '../../components/ui/PageHero.jsx';
import AsyncContent from '../../components/ui/AsyncContent.jsx';
import Icon from '../../components/ui/Icon.jsx';
import Field from '../../components/forms/Field.jsx';
import FormStatus from '../../components/forms/FormStatus.jsx';
import SubmitButton from '../../components/forms/SubmitButton.jsx';
import { useContent } from '../../hooks/useContent.js';
import { useForm } from '../../hooks/useForm.js';

const initialValues = {
  firstName: '', middleName: '', lastName: '', maidenName: '', birthDate: '',
  email: '', phone: '', address: '', city: '', country: 'Philippines',
  studentNumber: '', course: '', yearGraduated: '', employer: '', position: '',
  requestAlumniId: false, consent: false,
};

function UpdateForm({ courses }) {
  const { field, status, onSubmit } = useForm('alumni-update', initialValues);

  return (
    <form onSubmit={onSubmit} className="form" noValidate>
      <fieldset>
        <legend>Personal information</legend>
        <div className="form-grid">
          <Field label="First name" autoComplete="given-name" required {...field('firstName')} />
          <Field label="Middle name" autoComplete="additional-name" {...field('middleName')} />
          <Field label="Last name" autoComplete="family-name" required {...field('lastName')} />
          <Field label="Maiden name (if applicable)" {...field('maidenName')} />
          <Field label="Date of birth" type="date" autoComplete="bday" {...field('birthDate')} />
        </div>
      </fieldset>

      <fieldset>
        <legend>Contact details</legend>
        <div className="form-grid">
          <Field label="Email" type="email" autoComplete="email" required {...field('email')} />
          <Field label="Mobile number" type="tel" autoComplete="tel" required {...field('phone')} />
          <Field label="Home address" autoComplete="street-address" required className="span-2" {...field('address')} />
          <Field label="City" autoComplete="address-level2" required {...field('city')} />
          <Field label="Country" autoComplete="country-name" required {...field('country')} />
        </div>
      </fieldset>

      <fieldset>
        <legend>MCU education</legend>
        <div className="form-grid">
          <Field label="Course / Department" as="select" options={courses} required className="span-2" {...field('course')} />
          <Field label="Year graduated" type="number" inputMode="numeric" required {...field('yearGraduated')} />
          <Field label="Student number" hint="If you still remember it" {...field('studentNumber')} />
        </div>
      </fieldset>

      <fieldset>
        <legend>Current work</legend>
        <div className="form-grid">
          <Field label="Company / Employer" autoComplete="organization" {...field('employer')} />
          <Field label="Position" autoComplete="organization-title" {...field('position')} />
        </div>
      </fieldset>

      <div id="alumni-id" className="card card--note card--stack">
        <Field as="checkbox" label="I'd like to request an MCU Alumni ID" {...field('requestAlumniId')} />
        <small className="muted">Our team will contact you about the requirements and release of your Alumni ID.</small>
      </div>

      <Field
        as="checkbox"
        label="I agree to let Manila Central University collect and process my personal data for alumni relations purposes, in accordance with the Data Privacy Act of 2012."
        required
        {...field('consent')}
      />

      <FormStatus status={status} />
      <SubmitButton status={status} className="btn-lg btn-block">Update my information</SubmitButton>
    </form>
  );
}

export default function ContactUpdate() {
  const courses = useContent('courses');

  return (
    <>
      <PageHero
        eyebrow="Update Your Info Now"
        title="Alumni Contact Update"
        subtitle="Keep your details up to date so you never miss a reunion, event, or alumni benefit."
      />
      <section className="section section--tinted">
        <div className="container form-layout">
          <aside className="form-aside">
            <h2 className="h3">Why update?</h2>
            <ul className="checklist">
              <li><Icon name="check" size={18} /> Receive invitations to reunions and homecomings</li>
              <li><Icon name="check" size={18} /> Get the alumni e-newsletter</li>
              <li><Icon name="check" size={18} /> Claim your Alumni ID for partner discounts</li>
              <li><Icon name="check" size={18} /> Hear about career and volunteer opportunities</li>
            </ul>
          </aside>
          <div className="card card--padded">
            <AsyncContent state={courses} skeleton={1}>
              {(data) => <UpdateForm courses={data} />}
            </AsyncContent>
          </div>
        </div>
      </section>
    </>
  );
}
