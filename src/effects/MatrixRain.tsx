import { useRef } from 'react';
import useVisualLayer from '../hooks/useVisualLayer';
import type { ThemeId } from '../types';

interface MatrixRainProps {
  theme: ThemeId;
}

const MatrixRain = ({ theme }: MatrixRainProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useVisualLayer('matrixRain', canvasRef, { enabled: true, theme });

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
