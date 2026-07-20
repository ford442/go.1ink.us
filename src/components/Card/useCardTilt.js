import { useEffect, useRef, useState } from 'react';
import { useEffectsContext } from '../../app/context/EffectsContext';

// Mouse-tilt "magnet" interaction (grid layout) plus the shared
// hover:hover / prefers-reduced-motion / performance-mode gate.
export default function useCardTilt() {
  const { flags } = useEffectsContext();
  const cardRef = useRef(null);
  const rafRef = useRef(null);
  const [isInteractive, setIsInteractive] = useState(false);

  useEffect(() => {
    const hoverQuery = window.matchMedia('(hover: hover)');
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const updateInteractive = () => {
      setIsInteractive(hoverQuery.matches && !motionQuery.matches && flags.card3d);
    };

    updateInteractive();

    hoverQuery.addEventListener('change', updateInteractive);
    motionQuery.addEventListener('change', updateInteractive);

    return () => {
      hoverQuery.removeEventListener('change', updateInteractive);
      motionQuery.removeEventListener('change', updateInteractive);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [flags.card3d]);

  const applyEnterTransition = () => {
    if (!cardRef.current) return;
    // Set fast transition for tilt responsiveness on hover enter
    // This avoids setting style on every mousemove event, improving performance
    cardRef.current.style.transition = 'transform 0.15s cubic-bezier(0.23, 1, 0.32, 1), box-shadow 0.6s cubic-bezier(0.23, 1, 0.32, 1), background 0.3s ease, border-color 0.3s ease';
  };

  const handleMouseMove = (e) => {
    if (!cardRef.current || !isInteractive) return;

    // Use requestAnimationFrame for smoother performance (throttling to ~60fps)
    if (rafRef.current) return;

    rafRef.current = requestAnimationFrame(() => {
      if (!cardRef.current) return;

      const card = cardRef.current;
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      // 🌌 CURATOR FEATURE: Mouse Tilt (Magnet Effect)
      // Calculate rotation based on mouse position to make the card "tilt towards" the mouse cursor.

      // Mouse at Top (y < center) -> Card TILT TOWARDS mouse -> Top comes Forward -> RotateX Negative.
      // (y - centerY) is Negative. Neg * Pos = Neg.
      const rotateX = ((y - centerY) / centerY) * 15;

      // Mouse at Right (x > center) -> Card TILT TOWARDS mouse -> Right comes Forward -> RotateY Negative.
      // (x - centerX) is Positive. Pos * Neg = Neg.
      const rotateY = ((x - centerX) / centerX) * -15;

      // Calculate Parallax for Content (simulating depth)
      // Content moves slightly opposite to the tilt to enhance the "floating" effect
      const parallaxX = ((x - centerX) / centerX) * -5;
      const parallaxY = ((y - centerY) / centerY) * -5;

      // Apply the transform
      // Includes the lift (translateY) and scale that matches the CSS hover state intention
      card.style.transform = `translateY(-10px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;

      // Calculate percentage for glare
      const percentX = (x / rect.width) * 100;
      const percentY = (y / rect.height) * 100;

      // Set CSS variables for the spotlight effect and parallax
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
      card.style.setProperty('--mouse-percent-x', `${percentX}%`);
      card.style.setProperty('--mouse-percent-y', `${percentY}%`);
      card.style.setProperty('--parallax-x', `${parallaxX}px`);
      card.style.setProperty('--parallax-y', `${parallaxY}px`);

      rafRef.current = null;
    });
  };

  const resetTilt = () => {
    if (!cardRef.current) return;

    // Cancel any pending animation frame
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    // Reset to default state (managed by CSS)
    cardRef.current.style.transform = '';
    // Reset transition to allow the smooth CSS return animation
    cardRef.current.style.transition = '';

    // Clear spotlight/parallax variables
    cardRef.current.style.removeProperty('--mouse-x');
    cardRef.current.style.removeProperty('--mouse-y');
    cardRef.current.style.removeProperty('--parallax-x');
    cardRef.current.style.removeProperty('--parallax-y');
  };

  return { cardRef, isInteractive, applyEnterTransition, handleMouseMove, resetTilt };
}
