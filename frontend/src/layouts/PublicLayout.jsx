import { useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../components/layout/Navbar.jsx';
import Footer from '../components/layout/Footer.jsx';

// Every new page starts at the top; with a #hash, it then scrolls to that section once it has rendered
// (targets inside forms appear only after their content loads). A #hash the page doesn't have just stays at
// the top (it used to keep the previous page's scroll position, landing on the footer of short pages).
function useScrollOnNavigate() {
  const { pathname, hash } = useLocation();
  const lastPath = useRef(null);

  useEffect(() => {
    if (lastPath.current !== pathname) window.scrollTo(0, 0); // a new page (not a #link within the same page)
    lastPath.current = pathname;
    if (!hash) return undefined;
    let tries = 0;
    const timer = setInterval(() => {
      const el = document.getElementById(hash.slice(1));
      if (el || ++tries > 20) {
        clearInterval(timer);
        el?.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
    return () => clearInterval(timer);
  }, [pathname, hash]);
}

export default function PublicLayout() {
  useScrollOnNavigate();

  return (
    <>
      <a href="#main" className="skip-link">Skip to content</a>
      <Navbar />
      <main id="main">
        <Outlet />
      </main>
      <Footer />
    </>
  );
}
