import React, { useRef, useEffect } from 'react';

const MatrixRain = ({ theme }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;

    // Set canvas dimensions
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // Matrix characters
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()_+{}[]|;:,.<>?/~';
    const charArray = chars.split('');

    const fontSize = 16;
    let columns = canvas.width / fontSize;

    // Array of drops - one per column
    let drops = [];
    for (let x = 0; x < columns; x++) {
      drops[x] = 1;
    }

    // Theme colors mapping
    const getThemeColor = () => {
      switch (theme) {
        case 'purple': return '#d946ef'; // fuchsia-500
        case 'emerald': return '#10b981'; // emerald-500
        case 'gold': return '#fbbf24'; // amber-400
        case 'cyan':
        default: return '#06b6d4'; // cyan-500
      }
    };

    const draw = () => {
      // Re-calculate columns if window resized
      if (Math.floor(canvas.width / fontSize) !== columns) {
        columns = Math.floor(canvas.width / fontSize);
        drops = [];
        for (let x = 0; x < columns; x++) {
          drops[x] = 1;
        }
      }

      // Translucent black background to create fade effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = getThemeColor();
      ctx.font = fontSize + 'px monospace';

      for (let i = 0; i < drops.length; i++) {
        const text = charArray[Math.floor(Math.random() * charArray.length)];

        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }

        drops[i]++;
      }
    };

    let lastTime = 0;
    const fps = 30;
    const interval = 1000 / fps;

    const render = (time) => {
      animationFrameId = requestAnimationFrame(render);
      if (time - lastTime >= interval) {
        lastTime = time;
        draw();
      }
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [theme]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
      style={{ opacity: 0.8 }}
    />
  );
};

export default MatrixRain;
