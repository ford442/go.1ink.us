import { CursorTrailEngine } from './cursorTrailEngine';
import { MatrixRainEngine } from './matrixRainEngine';
import { ParticleNetworkEngine } from './particleNetworkEngine';
import { StarfieldEngine } from './starfieldEngine';
import type { Engine } from './types';
import type { EffectKind } from '../types';

export function createEngine(effect: EffectKind): Engine {
  switch (effect) {
    case 'starfield': return new StarfieldEngine();
    case 'particleNetwork': return new ParticleNetworkEngine();
    case 'matrixRain': return new MatrixRainEngine();
    case 'cursorTrail': return new CursorTrailEngine();
    default: {
      const exhaustive: never = effect;
      throw new Error(`Unknown visual effect: ${String(exhaustive)}`);
    }
  }
}
