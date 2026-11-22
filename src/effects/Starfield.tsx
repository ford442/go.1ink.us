import { forwardRef, memo, useContext, useRef } from 'react';
import { OverlayChromeContext } from '../app/context/OverlayChromeContext';
import useVisualLayer from '../hooks/useVisualLayer';

interface StarfieldProps {
  /** Drive the layer with the WASM visual core (Full mode). */
  preferWasm?: boolean;
}

const Starfield = memo(forwardRef<HTMLCanvasElement, StarfieldProps>(({ preferWasm = false }, forwardedRef) => {
  const context = useContext(OverlayChromeContext);
  const isWarping = context?.isWarping || false;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useVisualLayer('starfield', canvasRef, { enabled: true, preferWasm });

  return (
    <canvas
      ref={(node) => {
        canvasRef.current = node;
        if (typeof forwardedRef === 'function') forwardedRef(node);
        else if (forwardedRef) forwardedRef.current = node;
      }}
      aria-hidden="true"
      className={`absolute -top-[10%] -left-[10%] w-[120%] h-[120%] pointer-events-none z-0 ${
        isWarping ? 'animate-warp-speed' : ''
      }`}
    />
  );
}));

Starfield.displayName = 'Starfield';

export default Starfield;
