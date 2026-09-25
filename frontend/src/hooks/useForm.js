import { useState } from 'react';
import { submitForm } from '../api/client.js';

// Manages values, field errors, and submission state for a backend form type.
export function useForm(type, initialValues) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ state: 'idle', message: '' });

  const onChange = (e) => {
    const { name, type: inputType, value, checked } = e.target;
    setValues((v) => ({ ...v, [name]: inputType === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors(({ [name]: _removed, ...rest }) => rest);
  };

  const setValue = (name, value) => setValues((v) => ({ ...v, [name]: value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setStatus({ state: 'submitting', message: '' });
    try {
      const res = await submitForm(type, values);
      setValues(initialValues);
      setErrors({});
      setStatus({ state: 'success', message: res.message });
    } catch (err) {
      setErrors(err.fields || {});
      setStatus({ state: 'error', message: err.message });
    }
  };

  // Spread onto a <Field> to wire up value, change handler and error.
  const field = (name) => ({ name, value: values[name], onChange, error: errors[name] });

  return { values, errors, status, field, setValue, onSubmit };
}
