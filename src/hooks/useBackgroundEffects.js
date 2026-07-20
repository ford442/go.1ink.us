import { useEffect, useRef } from 'react';

const DEFAULT_FLAGS = {
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
};

export default function useBackgroundEffects(flags = DEFAULT_FLAGS) {
  const gridSpotlightRef = useRef(null);
  const starfieldRef = useRef(null);
  const canvasRef = useRef(null);
  const deepGridRef = useRef(null);
  const baseGridRef = useRef(null);

  const needsLoop = flags.starfield || flags.parallaxGrids || flags.cursorTrail;

  useEffect(() => {
    if (!needsLoop) return;

    let scrollY = window.scrollY;
    let targetMouseX = 0;
    let targetMouseY = 0;
    let currentMouseX = 0;
    let currentMouseY = 0;
    let pageMouseX = 0;
    let pageMouseY = 0;
    let animationFrameId;
    const trailParticles = [];

    // Cache the accent color instead of calling the (layout-forcing)
    // getComputedStyle() once per trail particle per frame. Refresh it only
    // when the active theme changes, mirroring effects/ParticleNetwork.
    let trailRgb = '34, 211, 238';
    let themeObserver = null;
    if (flags.cursorTrail) {
      const readAccent = () => {
        const rgb = getComputedStyle(document.documentElement)
          .getPropertyValue('--rgb-accent-400')
          .trim();
        trailRgb = rgb || '34, 211, 238';
      };
      readAccent();
      themeObserver = new MutationObserver(readAccent);
      themeObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-theme'],
      });
    }

    // Track what was last committed to the DOM so idle frames (no pointer
    // movement, parallax settled) don't repaint full-viewport mask layers or
    // clear/redraw the trail canvas for no reason.
    let lastStarfieldTransform = '';
    let lastMaskX = NaN;
    let lastMaskY = NaN;
    let lastSpawnX = NaN;
    let lastSpawnY = NaN;

    const updateTransforms = () => {
      currentMouseX += (targetMouseX - currentMouseX) * 0.03;
      currentMouseY += (targetMouseY - currentMouseY) * 0.03;

      if (flags.starfield && starfieldRef.current) {
        const transform = `translate3d(${currentMouseX * -0.01}px, ${scrollY * 0.04 + currentMouseY * -0.01}px, 0)`;
        if (transform !== lastStarfieldTransform) {
          starfieldRef.current.style.transform = transform;
          lastStarfieldTransform = transform;
        }
      }

      if (flags.parallaxGrids && (pageMouseX !== lastMaskX || pageMouseY !== lastMaskY)) {
        lastMaskX = pageMouseX;
        lastMaskY = pageMouseY;

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

      if (flags.cursorTrail) {
        const canvas = canvasRef.current;
        if (canvas) {
          // Only spawn a new particle when the pointer actually moved, so an
          // idle cursor lets the trail fade out and stop instead of endlessly
          // stamping particles at the last position.
          if (pageMouseX !== lastSpawnX || pageMouseY !== lastSpawnY) {
            lastSpawnX = pageMouseX;
            lastSpawnY = pageMouseY;
            trailParticles.push({
              x: pageMouseX,
              y: pageMouseY,
              life: 1.0,
              size: Math.random() * 4 + 2,
            });
          }

          if (trailParticles.length > 0) {
            const ctx = canvas.getContext('2d');
            if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
              canvas.width = window.innerWidth;
              canvas.height = window.innerHeight;
            }

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            for (let i = trailParticles.length - 1; i >= 0; i--) {
              const p = trailParticles[i];
              p.life -= 0.02;
              p.y -= 0.5;

              if (p.life <= 0) {
                trailParticles.splice(i, 1);
                // Clear once more when the last particle dies so no stale
                // pixels linger on the canvas.
                if (trailParticles.length === 0) {
                  ctx.clearRect(0, 0, canvas.width, canvas.height);
                }
                continue;
              }

              ctx.beginPath();
              ctx.fillStyle = `rgba(${trailRgb}, ${p.life * 0.5})`;
              ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }
      }

      animationFrameId = requestAnimationFrame(updateTransforms);
    };

    const handleScroll = () => {
      scrollY = window.scrollY;
    };

    const handleMouseMove = (e) => {
      targetMouseX = e.clientX - window.innerWidth / 2;
      targetMouseY = e.clientY - window.innerHeight / 2;
      pageMouseX = e.clientX;
      pageMouseY = e.clientY;

      if (flags.parallaxGrids) {
        const px = targetMouseX / (window.innerWidth / 2);
        const py = targetMouseY / (window.innerHeight / 2);
        document.documentElement.style.setProperty('--parallax-x', px);
        document.documentElement.style.setProperty('--parallax-y', py);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    updateTransforms();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
      if (themeObserver) themeObserver.disconnect();
      if (!flags.parallaxGrids) {
        document.documentElement.style.removeProperty('--parallax-x');
        document.documentElement.style.removeProperty('--parallax-y');
      }
    };
  }, [needsLoop, flags.starfield, flags.parallaxGrids, flags.cursorTrail]);

  return {
    baseGridRef,
    canvasRef,
    deepGridRef,
    gridSpotlightRef,
    starfieldRef,
  };
}
