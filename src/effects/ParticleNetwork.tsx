import { memo, useRef } from 'react';
import useVisualLayer from '../hooks/useVisualLayer';

interface ParticleNetworkProps {
  isGodMode: boolean;
}

const ParticleNetwork = memo(({ isGodMode }: ParticleNetworkProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useVisualLayer('particleNetwork', canvasRef, { enabled: true, density: isGodMode ? 2 : 1 });

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
