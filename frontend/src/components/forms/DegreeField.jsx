import { useId, useState } from 'react';

const OTHER = 'Other';

// Degree dropdown grouped by college (form-options.degreeGroups), with "Other" for degrees
// not on the list. `value` is the answer that gets submitted; picking "Other" shows a text box.
// Used by the Graduate Tracer and the Alumni Portal registration.
export default function DegreeField({ groups, value, error, onChange, label = 'Recent Course / Degree Completed' }) {
  const id = useId();
  // Start in "Other" mode when a pre-filled degree is not on the list.
  const [other, setOther] = useState(() => Boolean(value) && !groups.some((g) => g.degrees.includes(value)));

  const onSelect = (e) => {
    const picked = e.target.value;
    setOther(picked === OTHER);
    onChange(picked === OTHER ? '' : picked);
  };

  return (
    <div className={`field ${error ? 'has-error' : ''}`}>
      <label htmlFor={id}>{label} <span className="req" aria-hidden="true">*</span></label>
      <select id={id} required aria-invalid={Boolean(error)} value={other ? OTHER : value} onChange={onSelect}>
        <option value="" disabled>Select your degree...</option>
        {groups.map((g) => (
          <optgroup key={g.college} label={g.college}>
            {g.degrees.map((d) => <option key={d} value={d}>{d}</option>)}
          </optgroup>
        ))}
        <option value={OTHER}>Other (not listed)</option>
      </select>
      {other && (
        <input
          className="degree-other"
          placeholder="Please type your degree, e.g. BS Nursing"
          aria-label="Your degree"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoFocus
        />
      )}
      {error && <small className="field__error">{error}</small>}
    </div>
  );
}
