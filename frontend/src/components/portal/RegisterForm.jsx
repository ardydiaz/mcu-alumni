import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Field from '../forms/Field.jsx';
import FormStatus from '../forms/FormStatus.jsx';
import SubmitButton from '../forms/SubmitButton.jsx';
import DegreeField from '../forms/DegreeField.jsx';
import { useForm } from '../../hooks/useForm.js';

const initialValues = {
  fullName: '', studentNumber: '', program: '', yearGraduated: '', email: '', phone: '',
  password: '', confirmPassword: '', consent: false,
};

/**
 * Alumni Portal registration form, used on /portal/register and in the header register modal.
 * onRegistered(email): the verification link was sent. onLogin: switch to the login view in the modal (else a link).
 */
export default function RegisterForm({ degreeGroups, onRegistered, onLogin }) {
  const { values, errors, field, status, onSubmit } = useForm('portal-register', initialValues);
  const submittedEmail = useRef('');
  const answer = (name, value) => field(name).onChange({ target: { name, value, type: 'text' } });

  // useForm clears the form on success, so remember which address the link went to.
  const submit = (e) => {
    submittedEmail.current = values.email.trim();
    onSubmit(e);
  };
  useEffect(() => {
    if (status.state === 'success') onRegistered(submittedEmail.current);
  }, [status, onRegistered]);

  return (
    <form onSubmit={submit} className="form portal-form" noValidate>
      <fieldset>
        <legend>About you</legend>
        <Field
          label="Full Name (Last Name, Given Name, M.I.)"
          hint="Please follow the format: Dela Cruz, Juan Carlo, M."
          placeholder="Dela Cruz, Juan Carlo, M."
          autoComplete="name"
          required
          {...field('fullName')}
        />
        <div className="form-grid">
          <Field label="Student ID Number" placeholder="e.g. 2015-00123" required {...field('studentNumber')} />
          <Field label="Year Graduated" type="number" inputMode="numeric" min="1950" max={new Date().getFullYear()} required {...field('yearGraduated')} />
        </div>
        <DegreeField label="Course / Program" groups={degreeGroups} value={values.program} error={errors.program} onChange={(v) => answer('program', v)} />
      </fieldset>

      <fieldset>
        <legend>Contact details</legend>
        <div className="form-grid">
          <Field label="Email Address" type="email" autoComplete="email" hint="We will send a verification link here." required {...field('email')} />
          <Field label="Contact Number" type="tel" autoComplete="tel" placeholder="09XX XXX XXXX" required {...field('phone')} />
        </div>
      </fieldset>

      <fieldset>
        <legend>Password</legend>
        <div className="form-grid">
          <Field label="Password" type="password" autoComplete="new-password" hint="At least 8 characters, with a letter and a number." required {...field('password')} />
          <Field label="Confirm password" type="password" autoComplete="new-password" required {...field('confirmPassword')} />
        </div>
      </fieldset>

      <Field
        as="checkbox"
        label="I agree to let Manila Central University collect and process my personal data to create and verify my Alumni Portal account, in accordance with the Data Privacy Act of 2012."
        required
        {...field('consent')}
      />

      <FormStatus status={status} />
      <SubmitButton status={status} className="btn-lg btn-block portal-form__submit">Create my account</SubmitButton>
      <p className="portal-form__alt">
        Already registered?{' '}
        {onLogin ? <button type="button" className="link-btn" onClick={onLogin}>Log in</button> : <Link to="/portal/login">Log in</Link>}
      </p>
    </form>
  );
}
