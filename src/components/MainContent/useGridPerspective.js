import { useEffect, useRef, useState } from 'react';

/**
 * Holographic command-table tilt: rotates #project-grid a few degrees toward
 * the pointer on devices that support hover and don't prefer reduced motion.
 */
export default function useGridPerspective(card3dEnabled) {
  const gridRef = useRef(null);
  const [isInteractive, setIsInteractive] = useState(false);

  useEffect(() => {
    const hoverQuery = window.matchMedia('(hover: hover)');
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const updateInteractive = () => {
      setIsInteractive(hoverQuery.matches && !motionQuery.matches && card3dEnabled);
    };

    updateInteractive();
    hoverQuery.addEventListener('change', updateInteractive);
    motionQuery.addEventListener('change', updateInteractive);

    return () => {
      hoverQuery.removeEventListener('change', updateInteractive);
      motionQuery.removeEventListener('change', updateInteractive);
    };
  }, [card3dEnabled]);

  useEffect(() => {
    let rafId = null;

    if (!isInteractive) {
      if (gridRef.current) {
        gridRef.current.style.transform = 'perspective(2000px) rotateX(0deg) rotateY(0deg)';
      }
      return;
    }

    const handleMouseMove = (e) => {
      if (rafId) return;

      rafId = requestAnimationFrame(() => {
        const { innerWidth, innerHeight } = window;
        const x = e.clientX;
        const y = e.clientY;

        // Calculate distance from center (-0.5 to 0.5)
        const xPos = (x / innerWidth) - 0.5;
        const yPos = (y / innerHeight) - 0.5;

        // Max tilt of 3 degrees
        const maxTilt = 3;

        // When mouse is right, rotateY should be positive to look left
        const rotateY = xPos * maxTilt * 2;
        // When mouse is down, rotateX should be negative to look up
        const rotateX = -(yPos * maxTilt * 2);

        if (gridRef.current) {
          gridRef.current.style.transform = `perspective(2000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        }
        rafId = null;
      });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [isInteractive]);

  return gridRef;
}
