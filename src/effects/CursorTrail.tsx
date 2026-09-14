import { useRef } from 'react';
import useVisualLayer from '../hooks/useVisualLayer';

/** Fading particle trail that follows the pointer, layered above the parallax grids in BackgroundElements. */
export default function CursorTrail() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useVisualLayer('cursorTrail', canvasRef, { enabled: true });

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden="true"
      style={{ mixBlendMode: 'screen', zIndex: 1 }}
    />
  );
}
