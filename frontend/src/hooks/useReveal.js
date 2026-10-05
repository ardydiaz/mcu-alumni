import { useEffect } from 'react';

// Fades elements marked with [data-reveal] up into view as they scroll in.
// Content is visible by default; the effect only switches on when the browser
// supports IntersectionObserver and the visitor hasn't asked for reduced motion.
export function useReveal(deps = []) {
  useEffect(() => {
    const root = document.documentElement;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !('IntersectionObserver' in window)) return undefined;

    root.classList.add('reveal-on');
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            observer.unobserve(entry.target);
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
    );
    document.querySelectorAll('[data-reveal]:not(.is-revealed)').forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
      root.classList.remove('reveal-on');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
