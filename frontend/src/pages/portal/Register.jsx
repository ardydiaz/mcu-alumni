import { useEffect, useRef, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import AsyncContent from '../../components/ui/AsyncContent.jsx';
import Icon from '../../components/ui/Icon.jsx';
import Field from '../../components/forms/Field.jsx';
import FormStatus from '../../components/forms/FormStatus.jsx';
import SubmitButton from '../../components/forms/SubmitButton.jsx';
import DegreeField from '../../components/forms/DegreeField.jsx';
import { useContent } from '../../hooks/useContent.js';
import { useForm } from '../../hooks/useForm.js';
import { usePortalAuth } from '../../context/PortalAuthContext.jsx';
import { Journey } from './portalShared.jsx';
import CheckEmail from './CheckEmail.jsx';
import '../../styles/portal.css';

const initialValues = {
  fullName: '', studentNumber: '', program: '', yearGraduated: '', email: '', phone: '',
  password: '', confirmPassword: '', consent: false,
};

function RegisterForm({ degreeGroups, onRegistered }) {
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
      <SubmitButton status={status} className="btn-lg btn-block">Create my account</SubmitButton>
      <p className="portal-form__alt">Already registered? <Link to="/portal/login">Log in</Link></p>
    </form>
  );
}

export default function Register() {
  const { status } = usePortalAuth();
  const options = useContent('form-options');
  const [registeredEmail, setRegisteredEmail] = useState(null);

  if (status === 'authenticated') return <Navigate to="/portal/account" replace />;

  return (
    <div className="portal portal-page">
      <div className="container portal-split">
        <aside className="portal-aside">
          <Link to="/portal" className="portal-back"><Icon name="arrowRight" size={14} /> Alumni Portal</Link>
          <h1>Create your Alumni Account</h1>
          <p>Register once to use MCU alumni services online. Your account is activated after we verify your record.</p>
          <Journey current={registeredEmail ? 1 : 0} />
        </aside>
        <div className="portal-card">
          {registeredEmail ? (
            <CheckEmail email={registeredEmail} />
          ) : options.data?.degreeGroups ? (
            <RegisterForm degreeGroups={options.data.degreeGroups} onRegistered={setRegisteredEmail} />
          ) : (
            <AsyncContent state={options} skeleton={1}>{() => null}</AsyncContent>
          )}
        </div>
      </div>
    </div>
  );
}
