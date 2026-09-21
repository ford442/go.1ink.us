import { useCallback, useEffect, useRef, useState } from 'react';
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
export interface VisualLayerHandle {
  /** Forwards a hover-target signal to the backend (see `Engine.setHover`) and wakes a parked main-thread loop. */
  setHover: (hovering: boolean) => void;
}

export default function useVisualLayer(
  effect: EffectKind,
  canvasRef: RefObject<HTMLCanvasElement | null>,
  options: UseVisualLayerOptions = {},
): VisualLayerHandle {
  const { enabled = true, density = 1, theme = 'cyan', target } = options;
  const prefersReducedMotion = usePrefersReducedMotion();
  const active = enabled && !prefersReducedMotion;

  const backendRef = useRef<VisualBackend | null>(null);
  const themeRef = useRef<ThemeId>(theme);
  const densityRef = useRef(density);
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
      density: densityRef.current,
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
    // `density` is deliberately NOT a dependency here — a density change (e.g.
    // God Mode toggling) goes through the dedicated setDensity effect below
    // instead of tearing down and reinitializing the backend. Re-running init()
    // means re-transferring the canvas for a worker-backed layer, which can
    // only happen once per <canvas> element ever (see OffscreenWorkerBackend).
  }, [effect, active, canvasRef, loopHandle, usesWorker]);

  useEffect(() => {
    themeRef.current = theme;
    if (!active) return;
    backendRef.current?.setTheme(accentRgbRef.current, theme);
  }, [theme, active]);

  useEffect(() => {
    densityRef.current = density;
    if (!active) return;
    // Mirrors the pre-worker ParticleNetwork effect that recreated every
    // particle when `isGodMode` changed: each engine's setDensity reseeds
    // itself, so this updates density in place instead of reinitializing.
    backendRef.current?.setDensity(density);
  }, [density, active]);

  const setHover = useCallback((hovering: boolean) => {
    backendRef.current?.setHover(hovering);
    // No-ops for a worker-backed layer (its loop is self-sufficient once
    // setHover marks the layer as demanding a frame); wakes a parked
    // main-thread loop otherwise.
    loopHandle.wake();
  }, [loopHandle]);

  return { setHover };
}
