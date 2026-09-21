import type { PerformanceFlags, PerformanceMode } from '../types';

export const PERF_STORAGE_KEY = 'curator_perf';

/** sessionStorage key for the current session's random-mode flag roll. */
export const PERF_RANDOM_SESSION_KEY = 'curator_perf_random_roll';

const VALID_MODES: PerformanceMode[] = ['auto', 'full', 'balanced', 'lite', 'random'];

type FlagKey = keyof PerformanceFlags;

const ALL_FLAG_KEYS: FlagKey[] = [
  'starfield', 'particleNetwork', 'matrixRain', 'customCursor', 'warpTransition',
  'cursorTrail', 'parallaxGrids', 'scrollVelocity', 'filmGrain', 'radarHud',
  'card3d', 'floatingDebris', 'ambientOrbs', 'constellation3d',
];

/**
 * Weighted tiers for `random` mode, cheapest-to-run first. `chance` is the
 * independent per-flag probability of that flag rolling active; the result
 * is then clamped into [RANDOM_TARGET_MIN, RANDOM_TARGET_MAX] so a session
 * never ends up all-off or nearly-`full`.
 */
const RANDOM_TIERS: { flags: FlagKey[]; chance: number }[] = [
  { flags: ['starfield', 'filmGrain', 'parallaxGrids'], chance: 0.8 },
  { flags: ['cursorTrail', 'card3d', 'ambientOrbs', 'floatingDebris', 'radarHud'], chance: 0.5 },
  { flags: ['particleNetwork', 'matrixRain', 'constellation3d', 'warpTransition', 'scrollVelocity', 'customCursor'], chance: 0.3 },
];

const RANDOM_TARGET_MIN = 6;
const RANDOM_TARGET_MAX = 8;

function allFlags(value: boolean): PerformanceFlags {
  return ALL_FLAG_KEYS.reduce((acc, key) => {
    acc[key] = value;
    return acc;
  }, {} as PerformanceFlags);
}

function shuffled<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr;
}

function isPerformanceFlags(value: unknown): value is PerformanceFlags {
  if (!value || typeof value !== 'object') return false;
  return ALL_FLAG_KEYS.every((key) => typeof (value as Record<string, unknown>)[key] === 'boolean');
}

/** Roll a fresh weighted-random flag combo, clamped to a 6-8 active target. */
export function rollRandomFlags(): PerformanceFlags {
  const flags = allFlags(false);
  const rollOrder = RANDOM_TIERS.flatMap((tier) => tier.flags);

  for (const tier of RANDOM_TIERS) {
    for (const key of tier.flags) {
      if (Math.random() < tier.chance) flags[key] = true;
    }
  }

  let active = rollOrder.filter((key) => flags[key]);

  if (active.length < RANDOM_TARGET_MIN) {
    const inactive = shuffled(rollOrder.filter((key) => !flags[key]));
    for (const key of inactive) {
      if (active.length >= RANDOM_TARGET_MIN) break;
      flags[key] = true;
      active.push(key);
    }
  }

  if (active.length > RANDOM_TARGET_MAX) {
    // Trim from the heaviest tier down so the kept set stays cheap-leaning.
    const removalOrder = [...RANDOM_TIERS].reverse().flatMap((tier) => tier.flags).filter((key) => flags[key]);
    for (const key of removalOrder) {
      if (active.length <= RANDOM_TARGET_MAX) break;
      flags[key] = false;
      active = active.filter((k) => k !== key);
    }
  }

  return flags;
}

/**
 * Read this session's random-mode flag roll, generating and persisting one
 * to `sessionStorage` on first read. Refreshing the tab reuses the same
 * roll; a new tab/session (fresh `sessionStorage`) gets a new one.
 */
export function getSessionRandomFlags(): PerformanceFlags {
  if (typeof window === 'undefined') return rollRandomFlags();

  try {
    const raw = window.sessionStorage.getItem(PERF_RANDOM_SESSION_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (isPerformanceFlags(parsed)) return parsed;
    }
  } catch {
    // sessionStorage unavailable (private mode, etc.) — fall through to a fresh roll.
  }

  const flags = rollRandomFlags();
  try {
    window.sessionStorage.setItem(PERF_RANDOM_SESSION_KEY, JSON.stringify(flags));
  } catch {
    // Best-effort persistence; the roll still works for this render.
  }
  return flags;
}

/** Clear the session roll and generate a new one. */
export function rerollRandomFlags(): PerformanceFlags {
  if (typeof window !== 'undefined') {
    try {
      window.sessionStorage.removeItem(PERF_RANDOM_SESSION_KEY);
    } catch {
      // ignore
    }
  }
  return getSessionRandomFlags();
}

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
  const memory = (navigator as unknown as { deviceMemory?: number }).deviceMemory;
  const saveData = getSaveDataEnabled();
  const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reducedMotion) return 'lite';
  if (saveData || cores <= 2 || (memory !== undefined && memory <= 2)) return 'lite';
  // Typical desktops and laptops (<= 8 cores or < 16GB RAM) land on balanced for high FPS and clarity
  if (coarsePointer || cores <= 8 || (memory !== undefined && memory < 16)) return 'balanced';
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
    case 'random':
      return getSessionRandomFlags();
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
    case 'random': return 'Random';
    default: return mode;
  }
}
