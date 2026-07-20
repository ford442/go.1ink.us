import { useEffect } from 'react';

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Keep keyboard focus inside an open overlay (Omni palette, cheatsheet, …). */
export default function useFocusTrap(containerRef, isActive) {
  useEffect(() => {
    if (!isActive || !containerRef.current) return undefined;

    const root = containerRef.current;
    const previouslyFocused = document.activeElement;

    const focusFirst = () => {
      const nodes = root.querySelectorAll(FOCUSABLE);
      if (nodes.length > 0) {
        nodes[0].focus();
      }
    };

    const timer = setTimeout(focusFirst, 50);

    const handleKeyDown = (event) => {
      if (event.key !== 'Tab') return;

      const nodes = root.querySelectorAll(FOCUSABLE);
      if (nodes.length === 0) return;

      const first = nodes[0];
      const last = nodes[nodes.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    root.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(timer);
      root.removeEventListener('keydown', handleKeyDown);
      if (previouslyFocused instanceof HTMLElement && document.contains(previouslyFocused)) {
        previouslyFocused.focus();
      }
    };
  }, [containerRef, isActive]);
}
