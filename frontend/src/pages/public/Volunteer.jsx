import PageHero from '../../components/ui/PageHero.jsx';
import AsyncContent from '../../components/ui/AsyncContent.jsx';
import Icon from '../../components/ui/Icon.jsx';
import Field from '../../components/forms/Field.jsx';
import FormStatus from '../../components/forms/FormStatus.jsx';
import SubmitButton from '../../components/forms/SubmitButton.jsx';
import { useContent } from '../../hooks/useContent.js';
import { useForm } from '../../hooks/useForm.js';
import { useReveal } from '../../hooks/useReveal.js';
import '../../styles/volunteer.css';

const roleIcons = { expertise: 'mic', community: 'handshake', mentor: 'compass' };
const roleShort = { expertise: 'Speaker or resource person', community: 'Outreach and service', mentor: 'Guide a student' };
const HIGHLIGHTS = [
  { icon: 'compass', title: 'Pick a role', text: 'Speak, serve or mentor. Choose what fits you.' },
  { icon: 'file', title: 'Sign up in minutes', text: 'Tell us about yourself in one short form.' },
  { icon: 'handshake', title: 'We match you', text: 'Our team reaches out with opportunities.' },
];
const NEXT_STEPS = [
  { title: 'We review your sign-up', text: 'The Alumni Relations Office reads every form.' },
  { title: 'We get in touch', text: 'Expect an email or call about opportunities that match your interests.' },
  { title: 'You make an impact', text: 'Join an event, outreach or mentoring program.' },
];

function StepTitle({ n, children }) {
  return (
    <legend className="vol-step">
      <span className="vol-step__num" aria-hidden="true">{n}</span>
      {children}
    </legend>
  );
}

function VolunteerForm({ roles, courses, form }) {
  const { values, field, status, onSubmit } = form;
  const roleField = field('role');

  return (
    <form onSubmit={onSubmit} className="form vol-form" noValidate>
      <fieldset>
        <StepTitle n={1}>How would you like to help?</StepTitle>
        <div className="vol-roles-pick">
          {roles.map((r) => {
            const selected = values.role === r.key;
            return (
              <label key={r.key} className={`vol-pick ${selected ? 'is-selected' : ''}`}>
                <input type="radio" name="role" value={r.key} checked={selected} onChange={roleField.onChange} />
                <span className="vol-pick__icon" aria-hidden="true"><Icon name={roleIcons[r.key] || 'heart'} size={20} /></span>
                <strong>{r.title}</strong>
                <span>{roleShort[r.key]}</span>
                <span className="vol-pick__check" aria-hidden="true"><Icon name="check" size={14} /></span>
              </label>
            );
          })}
        </div>
        {roleField.error && <small className="field__error">{roleField.error}</small>}
      </fieldset>

      <fieldset>
        <StepTitle n={2}>About you</StepTitle>
        <div className="form-grid">
          <Field label="First name" autoComplete="given-name" required {...field('firstName')} />
          <Field label="Last name" autoComplete="family-name" required {...field('lastName')} />
          <Field label="Email" type="email" autoComplete="email" required {...field('email')} />
          <Field label="Mobile number" type="tel" autoComplete="tel" required {...field('phone')} />
          <Field label="Course / Department" as="select" options={courses} required {...field('course')} />
          <Field label="Year graduated" type="number" inputMode="numeric" {...field('yearGraduated')} />
        </div>
      </fieldset>

      <fieldset>
        <StepTitle n={3}>Your experience</StepTitle>
        <Field label="Area of expertise" hint="e.g. Nursing leadership, Entrepreneurship, Public health" {...field('expertise')} />
        <Field label="Anything else we should know?" as="textarea" {...field('message')} />
      </fieldset>

      <FormStatus status={status} />
      <SubmitButton status={status} className="btn-lg btn-block">
        <Icon name="handshake" size={18} /> Sign me up
      </SubmitButton>
      <p className="vol-form__note">
        <Icon name="shield" size={14} /> We only use your details to contact you about volunteering.
      </p>
    </form>
  );
}

function RoleCard({ role, index, selected, onChoose }) {
  return (
    <article className={`vol-role ${selected ? 'is-selected' : ''}`} data-reveal style={{ '--delay': `${index * 100}ms` }}>
      <div className="vol-role__media">
        <img src={role.image} alt="" loading="lazy" />
        <span className="vol-role__num">{String(index + 1).padStart(2, '0')}</span>
        <span className="vol-role__icon" aria-hidden="true"><Icon name={roleIcons[role.key] || 'heart'} size={22} /></span>
      </div>
      <div className="vol-role__body">
        <h3>{role.title}</h3>
        <p>{role.text}</p>
        <button type="button" className={`btn ${selected ? 'btn-primary' : 'btn-outline'}`} onClick={() => onChoose(role.key)} aria-pressed={selected}>
          {selected ? <><Icon name="check" size={16} /> Selected</> : <>I'm interested <Icon name="arrowRight" size={16} /></>}
        </button>
      </div>
    </article>
  );
}

export default function Volunteer() {
  const volunteer = useContent('volunteer');
  const courses = useContent('courses');
  const form = useForm('volunteer', {
    firstName: '', lastName: '', email: '', phone: '', course: '', yearGraduated: '', role: '', expertise: '', message: '',
  });
  useReveal([volunteer.data, courses.data]);

  // Same path as clicking a role tile, so any "choose a role" error clears too.
  const choose = (key) => {
    form.field('role').onChange({ target: { name: 'role', value: key, type: 'radio' } });
    document.getElementById('volunteer-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="vol">
      <PageHero
        eyebrow="Volunteer"
        title="Give back to the community"
        subtitle="Share your time, talent, and experience with the next generation of Centralinos."
        image="/images/volunteer-banner.webp"
        variant="glass"
        imagePosition="center 40%"
      >
        <a href="#volunteer-form" className="btn btn-gold btn-lg"><Icon name="handshake" size={18} /> Become a volunteer</a>
        <a href="#ways" className="btn btn-outline-light btn-lg">Ways to help</a>
      </PageHero>

      {/* How it works: overlaps the bottom of the banner */}
      <div className="container">
        <ol className="vol-highlights">
          {HIGHLIGHTS.map((h, i) => (
            <li key={h.title}>
              <span className="vol-highlights__icon" aria-hidden="true"><Icon name={h.icon} size={20} /></span>
              <div>
                <small>Step {i + 1}</small>
                <strong>{h.title}</strong>
                <span>{h.text}</span>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <section className="vol-section" id="ways">
        <div className="container">
          <div className="vol-heading" data-reveal>
            <div>
              <span className="vol-eyebrow">Ways to volunteer</span>
              <h2>Find the role that fits you</h2>
            </div>
            <p>Every Centralino has something to give. Choose how you'd like to share your time and talent.</p>
          </div>
          <AsyncContent state={volunteer} skeleton={3}>
            {(data) => (
              <div className="vol-roles">
                {data.roles.map((r, i) => (
                  <RoleCard key={r.key} role={r} index={i} selected={form.values.role === r.key} onChoose={choose} />
                ))}
              </div>
            )}
          </AsyncContent>
        </div>
      </section>

      <section className="vol-section vol-section--tinted" id="volunteer-form">
        <div className="container">
          <div className="vol-layout">
            <aside className="vol-aside" data-reveal>
              <span className="vol-aside__eyebrow">Sign up</span>
              <h2>Volunteer with MCU Alumni</h2>
              <p>Fill out the form and our Alumni Relations team will get in touch with opportunities that match your interests.</p>
              <h3>What happens next</h3>
              <ol className="vol-next">
                {NEXT_STEPS.map((s) => (
                  <li key={s.title}>
                    <strong>{s.title}</strong>
                    <span>{s.text}</span>
                  </li>
                ))}
              </ol>
              <a href="mailto:alumni@mcu.edu.ph" className="vol-aside__contact">
                <span className="vol-aside__contact-icon" aria-hidden="true"><Icon name="mail" size={18} /></span>
                <span>
                  <small>Questions?</small>
                  <strong>alumni@mcu.edu.ph</strong>
                </span>
              </a>
            </aside>
            <div className="vol-card" data-reveal style={{ '--delay': '120ms' }}>
              {volunteer.data && courses.data ? (
                <VolunteerForm roles={volunteer.data.roles} courses={courses.data} form={form} />
              ) : (
                <AsyncContent state={volunteer.error ? volunteer : courses} skeleton={1}>{() => null}</AsyncContent>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
