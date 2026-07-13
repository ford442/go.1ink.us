import { useEffect, useRef, useState } from 'react';
import soundSystem from '../lib/SoundSystem';

// Brief glitch animation played whenever displayMode changes (grid/list/
// matrix/map), whether triggered by a click or a keyboard shortcut.
export default function useLayoutGlitchTransition(displayMode) {
  const [isGlitching, setIsGlitching] = useState(false);
  const glitchTimeoutRef = useRef(null);
  const prevDisplayModeRef = useRef(displayMode);

  useEffect(() => {
    if (displayMode !== prevDisplayModeRef.current) {
      if (glitchTimeoutRef.current) clearTimeout(glitchTimeoutRef.current);

      setTimeout(() => setIsGlitching(true), 0);
      soundSystem.playSelect();

      glitchTimeoutRef.current = setTimeout(() => {
        setIsGlitching(false);
      }, 400);

      prevDisplayModeRef.current = displayMode;
    }
  }, [displayMode]);

  return isGlitching;
}
