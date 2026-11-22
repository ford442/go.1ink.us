import { useRef } from 'react';
import useVisualLayer from '../hooks/useVisualLayer';
import type { ThemeId } from '../types';

interface MatrixRainProps {
  theme: ThemeId;
  /** Drive the layer with the WASM visual core (Full mode). */
  preferWasm?: boolean;
}

const MatrixRain = ({ theme, preferWasm = false }: MatrixRainProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useVisualLayer('matrixRain', canvasRef, { enabled: true, theme, preferWasm });

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
