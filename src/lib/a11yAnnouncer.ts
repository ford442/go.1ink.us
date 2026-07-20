let liveRegion: HTMLDivElement | null = null;

function ensureLiveRegion(): HTMLDivElement | null {
  if (typeof document === 'undefined') return null;

  if (!liveRegion) {
    liveRegion = document.createElement('div');
    liveRegion.id = 'curator-a11y-announcer';
    liveRegion.className = 'sr-only';
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.setAttribute('role', 'status');
    document.body.appendChild(liveRegion);
  }

  return liveRegion;
}

/** Screen-reader announcement for toasts, activity feed, and system events. */
export function announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
  const region = ensureLiveRegion();
  if (!region || !message.trim()) return;

  region.setAttribute('aria-live', priority);
  region.textContent = '';
  requestAnimationFrame(() => {
    region.textContent = message;
  });
}
