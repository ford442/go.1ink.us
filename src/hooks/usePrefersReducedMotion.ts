import { useEffect, useState } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

/** Live `prefers-reduced-motion: reduce` state, re-rendering when the OS setting changes. */
export default function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(QUERY).matches;
  });

  useEffect(() => {
    const motionQuery = window.matchMedia(QUERY);
    const update = () => setPrefersReducedMotion(motionQuery.matches);
    update();
    motionQuery.addEventListener('change', update);
    return () => motionQuery.removeEventListener('change', update);
  }, []);

  return prefersReducedMotion;
}
