export default function SubmitButton({ status, children, className = '' }) {
  const busy = status.state === 'submitting';
  return (
    <button type="submit" className={`btn btn-primary ${className}`} disabled={busy}>
      {busy ? <span className="spinner" aria-hidden="true" /> : null}
      {busy ? 'Sending...' : children}
    </button>
  );
}
