import { Link, Outlet } from 'react-router-dom';
import Icon from '../components/ui/Icon.jsx';
import '../styles/admin.css';

const LOGO = 'https://alumni.mcu.edu.ph/wp-content/uploads/2023/11/header-logo.png';
const LOGO_WHITE = 'https://alumni.mcu.edu.ph/wp-content/uploads/2023/12/mcu-logo-white.png';

// What the Alumni Admin Portal is for (left panel).
const FEATURES = [
  { icon: 'id', title: 'Alumni records', text: 'Profiles, Registrar imports and portal verification' },
  { icon: 'rocket', title: 'Graduate tracer', text: 'Employment and tracer study responses' },
  { icon: 'calendar', title: 'Events', text: 'Calendar, registrations and attendance' },
  { icon: 'file', title: 'Reports', text: 'Accreditation and tracer reports in Excel or PDF' },
];

// Staff sign-in (and the Microsoft 365 callback): campus panel + sign-in card.
export default function AuthLayout() {
  return (
    <div className="auth-layout">
      <aside className="auth-layout__brand" style={{ '--auth-photo': 'url("/images/campus-development-banner.webp")' }}>
        <div className="auth-layout__top">
          <img src={LOGO_WHITE} alt="Manila Central University" className="auth-layout__logo" />
          <Link to="/" className="auth-layout__back">
            <Icon name="arrowRight" size={14} className="flip" /> Back to the website
          </Link>
        </div>

        <div className="auth-layout__hero">
          <span className="auth-layout__eyebrow">MCU Alumni Relations Office</span>
          <h1>
            Alumni Admin <em>Portal</em>
          </h1>
          <p>One place to keep 50,000+ Centralino graduates connected: records, tracer study, events and reports.</p>
          <ul className="auth-layout__features">
            {FEATURES.map((f) => (
              <li key={f.title}>
                <span><Icon name={f.icon} size={18} /></span>
                <div>
                  <strong>{f.title}</strong>
                  <small>{f.text}</small>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="auth-layout__foot">© {new Date().getFullYear()} Manila Central University · EDSA, Caloocan City</p>
      </aside>

      <main className="auth-layout__main">
        <div className="auth-card">
          <img src={LOGO} alt="Manila Central University" className="auth-card__logo" />
          <Outlet />
        </div>
        <p className="auth-layout__alumni">
          Are you an MCU graduate? <Link to="/portal/login">Go to the Alumni Portal <Icon name="arrowRight" size={14} /></Link>
        </p>
      </main>
    </div>
  );
}
