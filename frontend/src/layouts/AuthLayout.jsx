import { Link, Outlet } from 'react-router-dom';
import Icon from '../components/ui/Icon.jsx';
import '../styles/admin.css';

const LOGO = 'https://alumni.mcu.edu.ph/wp-content/uploads/2023/11/header-logo.png';

export default function AuthLayout() {
  return (
    <div className="auth-layout">
      <aside className="auth-layout__brand">
        <div>
          <span className="eyebrow eyebrow--light">MCU Alumni Relations</span>
          <h1>Staff portal</h1>
          <p>Manage campaigns, scholars, partners and alumni submissions for the MCU Alumni website.</p>
        </div>
        <Link to="/" className="auth-layout__back">
          <Icon name="arrowRight" size={16} className="flip" /> Back to the website
        </Link>
      </aside>
      <main className="auth-layout__main">
        <div className="auth-card">
          <img src={LOGO} alt="Manila Central University" className="auth-card__logo" />
          <Outlet />
        </div>
      </main>
    </div>
  );
}
