import { useCallback, useEffect, useState } from 'react';
import soundSystem from '../lib/SoundSystem';

const STORAGE_KEY = 'curator_sound';

function readSoundEnabled() {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(STORAGE_KEY) === 'true';
}

// Single source of truth for audio UI state (#214).
export default function useAudioSettings() {
  const [isSoundEnabled, setIsSoundEnabled] = useState(readSoundEnabled);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const unlock = () => soundSystem.unlockFromGesture();
    window.addEventListener('pointerdown', unlock, { once: true, passive: true });
    window.addEventListener('keydown', unlock, { once: true });
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, String(isSoundEnabled));
    soundSystem.setEnabled(isSoundEnabled);
  }, [isSoundEnabled]);

  const setIsSoundEnabledWithUnlock = useCallback((value) => {
    soundSystem.unlockFromGesture();
    setIsSoundEnabled(value);
  }, []);

  return { isSoundEnabled, setIsSoundEnabled: setIsSoundEnabledWithUnlock };
}
