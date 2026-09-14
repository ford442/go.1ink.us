import { useEffect, useRef } from 'react';
import type { PerformanceFlags } from '../types';

const DEFAULT_FLAGS: PerformanceFlags = {
  starfield: true,
  particleNetwork: true,
  matrixRain: true,
  customCursor: true,
  warpTransition: true,
  cursorTrail: true,
  parallaxGrids: true,
  scrollVelocity: true,
  filmGrain: true,
  radarHud: true,
  card3d: true,
  floatingDebris: true,
  ambientOrbs: true,
  constellation3d: true,
};

export default function useBackgroundEffects(flags: PerformanceFlags = DEFAULT_FLAGS) {
  const gridSpotlightRef = useRef<HTMLDivElement | null>(null);
  const starfieldRef = useRef<HTMLCanvasElement | null>(null);
  const deepGridRef = useRef<HTMLDivElement | null>(null);
  const baseGridRef = useRef<HTMLDivElement | null>(null);

  const needsLoop = flags.starfield || flags.parallaxGrids;

  useEffect(() => {
    if (!needsLoop) return;

    let scrollY = window.scrollY;
    let targetMouseX = 0;
    let targetMouseY = 0;
    let currentMouseX = 0;
    let currentMouseY = 0;
    let pageMouseX = 0;
    let pageMouseY = 0;
    let animationFrameId = 0;
    // Frames the loop may run after the last committed change before parking.
    // Enough to let the starfield lerp settle.
    const IDLE_FRAME_BUDGET = 90;
    let idleFrames = 0;

    // Track what was last committed to the DOM so idle frames (no pointer
    // movement, parallax settled) don't repaint full-viewport mask layers for
    // no reason.
    let lastStarfieldTransform = '';
    let lastMaskX = NaN;
    let lastMaskY = NaN;

    const updateTransforms = () => {
      // Set by any branch that writes to the DOM this frame. Frames that
      // commit nothing count toward the idle budget below, so a settled page
      // stops scheduling frames instead of spinning at 60fps forever.
      let didWork = false;

      currentMouseX += (targetMouseX - currentMouseX) * 0.03;
      currentMouseY += (targetMouseY - currentMouseY) * 0.03;

      if (flags.starfield && starfieldRef.current) {
        const transform = `translate3d(${currentMouseX * -0.01}px, ${scrollY * 0.04 + currentMouseY * -0.01}px, 0)`;
        if (transform !== lastStarfieldTransform) {
          starfieldRef.current.style.transform = transform;
          lastStarfieldTransform = transform;
          didWork = true;
        }
      }

      if (flags.parallaxGrids && (pageMouseX !== lastMaskX || pageMouseY !== lastMaskY)) {
        lastMaskX = pageMouseX;
        lastMaskY = pageMouseY;
        didWork = true;

        if (gridSpotlightRef.current) {
          const mask = `radial-gradient(300px circle at ${pageMouseX}px ${pageMouseY}px, black, transparent)`;
          gridSpotlightRef.current.style.maskImage = mask;
          gridSpotlightRef.current.style.webkitMaskImage = mask;
        }

        const deepMask = `radial-gradient(800px circle at ${pageMouseX}px ${pageMouseY}px, black 10%, transparent 80%)`;
        if (deepGridRef.current) {
          deepGridRef.current.style.maskImage = deepMask;
          deepGridRef.current.style.webkitMaskImage = deepMask;
        }
        if (baseGridRef.current) {
          baseGridRef.current.style.maskImage = deepMask;
          baseGridRef.current.style.webkitMaskImage = deepMask;
        }
      }

      if (didWork) idleFrames = 0;
      else idleFrames++;

      if (idleFrames >= IDLE_FRAME_BUDGET) {
        // Nothing has moved for a while — park the loop. Pointer and scroll
        // events call schedule() again, so this is invisible to the user.
        animationFrameId = 0;
        return;
      }
      schedule();
    };

    const schedule = () => {
      if (animationFrameId || document.hidden) return;
      animationFrameId = requestAnimationFrame(updateTransforms);
    };

    const handleVisibility = () => {
      if (document.hidden) {
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        animationFrameId = 0;
      } else {
        idleFrames = 0;
        schedule();
      }
    };

    const handleScroll = () => {
      scrollY = window.scrollY;
      idleFrames = 0;
      schedule();
    };

    const handleMouseMove = (e: MouseEvent) => {
      targetMouseX = e.clientX - window.innerWidth / 2;
      targetMouseY = e.clientY - window.innerHeight / 2;
      pageMouseX = e.clientX;
      pageMouseY = e.clientY;
      idleFrames = 0;
      schedule();

      if (flags.parallaxGrids) {
        const px = targetMouseX / (window.innerWidth / 2);
        const py = targetMouseY / (window.innerHeight / 2);
        document.documentElement.style.setProperty('--parallax-x', String(px));
        document.documentElement.style.setProperty('--parallax-y', String(py));
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('visibilitychange', handleVisibility);
    schedule();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('visibilitychange', handleVisibility);
      cancelAnimationFrame(animationFrameId);
      if (!flags.parallaxGrids) {
        document.documentElement.style.removeProperty('--parallax-x');
        document.documentElement.style.removeProperty('--parallax-y');
      }
    };
  }, [needsLoop, flags.starfield, flags.parallaxGrids]);

  return {
    baseGridRef,
    deepGridRef,
    gridSpotlightRef,
    starfieldRef,
  };
}
