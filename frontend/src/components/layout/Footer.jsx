import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../ui/Icon.jsx';
import ContactForm from '../forms/ContactForm.jsx';
import { useContent } from '../../hooks/useContent.js';
import { navigation, portalFooter } from './navigation.js';

// navigator.clipboard only works on https/localhost, so fall back to a hidden textarea on plain http.
async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const box = document.createElement('textarea');
    box.value = text;
    box.setAttribute('readonly', '');
    box.style.cssText = 'position:fixed;top:0;left:0;opacity:0;';
    document.body.appendChild(box);
    box.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch { ok = false; }
    box.remove();
    return ok;
  }
}

// One contact card in the "Leave us a message" section, with an optional Copy button.
function ContactItem({ icon, label, value, href, copy }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef();
  useEffect(() => () => clearTimeout(timer.current), []);

  async function onCopy() {
    if (!(await copyText(value))) return;
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 2000);
  }

  return (
    <li className="contact-item">
      <span className="contact-item__icon"><Icon name={icon} size={20} /></span>
      <span className="contact-item__body">
        <small>{label}</small>
        {href ? <a href={href}>{value}</a> : <strong>{value}</strong>}
      </span>
      {copy && (
        <button type="button" className="contact-item__copy" onClick={onCopy} aria-label={`Copy ${label.toLowerCase()}`}>
          <Icon name={copied ? 'check' : 'copy'} size={14} />
          <span aria-live="polite">{copied ? 'Copied' : 'Copy'}</span>
        </button>
      )}
    </li>
  );
}

export default function Footer() {
  const { data: site } = useContent('site');
  const links = navigation.flatMap((item) => (item.children ? item.children : [item]));
  const address = site?.address || 'Manila Central University, EDSA, Caloocan City 1400';
  const phone = site?.phone || '(+63) 917 104 6520';
  const email = site?.email || 'alumni@mcu.edu.ph';

  return (
    <footer className="site-footer">
      <section className="footer-contact">
        <div className="container footer-contact__inner">
          <div>
            <span className="footer-contact__badge">Connect with us!</span>
            <h2>Leave us a message</h2>
            <p>
              Questions about alumni services, your digital Alumni ID, giving campaigns, or batch reunions? The MCU Alumni
              Relations Office is here to help.
            </p>
            <ul className="contact-list">
              <ContactItem icon="pin" label="Campus address" value={address} />
              <ContactItem icon="phone" label="Direct line" value={phone} href={`tel:${phone.replace(/[^\d+]/g, '')}`} copy />
              <ContactItem icon="mail" label="Official email" value={email} href={`mailto:${email}`} copy />
            </ul>
          </div>
          <div className="footer-contact__card">
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
