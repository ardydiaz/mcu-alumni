// "Sign in with Microsoft" button following Microsoft's sign-in branding
// (four-square logo, neutral button, "Sign in with Microsoft" wording).
export function MicrosoftLogo({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 21 21" aria-hidden="true">
      <rect x="1" y="1" width="9" height="9" fill="#f25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
      <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
      <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
    </svg>
  );
}

export default function MicrosoftButton({ href, busy, onClick, children = 'Sign in with Microsoft 365' }) {
  return (
    <a href={href} className={`btn-microsoft ${busy ? 'is-busy' : ''}`} onClick={onClick} aria-busy={busy || undefined}>
      {busy ? <span className="spinner spinner--dark spinner--sm" aria-hidden="true" /> : <MicrosoftLogo />}
      <span>{busy ? 'Redirecting to Microsoft...' : children}</span>
    </a>
  );
}
