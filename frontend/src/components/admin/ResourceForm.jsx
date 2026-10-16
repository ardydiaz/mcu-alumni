import Field from '../forms/Field.jsx';
import FileField from './FileField.jsx';
import { toManilaInput, fromManilaInput } from '../events/eventUtils.js';

/**
 * Field spec:
 *   { name, label, type: 'text'|'email'|'url'|'number'|'date'|'datetime-local'|'password'|'textarea'|'select'|'checkbox'|'image'|'document',
 *     options, required, requiredOnCreate, hint, span: 2, uploadName, placeholder }
 */
export default function ResourceForm({ fields, values, errors, files, isNew, onChange, onFile }) {
  return (
    <div className="form-grid">
      {fields.map((f) => {
        const error = errors[f.name] || (f.uploadName && errors[f.uploadName]);
        const className = f.span === 2 || f.type === 'textarea' || f.type === 'image' || f.type === 'document' ? 'span-2' : '';
        const required = f.required || (isNew && f.requiredOnCreate);

        if (f.type === 'image' || f.type === 'document') {
          return (
            <FileField
              key={f.name}
              label={f.label}
              kind={f.type}
              value={values[f.name]}
              file={files[f.name]}
              onUrlChange={(v) => onChange(f.name, v)}
              onFile={(file) => onFile(f.name, file)}
              error={error}
              hint={f.hint}
              className={className}
            />
          );
        }

        const common = {
          name: f.name,
          label: f.label,
          error,
          hint: f.hint,
          required,
          placeholder: f.placeholder,
          className,
          onChange: (e) => onChange(f.name, f.type === 'checkbox' ? e.target.checked : e.target.value),
        };

        if (f.type === 'select') return <Field key={f.name} {...common} as="select" options={f.options} value={values[f.name]} />;
        if (f.type === 'textarea') return <Field key={f.name} {...common} as="textarea" value={values[f.name]} />;
        if (f.type === 'checkbox') return <Field key={f.name} {...common} as="checkbox" value={Boolean(values[f.name])} className="span-2" />;
        return <Field key={f.name} {...common} type={f.type || 'text'} value={values[f.name]} autoComplete={f.type === 'password' ? 'new-password' : 'off'} />;
      })}
    </div>
  );
}

// Row -> form values.
export function valuesFromRow(fields, row = {}, defaults = {}) {
  return Object.fromEntries(
    fields.map((f) => {
      let v = row[f.name] ?? defaults[f.name];
      if (f.type === 'checkbox') v = Boolean(v ?? false);
      else if (f.type === 'date' && v) v = String(v).slice(0, 10);
      else if (f.type === 'datetime-local') v = toManilaInput(v);
      else if (f.type === 'password') v = '';
      else v = v ?? '';
      return [f.name, v];
    })
  );
}

// Form values -> API payload. Empty numbers/dates become null; empty passwords are omitted.
export function payloadFromValues(fields, values, files) {
  const data = {};
  for (const f of fields) {
    if (f.readOnly) continue;
    let v = values[f.name];
    if ((f.type === 'image' || f.type === 'document') && files[f.name]) continue; // sent as the uploaded file
    if (f.type === 'password' && !v) continue;
    if ((f.type === 'number' || f.type === 'date') && v === '') v = null;
    if (f.type === 'number' && v !== null) v = Number(v);
    if (f.type === 'datetime-local') v = fromManilaInput(v); // entered in Philippine time
    data[f.name] = v;
  }
  const uploads = Object.fromEntries(
    fields.filter((f) => files[f.name]).map((f) => [f.uploadName || f.name, files[f.name]])
  );
  return { data, uploads };
}
