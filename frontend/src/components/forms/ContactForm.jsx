import Field from './Field.jsx';
import Icon from '../ui/Icon.jsx';
import FormStatus from './FormStatus.jsx';
import SubmitButton from './SubmitButton.jsx';
import { useForm } from '../../hooks/useForm.js';

export default function ContactForm() {
  const { field, status, onSubmit } = useForm('contact', { name: '', email: '', subject: '', message: '' });

  return (
    <form onSubmit={onSubmit} className="form contact-form" noValidate>
      <div className="form-grid">
        <Field label="Full name" autoComplete="name" placeholder="Juan Dela Cruz" required {...field('name')} />
        <Field label="Email" type="email" autoComplete="email" placeholder="juan.delacruz@email.com" required {...field('email')} />
      </div>
      <Field label="Subject" placeholder="Alumni ID Inquiry / Batch Reunion / Giving" {...field('subject')} />
      <Field label="Message" as="textarea" placeholder="Write your message to the MCU Alumni Relations Office..." required {...field('message')} />
      <FormStatus status={status} />
      <SubmitButton status={status} className="btn-block contact-form__submit">
        Send message <Icon name="send" size={17} />
      </SubmitButton>
    </form>
  );
}
