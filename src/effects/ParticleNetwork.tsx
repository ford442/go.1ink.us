import { memo, useRef } from 'react';
import useVisualLayer from '../hooks/useVisualLayer';

interface ParticleNetworkProps {
  isGodMode: boolean;
  /** Drive the layer with the WASM visual core (Full mode). */
  preferWasm?: boolean;
}

const ParticleNetwork = memo(({ isGodMode, preferWasm = false }: ParticleNetworkProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useVisualLayer('particleNetwork', canvasRef, { enabled: true, density: isGodMode ? 2 : 1, preferWasm });

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      aria-hidden="true"
    />
  );
});

ParticleNetwork.displayName = 'ParticleNetwork';

export default ParticleNetwork;
