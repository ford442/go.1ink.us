import type { PerformanceFlags, PerformanceMode } from '../types';

export const PERF_STORAGE_KEY = 'curator_perf';

const VALID_MODES: PerformanceMode[] = ['auto', 'full', 'balanced', 'lite'];

function getSaveDataEnabled(): boolean {
  const conn = (navigator as unknown as { connection?: { saveData?: boolean } }).connection;
  return conn?.saveData === true;
}

export function parsePerformanceMode(raw: string | null): PerformanceMode {
  if (raw && VALID_MODES.includes(raw as PerformanceMode)) {
    return raw as PerformanceMode;
  }
  return 'auto';
}

/** Infer a starting preset from hardware / network / pointer hints. */
export function detectPerformanceMode(): Exclude<PerformanceMode, 'auto'> {
  if (typeof window === 'undefined') return 'balanced';

  const cores = navigator.hardwareConcurrency ?? 4;
  const saveData = getSaveDataEnabled();
  const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reducedMotion) return 'lite';
  if (saveData || cores <= 2) return 'lite';
  if (coarsePointer || cores <= 4) return 'balanced';
  return 'full';
}

/** Apply prefers-reduced-motion as a hard floor over the user's preference. */
export function resolveEffectiveMode(
  preference: PerformanceMode,
  prefersReducedMotion: boolean
): Exclude<PerformanceMode, 'auto'> {
  const base = preference === 'auto' ? detectPerformanceMode() : preference;
  if (prefersReducedMotion) return 'lite';
  return base;
}

export function getPerformanceFlags(mode: Exclude<PerformanceMode, 'auto'>): PerformanceFlags {
  switch (mode) {
    case 'full':
      return {
        starfield: true,
        particleNetwork: true,
        matrixRain: true,
        customCursor: true,
        warpTransition: true,
        cursorTrail: true,
        parallaxGrids: true,
        scrollVelocity: true,
        filmGrain: true,
        radarHud: true,
        card3d: true,
        floatingDebris: true,
        ambientOrbs: true,
        constellation3d: true,
      };
    case 'balanced':
      return {
        starfield: true,
        particleNetwork: true,
        matrixRain: true,
        customCursor: true,
        warpTransition: true,
        cursorTrail: false,
        parallaxGrids: true,
        scrollVelocity: false,
        filmGrain: false,
        radarHud: false,
        card3d: true,
        floatingDebris: false,
        ambientOrbs: false,
        constellation3d: true,
      };
    case 'lite':
    default:
      return {
        starfield: false,
        particleNetwork: false,
        matrixRain: false,
        customCursor: false,
        warpTransition: false,
        cursorTrail: false,
        parallaxGrids: false,
        scrollVelocity: false,
        filmGrain: false,
        radarHud: false,
        card3d: false,
        floatingDebris: false,
        ambientOrbs: false,
        constellation3d: false,
      };
  }
}

export function performanceModeLabel(mode: PerformanceMode | Exclude<PerformanceMode, 'auto'>): string {
  switch (mode) {
    case 'auto': return 'Auto';
    case 'full': return 'Full';
    case 'balanced': return 'Balanced';
    case 'lite': return 'Lite';
    default: return mode;
  }
}
