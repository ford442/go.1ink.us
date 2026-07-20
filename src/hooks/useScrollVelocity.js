import { useEffect } from 'react';

// Lightweight scroll-velocity tracker for CSS `--scroll-velocity` distortion.
export default function useScrollVelocity(enabled = true) {
  useEffect(() => {
    if (!enabled) {
      document.documentElement.style.setProperty('--scroll-velocity', '0');
      return;
    }
    let lastY = window.scrollY;
    let lastTime = performance.now();
    let smoothVelocity = 0;
    let rafId = 0;

    const tick = () => {
      smoothVelocity *= 0.85;
      document.documentElement.style.setProperty('--scroll-velocity', smoothVelocity.toFixed(2));
      if (Math.abs(smoothVelocity) > 0.05) {
        rafId = requestAnimationFrame(tick);
      } else {
        rafId = 0;
        document.documentElement.style.setProperty('--scroll-velocity', '0');
      }
    };

    const onScroll = () => {
      const now = performance.now();
      const dt = Math.max(now - lastTime, 1);
      const currentY = window.scrollY;
      const instant = ((currentY - lastY) / dt) * 1000;
      lastY = currentY;
      lastTime = now;
      smoothVelocity = smoothVelocity * 0.6 + instant * 0.4;
      if (!rafId) {
        rafId = requestAnimationFrame(tick);
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (rafId) cancelAnimationFrame(rafId);
      document.documentElement.style.setProperty('--scroll-velocity', '0');
    };
  }, [enabled]);
}
