import { useEffect, useRef, useState } from 'react';
import soundSystem from '../../lib/SoundSystem';

// Hover-delay micro-interactions: immediate hover state plus a 700ms-delayed
// "deep focus" state (used for the image zoom/lift), and a simulated
// network ping readout while hovered.
export default function useCardHover(onCardHover) {
  const [isHovered, setIsHovered] = useState(false);
  const [isHoverDelayed, setIsHoverDelayed] = useState(false);
  const [ping, setPing] = useState(0);
  const hoverTimerRef = useRef(null);

  useEffect(() => {
    let timeout;
    let interval;
    if (isHovered) {
      timeout = setTimeout(() => {
        setPing(Math.floor(Math.random() * 30) + 5);
      }, 0);
      interval = setInterval(() => {
        setPing(prev => Math.max(2, Math.min(150, prev + (Math.floor(Math.random() * 9) - 4))));
      }, 800);
    }
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [isHovered]);

  const handleHoverEnter = (projectId) => {
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
    setPing(0);
  };

  return { isHovered, isHoverDelayed, ping, handleHoverEnter, handleHoverLeave };
}
