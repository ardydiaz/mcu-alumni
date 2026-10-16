import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Icon from '../ui/Icon.jsx';

const DURATION = { success: 6000, error: 8000 };

// Shows a form's success or error message as a toast at the top center of the screen.
export default function FormStatus({ status }) {
  const [toast, setToast] = useState(null);

  // Each submit produces a new status object, so the same message can show again.
  useEffect(() => {
    if (status.state !== 'success' && status.state !== 'error') return undefined;
    setToast({ type: status.state, message: status.message });
    const timer = setTimeout(() => setToast(null), DURATION[status.state]);
    return () => clearTimeout(timer);
  }, [status]);

  if (!toast) return null;
  const isError = toast.type === 'error';

  return createPortal(
    <div className="form-toast-wrap">
      <div className={`form-toast form-toast--${toast.type}`} role={isError ? 'alert' : 'status'} aria-live={isError ? 'assertive' : 'polite'}>
        <span className="form-toast__icon" aria-hidden="true"><Icon name={isError ? 'close' : 'check'} size={16} /></span>
        <span className="form-toast__message">{toast.message}</span>
        <button type="button" className="form-toast__close" onClick={() => setToast(null)} aria-label="Dismiss notification">
          <Icon name="close" size={16} />
        </button>
        <span className="form-toast__timer" style={{ animationDuration: `${DURATION[toast.type]}ms` }} aria-hidden="true" />
      </div>
    </div>,
    document.body
  );
}
