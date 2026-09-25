import PageHero from '../../components/ui/PageHero.jsx';
import SectionHeading from '../../components/ui/SectionHeading.jsx';
import AsyncContent from '../../components/ui/AsyncContent.jsx';
import Icon from '../../components/ui/Icon.jsx';
import Field from '../../components/forms/Field.jsx';
import FormStatus from '../../components/forms/FormStatus.jsx';
import SubmitButton from '../../components/forms/SubmitButton.jsx';
import { useContent } from '../../hooks/useContent.js';
import { useForm } from '../../hooks/useForm.js';

const roleIcons = { expertise: 'mic', community: 'handshake', mentor: 'compass' };

function VolunteerForm({ roles, courses, form }) {
  const { field, status, onSubmit } = form;
  return (
    <form onSubmit={onSubmit} className="form" noValidate>
      <div className="form-grid">
        <Field label="First name" autoComplete="given-name" required {...field('firstName')} />
        <Field label="Last name" autoComplete="family-name" required {...field('lastName')} />
        <Field label="Email" type="email" autoComplete="email" required {...field('email')} />
        <Field label="Mobile number" type="tel" autoComplete="tel" required {...field('phone')} />
        <Field label="Course / Department" as="select" options={courses} required {...field('course')} />
        <Field label="Year graduated" type="number" inputMode="numeric" {...field('yearGraduated')} />
        <Field label="How would you like to help?" as="select" options={roles.map((r) => ({ value: r.key, label: r.title }))} required className="span-2" {...field('role')} />
      </div>
      <Field label="Area of expertise" hint="e.g. Nursing leadership, Entrepreneurship, Public health" {...field('expertise')} />
      <Field label="Anything else we should know?" as="textarea" {...field('message')} />
      <FormStatus status={status} />
      <SubmitButton status={status} className="btn-lg btn-block">Sign me up</SubmitButton>
    </form>
  );
}

export default function Volunteer() {
  const volunteer = useContent('volunteer');
  const courses = useContent('courses');
  const form = useForm('volunteer', {
    firstName: '', lastName: '', email: '', phone: '', course: '', yearGraduated: '', role: '', expertise: '', message: '',
  });

  const choose = (key) => {
    form.setValue('role', key);
    document.getElementById('volunteer-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <PageHero
        eyebrow="Volunteer"
        title="Give back to the community"
        subtitle="Share your time, talent, and experience with the next generation of Centralinos."
        image="https://alumni.mcu.edu.ph/wp-content/uploads/2025/06/472918311_122171041760109925_6942605333594892373_n-1024x768.webp"
      />

      <section className="section">
        <div className="container">
          <SectionHeading eyebrow="Ways to volunteer" title="Find the role that fits you" />
          <AsyncContent state={volunteer} skeleton={3}>
            {(data) => (
              <div className="grid grid-3">
                {data.roles.map((r) => (
                  <article key={r.key} className="card media-card">
                    <div className="media-card__img">
                      <img src={r.image} alt="" loading="lazy" />
                      <div className="icon-badge icon-badge--float"><Icon name={roleIcons[r.key]} size={22} /></div>
                    </div>
                    <div className="media-card__body">
                      <h3>{r.title}</h3>
                      <p>{r.text}</p>
                      <button type="button" className="btn btn-outline btn-sm" onClick={() => choose(r.key)}>
                        I'm interested <Icon name="arrowRight" size={16} />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </AsyncContent>
        </div>
      </section>

      <section className="section section--tinted" id="volunteer-form">
        <div className="container narrow">
          <div className="card card--padded">
            <SectionHeading eyebrow="Sign up" title="Volunteer with MCU Alumni" text="Fill out the form and our Alumni Relations team will get in touch with opportunities that match your interests." />
            {volunteer.data && courses.data ? (
              <VolunteerForm roles={volunteer.data.roles} courses={courses.data} form={form} />
            ) : (
              <AsyncContent state={volunteer.error ? volunteer : courses} skeleton={1}>{() => null}</AsyncContent>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
