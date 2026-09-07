import { useEffect, useRef } from 'react';

export interface AnimationLoopHandle {
  /**
   * Restart a loop that put itself to sleep by returning `false`. Safe to call
   * from an event handler on every event — it no-ops while already running.
   */
  wake: () => void;
}

export interface AnimationLoopOptions {
  /**
   * When set, the loop only runs while this element intersects the viewport.
   * Pass a ref to the canvas (or its wrapper) for effects that scroll away.
   */
  target?: React.RefObject<Element | null>;
  /** Set false to keep the loop parked without unmounting the effect. */
  enabled?: boolean;
}

/**
 * A `requestAnimationFrame` loop that stops doing work when nobody can see it.
 *
 * Three gates, all of which must be open for a frame to be scheduled:
 *  - the document is visible (`visibilitychange`),
 *  - the optional `target` element intersects the viewport,
 *  - the callback hasn't asked to sleep.
 *
 * The callback receives the frame timestamp and may return `false` to park the
 * loop once its animation has settled; the `wake()` handle passed as the second
 * argument restarts it from an event handler. Returning nothing (or `true`)
 * keeps it running, so existing loops can adopt this hook unchanged.
 */
export default function useAnimationLoop(
  callback: (time: number, handle: AnimationLoopHandle) => boolean | void,
  options: AnimationLoopOptions = {},
): AnimationLoopHandle {
  const { target, enabled = true } = options;

  // Held in a ref so a re-created callback never restarts the loop.
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  // `wake` is handed to callers (and to the callback) before the effect runs,
  // so it has to be a stable object whose implementation the effect fills in.
  const handleRef = useRef<AnimationLoopHandle>({ wake: () => {} });

  useEffect(() => {
    if (!enabled) return;

    let frameId = 0;
    let running = false;
    let documentVisible = !document.hidden;
    let targetVisible = true;
    // Set when the callback returns false; cleared by wake().
    let asleep = false;

    const tick = (time: number) => {
      frameId = 0;
      const result = callbackRef.current(time, handleRef.current);
      if (result === false) {
        asleep = true;
        running = false;
        return;
      }
      frameId = requestAnimationFrame(tick);
    };

    const start = () => {
      if (running || asleep || !documentVisible || !targetVisible) return;
      running = true;
      frameId = requestAnimationFrame(tick);
    };

    const stop = () => {
      running = false;
      if (frameId) cancelAnimationFrame(frameId);
      frameId = 0;
    };

    handleRef.current.wake = () => {
      asleep = false;
      start();
    };

    const handleVisibility = () => {
      documentVisible = !document.hidden;
      if (documentVisible) start();
      else stop();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    let observer: IntersectionObserver | null = null;
    const element = target?.current;
    if (target) {
      // Until the observer reports, assume hidden so we never paint a frame for
      // an offscreen element; a missing element stays visible (nothing to gate).
      targetVisible = !element;
      if (element) {
        observer = new IntersectionObserver((entries) => {
          targetVisible = entries.some((entry) => entry.isIntersecting);
          if (targetVisible) start();
          else stop();
        });
        observer.observe(element);
      }
    }

    start();

    return () => {
      stop();
      handleRef.current.wake = () => {};
      document.removeEventListener('visibilitychange', handleVisibility);
      observer?.disconnect();
    };
  }, [enabled, target]);

  return handleRef.current;
}
