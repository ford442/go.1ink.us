import { DEFAULT_ACCENT_RGB } from './constants';

export interface AmbientSignalListener {
  onPointer?: (x: number | null, y: number | null) => void;
  onTheme?: (accentRgb: string) => void;
}

/**
 * One shared pointer + theme-accent reader for every visual layer on the
 * page, instead of each effect running its own `mousemove` listener and
 * `getComputedStyle` read (the old per-component pattern in ParticleNetwork
 * and useBackgroundEffects). Cuts the DOM reads down to one `getComputedStyle`
 * call per theme change, no matter how many layers are subscribed, and lets
 * every backend (main-thread or worker) receive pointer/theme updates as a
 * single cheap postMessage-shaped call.
 */
class AmbientSignals {
  private listeners = new Set<AmbientSignalListener>();
  private pointerX: number | null = null;
  private pointerY: number | null = null;
  private accentRgb = DEFAULT_ACCENT_RGB;
  private observer: MutationObserver | null = null;

  private handleMouseMove = (event: MouseEvent): void => {
    this.pointerX = event.clientX;
    this.pointerY = event.clientY;
    for (const listener of this.listeners) listener.onPointer?.(this.pointerX, this.pointerY);
  };

  private handleMouseOut = (): void => {
    this.pointerX = null;
    this.pointerY = null;
    for (const listener of this.listeners) listener.onPointer?.(null, null);
  };

  private readAccent = (): void => {
    const rgb = getComputedStyle(document.documentElement).getPropertyValue('--rgb-accent-400').trim();
    this.accentRgb = rgb || DEFAULT_ACCENT_RGB;
    for (const listener of this.listeners) listener.onTheme?.(this.accentRgb);
  };

  private start(): void {
    if (this.observer) return;
    this.readAccent();
    this.observer = new MutationObserver(this.readAccent);
    this.observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    window.addEventListener('mousemove', this.handleMouseMove, { passive: true });
    window.addEventListener('mouseout', this.handleMouseOut);
  }

  private stop(): void {
    this.observer?.disconnect();
    this.observer = null;
    window.removeEventListener('mousemove', this.handleMouseMove);
    window.removeEventListener('mouseout', this.handleMouseOut);
  }

  /** Subscribes and immediately replays the current pointer/theme state. Returns an unsubscribe function. */
  subscribe(listener: AmbientSignalListener): () => void {
    this.listeners.add(listener);
    this.start();
    listener.onPointer?.(this.pointerX, this.pointerY);
    listener.onTheme?.(this.accentRgb);
    return () => {
      this.listeners.delete(listener);
      if (this.listeners.size === 0) this.stop();
    };
  }
}

export const ambientSignals = new AmbientSignals();
