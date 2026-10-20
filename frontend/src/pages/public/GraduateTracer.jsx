import Icon from '../../components/ui/Icon.jsx';
import PortalGate from '../../components/portal/PortalGate.jsx';
import '../../styles/tracer.css';

const OTHER = 'Other';

// Job category checkboxes, used by the Graduate Tracer in the Alumni Portal (pages/portal/PortalTracer.jsx).
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

// /graduate-tracer: the Graduate Tracer is answered in the Alumni Portal, pre-filled from the alumnus's profile,
// so every answer belongs to a verified graduate and updates their record. The old URL stays for existing links.
export default function GraduateTracer() {
  return (
    <PortalGate
      to="/portal/graduate-tracer"
      eyebrow="Graduate Tracer Study"
      title="Graduate Tracer"
      subtitle="Tell us where your MCU journey has taken you. Your answers help MCU improve its programs."
      heading="Answer the Graduate Tracer in the Alumni Portal"
      text="Log in and your course, batch and current job are already filled in; you only update what has changed and answer a few new questions. New here? Create your free account with your student number."
      benefits={[
        'Already filled in from your alumni profile: no typing everything again',
        'Your answers update your alumni record automatically',
        'Your previous answers are kept, so next year takes a minute',
        'One response per graduate, so the tracer study results are accurate',
      ]}
    />
  );
}
