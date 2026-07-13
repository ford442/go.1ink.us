import { useCallback, useEffect, useState } from 'react';
import soundSystem from '../lib/SoundSystem';

const STORAGE_KEY = 'curator_sound';

// Single source of truth for the sound-enabled flag: one state slice,
// one localStorage key, and one place that drives soundSystem side effects.
export default function useAudioSettings() {
  const [isSoundEnabled, setIsSoundEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, isSoundEnabled);
    if (isSoundEnabled) {
      soundSystem.enable();
      soundSystem.startAmbience();
    } else {
      soundSystem.stopAmbience();
      soundSystem.disable();
    }
  }, [isSoundEnabled]);

  // Flips the flag, unlocking/resuming the AudioContext synchronously within
  // the triggering user gesture so the very first sound isn't swallowed by
  // browser autoplay policy while React's effect is still pending.
  const toggleSound = useCallback(() => {
    setIsSoundEnabled(prev => {
      const next = !prev;
      if (next) {
        soundSystem.enable();
      } else {
        soundSystem.disable();
      }
      return next;
    });
  }, []);

  return { isSoundEnabled, setIsSoundEnabled, toggleSound };
}
