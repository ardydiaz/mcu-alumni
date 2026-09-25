import Field from './Field.jsx';
import FormStatus from './FormStatus.jsx';
import SubmitButton from './SubmitButton.jsx';
import { useForm } from '../../hooks/useForm.js';

export default function ContactForm() {
  const { field, status, onSubmit } = useForm('contact', { name: '', email: '', subject: '', message: '' });

  return (
    <form onSubmit={onSubmit} className="form" noValidate>
      <div className="form-grid">
        <Field label="Full name" autoComplete="name" required {...field('name')} />
        <Field label="Email" type="email" autoComplete="email" required {...field('email')} />
      </div>
      <Field label="Subject" {...field('subject')} />
      <Field label="Message" as="textarea" required {...field('message')} />
      <FormStatus status={status} />
      <SubmitButton status={status} className="btn-block">Send message</SubmitButton>
    </form>
  );
}
