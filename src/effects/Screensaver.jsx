import React, { useEffect, useRef } from 'react';
import useA11yPreferences from '../hooks/useA11yPreferences';

const Screensaver = () => {
  const canvasRef = useRef(null);
  const { allowMotionEffects } = useA11yPreferences();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !allowMotionEffects) return;

    const ctx = canvas.getContext('2d');

    // Set canvas dimensions
    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    // Handle resize
    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    window.addEventListener('resize', handleResize);

    // Matrix characters
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()_+{}|:<>?~アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
    const charArray = chars.split('');

    const fontSize = 16;
    let columns = Math.floor(width / fontSize);
    let drops = new Array(columns).fill(1);

    const draw = () => {
      // Handle resizing that might add columns
      if (Math.floor(width / fontSize) > columns) {
        let newColumns = Math.floor(width / fontSize);
        drops.length = newColumns;
        drops.fill(1, columns);
        columns = newColumns;
      }

      // Semi-transparent black to create trailing effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, width, height);

      // Get theme accent color from CSS variables
      const computedStyle = getComputedStyle(document.documentElement);
      const rgbAccent = computedStyle.getPropertyValue('--rgb-accent-400').trim() || '34, 211, 238';

      ctx.fillStyle = `rgb(${rgbAccent})`;
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text = charArray[Math.floor(Math.random() * charArray.length)];

        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        if (drops[i] * fontSize > height && Math.random() > 0.975) {
          drops[i] = 0;
        }

        drops[i]++;
      }
    };

    const intervalId = setInterval(draw, 33);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('resize', handleResize);
    };
  }, [allowMotionEffects]);

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black"
      role="status"
      aria-live="polite"
      aria-label="Idle screensaver. Move the mouse or press a key to resume."
    >
      <canvas ref={canvasRef} className="absolute inset-0 block w-full h-full" aria-hidden="true" />

      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10 bg-black/40">
        <h1 className="text-4xl md:text-6xl font-bold text-accent-400 tracking-[0.5em] uppercase glitch-text mb-4" data-text="SYSTEM STANDBY">
          SYSTEM STANDBY
        </h1>
        <div className="text-accent-300/90 font-mono tracking-[0.2em] animate-pulse">
          AWAITING_INPUT_PROTOCOL
        </div>
        <p className="sr-only">Screensaver active due to inactivity. Interact with the page to dismiss.</p>
      </div>

      <div className="scanline opacity-30 pointer-events-none absolute inset-0 z-20" aria-hidden="true" />
    </div>
  );
};

export default Screensaver;
