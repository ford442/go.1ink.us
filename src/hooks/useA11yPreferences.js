import { useEffect, useState } from 'react';

function readPrefs() {
  if (typeof window === 'undefined') {
    return {
      reducedMotion: false,
      forcedColors: false,
      allowCustomCursor: true,
      allowMotionEffects: true,
    };
  }

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const forcedColors = window.matchMedia('(forced-colors: active)').matches;

  return {
    reducedMotion,
    forcedColors,
    allowCustomCursor: !reducedMotion && !forcedColors,
    allowMotionEffects: !reducedMotion,
  };
}

/** User/OS accessibility preferences that gate decorative UX (cursor, motion). */
export default function useA11yPreferences() {
  const [prefs, setPrefs] = useState(readPrefs);

  useEffect(() => {
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const forcedQuery = window.matchMedia('(forced-colors: active)');
    const update = () => setPrefs(readPrefs());

    motionQuery.addEventListener('change', update);
    forcedQuery.addEventListener('change', update);
    return () => {
      motionQuery.removeEventListener('change', update);
      forcedQuery.removeEventListener('change', update);
    };
  }, []);

  return prefs;
}
