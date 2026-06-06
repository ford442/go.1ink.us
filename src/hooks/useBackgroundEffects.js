import { useEffect, useRef } from 'react';

export default function useBackgroundEffects() {
  // Ref for the spotlight grid
  const gridSpotlightRef = useRef(null);
  const starfieldRef = useRef(null);
  const canvasRef = useRef(null); // Canvas for cursor trail effect
  const deepGridRef = useRef(null);
  const baseGridRef = useRef(null);


  // Dynamic Background: Parallax (Scroll) + Interactive (Mouse)
  useEffect(() => {
    let scrollY = window.scrollY;

    // Target mouse position (where the cursor actually is)
    let targetMouseX = 0;
    let targetMouseY = 0;

    // Current interpolated mouse position (for smooth animation)
    let currentMouseX = 0;
    let currentMouseY = 0;

    let pageMouseX = 0;
    let pageMouseY = 0;
    let animationFrameId;

    // Trail particles state
    const trailParticles = [];

    const updateTransforms = () => {
      // Lerp current towards target (0.03 factor for smoother inertia and weighty drift)
      currentMouseX += (targetMouseX - currentMouseX) * 0.03;
      currentMouseY += (targetMouseY - currentMouseY) * 0.03;

      // Starfield: Subtle parallax (very far away)
      if (starfieldRef.current) {
        starfieldRef.current.style.transform = `translate3d(${currentMouseX * -0.01}px, ${scrollY * 0.04 + currentMouseY * -0.01}px, 0)`;
      }

      // Update the Grid Spotlight
      if (gridSpotlightRef.current) {
        // Use a radial gradient mask to reveal the cyan grid at the mouse position
        // We use pageX/Y because the grid covers the whole document
        const mask = `radial-gradient(300px circle at ${pageMouseX}px ${pageMouseY}px, black, transparent)`;
        gridSpotlightRef.current.style.maskImage = mask;
        gridSpotlightRef.current.style.webkitMaskImage = mask;
      }

      // Update the Deep Grid and Base Grid Masks
      const deepMask = `radial-gradient(800px circle at ${pageMouseX}px ${pageMouseY}px, black 10%, transparent 80%)`;
      if (deepGridRef.current) {
        deepGridRef.current.style.maskImage = deepMask;
        deepGridRef.current.style.webkitMaskImage = deepMask;
      }
      if (baseGridRef.current) {
        baseGridRef.current.style.maskImage = deepMask;
        baseGridRef.current.style.webkitMaskImage = deepMask;
      }

      // Update and Draw Canvas Cursor Trail
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        // Ensure canvas matches window size
        if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
          canvas.width = window.innerWidth;
          canvas.height = window.innerHeight;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Add new particle at current mouse position
        trailParticles.push({
          x: pageMouseX,
          y: pageMouseY,
          life: 1.0, // 1.0 down to 0
          size: Math.random() * 4 + 2,
        });

        // Update and draw all particles
        for (let i = trailParticles.length - 1; i >= 0; i--) {
          const p = trailParticles[i];
          p.life -= 0.02; // Fade out speed
          p.y -= 0.5; // Drift upwards slightly

          if (p.life <= 0) {
            trailParticles.splice(i, 1);
            continue;
          }

          ctx.beginPath();
          // Theme-reactive trail color (pulls current accent)
          const trailRgb = getComputedStyle(document.documentElement).getPropertyValue('--rgb-accent-400').trim() || '34, 211, 238';
          ctx.fillStyle = `rgba(${trailRgb}, ${p.life * 0.5})`;
          ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      animationFrameId = requestAnimationFrame(updateTransforms);
    };

    const handleScroll = () => {
      scrollY = window.scrollY;
    };

    const handleMouseMove = (e) => {
      // Center the coordinate system for mouse (for parallax)
      targetMouseX = e.clientX - window.innerWidth / 2;
      targetMouseY = e.clientY - window.innerHeight / 2;
      // Viewport coordinates (for spotlight fixed background)
      pageMouseX = e.clientX;
      pageMouseY = e.clientY;

      const px = targetMouseX / (window.innerWidth / 2);
      const py = targetMouseY / (window.innerHeight / 2);
      document.documentElement.style.setProperty('--parallax-x', px);
      document.documentElement.style.setProperty('--parallax-y', py);
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('mousemove', handleMouseMove);

    // Start animation loop
    updateTransforms();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);



  return {
    baseGridRef,
    canvasRef,
    deepGridRef,
    gridSpotlightRef,
    starfieldRef
  };
}
