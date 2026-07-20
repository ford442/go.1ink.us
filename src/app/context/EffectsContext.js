import createDomainContext from './createDomainContext';

// Background refs plus the performance-mode gate that controls which
// Curator visual layers are active (starfield, particles, warp, etc.).
export const [EffectsContext, useEffectsContext] = createDomainContext('useEffectsContext');
