import { useRef, useEffect, useCallback } from 'react';
import useAnimationLoop from '../hooks/useAnimationLoop';
import usePrefersReducedMotion from '../hooks/usePrefersReducedMotion';
import type { ThemeId } from '../types';

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()_+{}[]|;:,.<>?/~'.split('');
const FONT_SIZE = 16;
const FPS = 30;
const FRAME_INTERVAL = 1000 / FPS;

function themeColor(theme: ThemeId) {
  switch (theme) {
    case 'purple': return '#d946ef'; // fuchsia-500
    case 'emerald': return '#10b981'; // emerald-500
    case 'gold': return '#fbbf24'; // amber-400
    case 'cyan':
    default: return '#06b6d4'; // cyan-500
  }
}

interface MatrixRainProps {
  theme: ThemeId;
}

const MatrixRain = ({ theme }: MatrixRainProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dropsRef = useRef<number[]>([]);
  const columnsRef = useRef(0);
  const lastTimeRef = useRef(0);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  const draw = useCallback((time: number) => {
    if (time - lastTimeRef.current < FRAME_INTERVAL) return;
    lastTimeRef.current = time;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Re-seed the drop columns whenever the window width changed under us.
    const columns = Math.floor(canvas.width / FONT_SIZE);
    if (columns !== columnsRef.current) {
      columnsRef.current = columns;
      dropsRef.current = new Array(Math.max(columns, 0)).fill(1);
    }
    const drops = dropsRef.current;

    // Translucent black background to create fade effect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = themeColor(theme);
    ctx.font = `${FONT_SIZE}px monospace`;

    for (let i = 0; i < drops.length; i++) {
      const text = CHARS[Math.floor(Math.random() * CHARS.length)];
      ctx.fillText(text, i * FONT_SIZE, drops[i] * FONT_SIZE);

      if (drops[i] * FONT_SIZE > canvas.height && Math.random() > 0.975) {
        drops[i] = 0;
      }
      drops[i]++;
    }
  }, [theme]);

  useAnimationLoop(draw, { enabled: !prefersReducedMotion });

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
      style={{ opacity: 0.8 }}
      aria-hidden="true"
    />
  );
};

export default MatrixRain;
