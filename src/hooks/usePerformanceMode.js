import { useEffect, useMemo, useState } from 'react';
import usePersistedState from './usePersistedState';
import {
  PERF_STORAGE_KEY,
  getPerformanceFlags,
  parsePerformanceMode,
  resolveEffectiveMode,
} from '../lib/performanceMode';

export default function usePerformanceMode() {
  const [performanceMode, setPerformanceMode] = usePersistedState(
    PERF_STORAGE_KEY,
    'auto',
    {
      fromStorage: parsePerformanceMode,
      toStorage: (value) => value,
    }
  );

  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setPrefersReducedMotion(motionQuery.matches);
    update();
    motionQuery.addEventListener('change', update);
    return () => motionQuery.removeEventListener('change', update);
  }, []);

  const effectiveMode = useMemo(
    () => resolveEffectiveMode(performanceMode, prefersReducedMotion),
    [performanceMode, prefersReducedMotion]
  );

  const flags = useMemo(() => getPerformanceFlags(effectiveMode), [effectiveMode]);

  useEffect(() => {
    document.documentElement.dataset.perf = effectiveMode;
    if (performanceMode === 'auto') {
      document.documentElement.dataset.perfPref = 'auto';
    } else {
      document.documentElement.dataset.perfPref = performanceMode;
    }
  }, [effectiveMode, performanceMode]);

  return {
    performanceMode,
    setPerformanceMode,
    effectiveMode,
    flags,
    prefersReducedMotion,
  };
}
