import { useState } from 'react';
import { submitForm } from '../api/client.js';

// Manages values, field errors, and submission state for a backend form type.
// `submit` replaces the default public endpoint (e.g. an Alumni Portal request that sends the alumni token).
// `captcha` (from useCaptcha): adds the security-check token to the request and resets the check afterwards.
export function useForm(type, initialValues, { submit, captcha } = {}) {
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
    let extra = {};
    try {
      extra = captcha ? await captcha.payload() : {};
    } catch {
      setStatus({ state: 'idle', message: '' }); // the security check shows what's missing
      return;
    }
    try {
      const data = { ...values, ...extra };
      const res = await (submit ? submit(data) : submitForm(type, data));
      setValues(initialValues);
      setErrors({});
      setStatus({ state: 'success', message: res.message });
      captcha?.reset();
    } catch (err) {
      setErrors(err.fields || {});
      // A wrong security code is shown under the code itself, not as a second message.
      setStatus(err.fields?.reason === 'captcha' ? { state: 'idle', message: '' } : { state: 'error', message: err.message });
      captcha?.fail(err);
    }
  };

  // Spread onto a <Field> to wire up value, change handler and error.
  const field = (name) => ({ name, value: values[name], onChange, error: errors[name] });

  return { values, errors, status, field, setValue, onSubmit };
}
