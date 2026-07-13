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

  // Flips the flag. The effect below handles persistence, AudioContext
  // lifecycle, and ambience; keep the updater focused on state only.
  const toggleSound = useCallback(() => {
    setIsSoundEnabled(prev => !prev);
  }, []);

  return { isSoundEnabled, setIsSoundEnabled, toggleSound };
}
