import { useLocation } from 'react-router-dom';
import PortalGate from '../../components/portal/PortalGate.jsx';

// /alumni-contact-update: alumni update their information in the Alumni Portal (My profile), one verified record
// per graduate. The old URL stays for existing links; /alumni-contact-update#alumni-id goes to the Alumni ID page.
export default function ContactUpdate() {
  const { hash } = useLocation();
  const alumniId = hash === '#alumni-id';
  return (
    <PortalGate
      to={alumniId ? '/portal/alumni-id' : '/portal/profile'}
      eyebrow="Update Your Info Now"
      title={alumniId ? 'Request your Alumni ID' : 'Alumni Contact Update'}
      subtitle="Keep your details up to date so you never miss a reunion, event, or alumni benefit."
      heading={alumniId ? 'Log in to request your Alumni ID' : 'Update your information in the Alumni Portal'}
      text={
        alumniId
          ? 'Your Alumni ID request uses the details in your alumni profile, so there is nothing to fill in again. Log in, or create your free account with your student number.'
          : 'Your details are kept in your own alumni profile: log in to review and update them anytime. New here? Create your free account with your student number.'
      }
      benefits={[
        'Only you can change your details: no one can update them in your name',
        'One record per graduate, with no duplicate forms to consolidate',
        'Your information is already filled in; update only what changed',
        'Track your Alumni ID, event registrations and Graduate Tracer in one place',
      ]}
    />
  );
}
