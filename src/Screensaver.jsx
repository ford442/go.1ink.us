import React, { useEffect, useRef } from 'react';

const Screensaver = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

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
    let drops = [];
    for (let x = 0; x < columns; x++) {
      drops[x] = 1;
    }

    const draw = () => {
      // Handle resizing that might add columns
      if (Math.floor(width / fontSize) > columns) {
        let newColumns = Math.floor(width / fontSize);
        for(let x = columns; x < newColumns; x++) {
          drops[x] = 1;
        }
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
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] bg-black cursor-none">
      <canvas ref={canvasRef} className="absolute inset-0 block w-full h-full" />

      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10 bg-black/40">
        <h1 className="text-4xl md:text-6xl font-bold text-accent-400 tracking-[0.5em] uppercase glitch-text mb-4" data-text="SYSTEM STANDBY">
          SYSTEM STANDBY
        </h1>
        <div className="text-accent-500/70 font-mono tracking-[0.2em] animate-pulse">
          AWAITING_INPUT_PROTOCOL
        </div>
      </div>

      <div className="scanline opacity-30 pointer-events-none absolute inset-0 z-20"></div>
    </div>
  );
};

export default Screensaver;
