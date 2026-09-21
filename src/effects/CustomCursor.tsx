import { useEffect, useRef, useState } from 'react';
import { useEffectsContext } from '../app/context/EffectsContext';
import useA11yPreferences from '../hooks/useA11yPreferences';
import useVisualLayer from '../hooks/useVisualLayer';

/**
 * Full-viewport canvas cursor (dot + lerped ring + hover crosshair/brackets +
 * X/Y telemetry), driven by `lib/visuals/engines/cursorEngine.ts` through the
 * same `VisualBackend` protocol as the starfield/particle/matrix/trail
 * layers — including running off the main thread via `OffscreenWorkerBackend`
 * when the browser supports `OffscreenCanvas`. Pointer position comes for
 * free from the shared `ambientSignals` listener `useVisualLayer` already
 * subscribes to; only the hover-target detection below (which needs to read
 * the DOM under the pointer) stays as a plain event listener.
 */
export default function CustomCursor() {
  const { flags } = useEffectsContext();
  const { allowCustomCursor } = useA11yPreferences();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPointerDevice] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(pointer: fine)').matches;
    }
    return false;
  });

  const enabled = isPointerDevice && flags.customCursor && allowCustomCursor;
  const { setHover } = useVisualLayer('cursor', canvasRef, { enabled });

  useEffect(() => {
    if (!enabled) return;

    const onMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const isClickable = target?.closest('a') ||
                          target?.closest('button') ||
                          target?.closest('.card-link');
      const isInput = target?.closest('input') || target?.closest('textarea');

      if (isClickable && !isInput) setHover(true);
    };

    const onMouseOut = () => setHover(false);

    document.addEventListener('mouseover', onMouseOver);
    document.addEventListener('mouseout', onMouseOut);

    return () => {
      document.removeEventListener('mouseover', onMouseOver);
      document.removeEventListener('mouseout', onMouseOut);
    };
  }, [enabled, setHover]);

  if (!enabled) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 w-full h-full pointer-events-none z-[9999]"
    />
  );
}
