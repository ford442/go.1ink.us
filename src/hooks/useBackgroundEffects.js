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

    const updateTransforms = () => {
      currentMouseX += (targetMouseX - currentMouseX) * 0.03;
      currentMouseY += (targetMouseY - currentMouseY) * 0.03;

      if (flags.starfield && starfieldRef.current) {
        starfieldRef.current.style.transform = `translate3d(${currentMouseX * -0.01}px, ${scrollY * 0.04 + currentMouseY * -0.01}px, 0)`;
      }

      if (flags.parallaxGrids && gridSpotlightRef.current) {
        const mask = `radial-gradient(300px circle at ${pageMouseX}px ${pageMouseY}px, black, transparent)`;
        gridSpotlightRef.current.style.maskImage = mask;
        gridSpotlightRef.current.style.webkitMaskImage = mask;
      }

      if (flags.parallaxGrids) {
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
          const ctx = canvas.getContext('2d');
          if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
          }

          ctx.clearRect(0, 0, canvas.width, canvas.height);

          trailParticles.push({
            x: pageMouseX,
            y: pageMouseY,
            life: 1.0,
            size: Math.random() * 4 + 2,
          });

          for (let i = trailParticles.length - 1; i >= 0; i--) {
            const p = trailParticles[i];
            p.life -= 0.02;
            p.y -= 0.5;

            if (p.life <= 0) {
              trailParticles.splice(i, 1);
              continue;
            }

            ctx.beginPath();
            const trailRgb = getComputedStyle(document.documentElement).getPropertyValue('--rgb-accent-400').trim() || '34, 211, 238';
            ctx.fillStyle = `rgba(${trailRgb}, ${p.life * 0.5})`;
            ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            ctx.fill();
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
