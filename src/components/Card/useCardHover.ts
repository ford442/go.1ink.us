import { useRef, useState } from 'react';
import soundSystem from '../../lib/SoundSystem';
import type { ConnectivityHealth } from '../../types';

interface UseCardHoverOptions {
  baselineLatencyMs?: number | null;
  connectivityHealth?: ConnectivityHealth;
}

// Hover-delay micro-interactions: immediate hover state plus a 700ms-delayed
// "deep focus" state (used for the image zoom/lift), and a probe latency
// readout while hovered when build-time health data is available.
export default function useCardHover(onCardHover?: (projectId: number | null) => void, { baselineLatencyMs, connectivityHealth }: UseCardHoverOptions = {}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isHoverDelayed, setIsHoverDelayed] = useState(false);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const ping = !isHovered || connectivityHealth === 'unknown'
    ? 0
    : connectivityHealth === 'degraded'
      ? 999
      : baselineLatencyMs ?? 0;

  const handleHoverEnter = (projectId: number) => {
    setIsHovered(true);
    if (onCardHover) onCardHover(projectId);
    soundSystem.playHover();

    // Start 700ms timer for advanced hover micro-interactions (zoom, lift)
    hoverTimerRef.current = setTimeout(() => {
      setIsHoverDelayed(true);
      soundSystem.playDeepFocus();
    }, 700);
  };

  const handleHoverLeave = () => {
    setIsHovered(false);
    if (onCardHover) onCardHover(null);
    setIsHoverDelayed(false);
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
  };

  return { isHovered, isHoverDelayed, ping, handleHoverEnter, handleHoverLeave };
}
