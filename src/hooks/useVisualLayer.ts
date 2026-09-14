import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import useAnimationLoop from './useAnimationLoop';
import useVisibilityGate from './useVisibilityGate';
import usePrefersReducedMotion from './usePrefersReducedMotion';
import { ambientSignals } from '../lib/visuals/ambientSignals';
import { supportsOffscreenCanvas } from '../lib/visuals/support';
import { createVisualBackend } from '../lib/visuals/backends/createVisualBackend';
import { DEFAULT_ACCENT_RGB } from '../lib/visuals/constants';
import type { EffectKind, VisualBackend } from '../lib/visuals/types';
import type { ThemeId } from '../types';

export interface UseVisualLayerOptions {
  /** Mount and run the layer — pass the owning performance flag here. Defaults to true. */
  enabled?: boolean;
  /** 1 = normal; effects that support it (God Mode particles) scale up from here. */
  density?: number;
  theme?: ThemeId;
  /** Only run while this element is on screen. */
  target?: RefObject<Element | null>;
}

/**
 * Wires a `<canvas>` to a `VisualBackend` — the worker-backed
 * `OffscreenWorkerBackend` when the browser supports `transferControlToOffscreen`,
 * `MainThreadCanvasBackend` otherwise — and keeps it fed with resize, pointer,
 * theme and density updates for as long as the effect is enabled.
 *
 * `prefers-reduced-motion` is a hard floor: no backend is created at all, so a
 * reduced-motion visitor never spawns the visuals worker for something that
 * won't animate.
 */
export default function useVisualLayer(
  effect: EffectKind,
  canvasRef: RefObject<HTMLCanvasElement | null>,
  options: UseVisualLayerOptions = {},
): void {
  const { enabled = true, density = 1, theme = 'cyan', target } = options;
  const prefersReducedMotion = usePrefersReducedMotion();
  const active = enabled && !prefersReducedMotion;

  const backendRef = useRef<VisualBackend | null>(null);
  const themeRef = useRef<ThemeId>(theme);
  const accentRgbRef = useRef(DEFAULT_ACCENT_RGB);
  // A browser's OffscreenCanvas support can't change mid-session, so this is
  // computed once (lazy initializer) rather than re-derived inside an effect.
  const [usesWorker] = useState(() => supportsOffscreenCanvas());

  const loopHandle = useAnimationLoop((time) => backendRef.current?.tick(time), {
    enabled: active && !usesWorker,
    target,
  });

  useVisibilityGate(target, active && usesWorker, (visible) => {
    backendRef.current?.setRunning(visible);
  });

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const backend = createVisualBackend(effect, usesWorker);
    backendRef.current = backend;

    backend.init(canvas, {
      width: window.innerWidth,
      height: window.innerHeight,
      accentRgb: accentRgbRef.current,
      theme: themeRef.current,
      density,
    });

    const handleResize = () => backend.resize(window.innerWidth, window.innerHeight);
    window.addEventListener('resize', handleResize);

    const unsubscribe = ambientSignals.subscribe({
      onPointer: (x, y) => {
        backend.setPointer(x, y);
        loopHandle.wake();
      },
      onTheme: (accentRgb) => {
        accentRgbRef.current = accentRgb;
        backend.setTheme(accentRgb, themeRef.current);
      },
    });

    return () => {
      window.removeEventListener('resize', handleResize);
      unsubscribe();
      backend.dispose();
      backendRef.current = null;
    };
    // `density` is intentionally a dependency: a density change (e.g. God Mode
    // toggling) re-seeds the layer from scratch, mirroring the pre-worker
    // ParticleNetwork effect that recreated every particle when `isGodMode` changed.
  }, [effect, active, canvasRef, density, loopHandle, usesWorker]);

  useEffect(() => {
    themeRef.current = theme;
    if (!active) return;
    backendRef.current?.setTheme(accentRgbRef.current, theme);
  }, [theme, active]);
}
