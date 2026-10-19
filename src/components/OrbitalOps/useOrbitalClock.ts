import { useEffect, useState } from 'react';

/**
 * Wall-clock `now` (ms) that re-renders every `intervalMs`. Local to the
 * Orbital Ops components so the per-second look-angle tick never touches
 * GroundStationContext or anything above it. Pauses while the tab is hidden.
 */
export default function useOrbitalClock(intervalMs: number): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    const start = () => {
      if (timer !== null) return;
      setNow(Date.now());
      timer = setInterval(() => setNow(Date.now()), intervalMs);
    };
    const stop = () => {
      if (timer === null) return;
      clearInterval(timer);
      timer = null;
    };
    const handleVisibility = () => (document.hidden ? stop() : start());

    if (!document.hidden) start();
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      stop();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [intervalMs]);

  return now;
}
