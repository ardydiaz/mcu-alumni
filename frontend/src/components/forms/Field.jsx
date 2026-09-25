import { useId } from 'react';

// One labelled form control. `as` is "input" (default), "select", "textarea" or "checkbox".
export default function Field({ label, as = 'input', options = [], error, hint, className = '', required, ...props }) {
  const id = useId();
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  const common = { id, 'aria-invalid': Boolean(error), 'aria-describedby': describedBy, required, ...props };

  if (as === 'checkbox') {
    return (
      <div className={`field field--checkbox ${className}`}>
        <label htmlFor={id}>
          <input type="checkbox" {...common} value={undefined} checked={Boolean(props.value)} />
          <span>{label}</span>
        </label>
        {error && <small id={`${id}-error`} className="field__error">{error}</small>}
      </div>
    );
  }

  let control;
  if (as === 'select') {
    control = (
      <select {...common} value={props.value ?? ''}>
        <option value="" disabled>Select...</option>
        {options.map((o) => {
          const value = typeof o === 'string' ? o : o.value;
          const text = typeof o === 'string' ? o : o.label;
          return <option key={value} value={value}>{text}</option>;
        })}
      </select>
    );
  } else if (as === 'textarea') {
    control = <textarea rows={4} {...common} value={props.value ?? ''} />;
  } else {
    control = <input {...common} value={props.value ?? ''} />;
  }

  return (
    <div className={`field ${error ? 'has-error' : ''} ${className}`}>
      <label htmlFor={id}>
        {label} {required && <span className="req" aria-hidden="true">*</span>}
      </label>
      {control}
      {error ? (
        <small id={`${id}-error`} className="field__error">{error}</small>
      ) : (
        hint && <small id={`${id}-hint`} className="field__hint">{hint}</small>
      )}
    </div>
  );
}
