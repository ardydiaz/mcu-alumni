import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../ui/Icon.jsx';

// Pages the header search can jump to. Keywords help people who type what they want to do.
const PAGES = [
  { label: 'Home', to: '/', description: 'MCU Alumni homepage', keywords: 'start main' },
  { label: 'Alumni Portal', to: '/portal', description: 'Your alumni account, events and services', keywords: 'account portal' },
  { label: 'Alumni Login', to: '/portal/login', description: 'Log in to your Alumni Portal account', keywords: 'sign in login' },
  { label: 'Register / Create Account', to: '/portal/register', description: 'Create your Alumni Portal account', keywords: 'sign up register join' },
  { label: 'Alumni Contact Update', to: '/alumni-contact-update', description: 'Update your details and request your Alumni ID', keywords: 'alumni id card update info address' },
  { label: 'Graduate Tracer', to: '/graduate-tracer', description: 'Tell us where your MCU journey has taken you', keywords: 'survey employment job tracer' },
  { label: 'Give', to: '/give', description: 'Pledge a gift and see bank details', keywords: 'donate donation pledge bank money' },
  { label: 'Support-a-Centralino', to: '/support-a-centralino', description: 'Sponsor an MCU scholar', keywords: 'scholar scholarship sponsor' },
  { label: 'Campus Development', to: '/campus-development', description: 'Campus projects your gifts make possible', keywords: 'building projects infrastructure' },
  { label: 'Volunteer', to: '/volunteer', description: 'Speak, serve or mentor', keywords: 'mentor speaker community service' },
  { label: 'Merchant Partners', to: '/merchant-partners', description: 'Alumni discounts and perks', keywords: 'discount perks deals offers' },
  { label: 'Industry Partners', to: '/industry-partners', description: 'Organizations that hire Centralinos', keywords: 'jobs careers employers hospitals' },
  { label: 'Events', to: '/events', description: 'Alumni events and activities calendar', keywords: 'calendar homecoming reunion activities chapter program schedule' },
  { label: 'Networks', to: '/networks', description: 'Alumni associations and chapters', keywords: 'chapter association batch' },
  { label: 'Transparency Reports', to: '/transparency-reports', description: 'Monthly donation reports', keywords: 'reports donations transparency' },
];

const matches = (page, q) => `${page.label} ${page.description} ${page.keywords}`.toLowerCase().includes(q);

// Search button + quick page finder (native <dialog>: Esc closes, focus stays inside).
export default function SiteSearch() {
  const navigate = useNavigate();
  const dialog = useRef(null);
  const input = useRef(null);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? PAGES.filter((p) => matches(p, q)) : PAGES.slice(1, 7);
  }, [query]);

  useEffect(() => setActive(0), [query]);

  const open = () => {
    setQuery('');
    dialog.current.showModal();
    requestAnimationFrame(() => input.current?.focus());
  };
  const close = () => dialog.current.close();
  const go = (page) => {
    if (!page) return;
    close();
    navigate(page.to);
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => Math.min(i + 1, results.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)); }
    if (e.key === 'Enter') { e.preventDefault(); go(results[active]); }
  };

  return (
    <>
      <button type="button" className="navbar__search" onClick={open} aria-label="Search the site">
        <Icon name="search" size={19} />
      </button>
      <dialog ref={dialog} className="site-search" aria-label="Search the site" onClick={(e) => e.target === dialog.current && close()}>
        <div className="site-search__box">
          <label className="site-search__field">
            <Icon name="search" size={20} />
            <input
              ref={input}
              type="search"
              placeholder="Search pages, e.g. Alumni ID, donate, mentor"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
              aria-label="Search"
              aria-controls="site-search-results"
            />
            <kbd>Esc</kbd>
          </label>
          <p className="site-search__label">{query.trim() ? `${results.length} result${results.length === 1 ? '' : 's'}` : 'Popular pages'}</p>
          {results.length ? (
            <ul id="site-search-results" className="site-search__results" role="listbox">
              {results.map((p, i) => (
                <li key={p.to} role="option" aria-selected={i === active}>
                  <button type="button" className={i === active ? 'is-active' : ''} onMouseEnter={() => setActive(i)} onClick={() => go(p)}>
                    <span>
                      <strong>{p.label}</strong>
                      <small>{p.description}</small>
                    </span>
                    <Icon name="arrowRight" size={16} />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="site-search__empty">No pages match "{query}". Try "Alumni ID", "donate" or "volunteer".</p>
          )}
        </div>
      </dialog>
    </>
  );
}
