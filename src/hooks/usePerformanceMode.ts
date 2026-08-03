import { useCallback, useEffect, useMemo, useState } from 'react';
import usePersistedState from './usePersistedState';
import {
  PERF_STORAGE_KEY,
  getPerformanceFlags,
  parsePerformanceMode,
  resolveEffectiveMode,
  rerollRandomFlags,
} from '../lib/performanceMode';
import type { PerformanceMode } from '../types';

export default function usePerformanceMode() {
  const [performanceMode, setPerformanceMode] = usePersistedState(
    PERF_STORAGE_KEY,
    'auto' as PerformanceMode,
    {
      fromStorage: parsePerformanceMode,
      toStorage: (value: PerformanceMode) => value,
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

  // Bumped by rerollPerformance to force a re-read of the (freshly re-rolled)
  // session flags below, since effectiveMode itself doesn't change on reroll.
  const [rerollNonce, setRerollNonce] = useState(0);

  const flags = useMemo(
    () => getPerformanceFlags(effectiveMode),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [effectiveMode, rerollNonce]
  );

  const rerollPerformance = useCallback(() => {
    rerollRandomFlags();
    setRerollNonce((n) => n + 1);
    setPerformanceMode('random');
  }, [setPerformanceMode]);

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
    rerollPerformance,
  };
}
