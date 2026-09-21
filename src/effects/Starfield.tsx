import { forwardRef, memo, useContext, useRef } from 'react';
import { OverlayChromeContext } from '../app/context/OverlayChromeContext';
import useVisualLayer from '../hooks/useVisualLayer';

const Starfield = memo(forwardRef<HTMLCanvasElement>((_props, forwardedRef) => {
  const context = useContext(OverlayChromeContext);
  const isWarping = context?.isWarping || false;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useVisualLayer('starfield', canvasRef, { enabled: true });

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
