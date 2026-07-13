import { useEffect, useRef, useState } from 'react';
import soundSystem from '../lib/SoundSystem';

// Tracks user activity (mouse/keyboard/touch/scroll) and flips `isIdle`
// after `timeoutMs` of silence, so long as boot isn't in progress.
export default function useIdleProtocol({ timeoutMs = 60000, isBooting }) {
  const [isIdle, setIsIdle] = useState(false);
  const lastActivityRef = useRef(0);

  useEffect(() => {
    lastActivityRef.current = Date.now();

    const updateActivity = () => {
      lastActivityRef.current = Date.now();
      setIsIdle(prevIdle => {
        if (prevIdle) {
          soundSystem.playTone(600, 'sine', 0.05); // Play a subtle sound when waking up
        }
        return false;
      });
    };

    // Attach to window
    const events = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll'];
    events.forEach(event => window.addEventListener(event, updateActivity, { passive: true }));

    const idleCheckInterval = setInterval(() => {
      const currentTime = Date.now();
      if (currentTime - lastActivityRef.current > timeoutMs && !isBooting) {
        setIsIdle(true);
      }
    }, 1000);

    return () => {
      events.forEach(event => window.removeEventListener(event, updateActivity));
      clearInterval(idleCheckInterval);
    };
  }, [isBooting, timeoutMs]);

  return isIdle;
}
