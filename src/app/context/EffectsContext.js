import createDomainContext from './createDomainContext';

// background refs (starfield/grids/cursor trail canvas) only. These are
// useRef objects with a stable identity for the lifetime of the app, so
// this context's value never needs to change after mount — see
// ActivityContext for boot/activity-log state, which does change often.
export const [EffectsContext, useEffectsContext] = createDomainContext('useEffectsContext');
