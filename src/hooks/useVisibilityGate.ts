import { useEffect, useRef } from 'react';

/**
 * Reports document-visibility + optional target-intersection as a single
 * `onChange(visible)` callback, instead of a per-frame tick. Used to gate a
 * worker-backed `VisualBackend` layer (via `setRunning`), which already runs
 * its own frame loop off the main thread and only needs a play/pause signal
 * rather than `useAnimationLoop`'s per-frame callback.
 */
export default function useVisibilityGate(
  target: React.RefObject<Element | null> | undefined,
  enabled: boolean,
  onChange: (visible: boolean) => void,
): void {
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });

  useEffect(() => {
    if (!enabled) return;

    let documentVisible = !document.hidden;
    let targetVisible = true;
    let observer: IntersectionObserver | null = null;

    const notify = () => onChangeRef.current(documentVisible && targetVisible);

    const handleVisibility = () => {
      documentVisible = !document.hidden;
      notify();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    const element = target?.current;
    if (target) {
      targetVisible = !element;
      if (element) {
        observer = new IntersectionObserver((entries) => {
          targetVisible = entries.some((entry) => entry.isIntersecting);
          notify();
        });
        observer.observe(element);
      }
    }

    notify();

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      observer?.disconnect();
      onChangeRef.current(false);
    };
  }, [enabled, target]);
}
