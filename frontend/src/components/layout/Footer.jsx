import { Link } from 'react-router-dom';
import Icon from '../ui/Icon.jsx';
import ContactForm from '../forms/ContactForm.jsx';
import { useContent } from '../../hooks/useContent.js';
import { navigation, portalFooter } from './navigation.js';

export default function Footer() {
  const { data: site } = useContent('site');
  const links = navigation.flatMap((item) => (item.children ? item.children : [item]));

  return (
    <footer className="site-footer">
      <section className="footer-contact">
        <div className="container footer-contact__inner">
          <div>
            <span className="eyebrow eyebrow--light">Connect with us!</span>
            <h2>Leave us a message</h2>
            <p>
              Questions about alumni services, your Alumni ID, giving, or reunions? The MCU Alumni Relations Office is here
              to help.
            </p>
            <ul className="contact-list">
              <li><Icon name="pin" /> {site?.address || 'Manila Central University, EDSA, Caloocan City 1400'}</li>
              <li><Icon name="phone" /> <a href="tel:+639171046520">{site?.phone || '(+63) 917 104 6520'}</a></li>
              <li><Icon name="mail" /> <a href={`mailto:${site?.email || 'alumni@mcu.edu.ph'}`}>{site?.email || 'alumni@mcu.edu.ph'}</a></li>
            </ul>
          </div>
          <div className="card card--glass">
            <ContactForm />
          </div>
        </div>
      </section>

      <div className="container footer-main">
        <div className="footer-brand">
          <img src={site?.logoWhite || 'https://alumni.mcu.edu.ph/wp-content/uploads/2023/12/mcu-logo-white.png'} alt="Manila Central University" />
          <p>
            MCU is more than just an institution; it's a community that embraces diversity, values tradition, and champions
            progress.
          </p>
          <div className="socials">
            {(site?.socials || []).map((s) => (
              <a key={s.name} href={s.url} target="_blank" rel="noreferrer" aria-label={s.name}>
                <Icon name={s.name} size={18} />
              </a>
            ))}
          </div>
        </div>
        <div>
          <h3>Explore</h3>
          <ul>
            {links.slice(0, 5).map((l) => (
              <li key={l.to}><Link to={l.to}>{l.label}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <h3>Community</h3>
          <ul>
            {links.slice(5).map((l) => (
              <li key={l.to}><Link to={l.to}>{l.label}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <h3>Alumni Portal</h3>
          <ul>
            {portalFooter.map((l) => (
              <li key={l.to}><Link to={l.to}>{l.label}</Link></li>
            ))}
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="container">
          <span>© {new Date().getFullYear()} Manila Central University Alumni Relations. All rights reserved.</span>
          <span className="footer-bottom__links">
            <a href="https://www.mcu.edu.ph" target="_blank" rel="noreferrer">mcu.edu.ph</a>
            <Link to="/admin/login">Staff login</Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
