import createDomainContext from './createDomainContext';

// boot sequence + running activity log. Kept separate from EffectsContext
// (background refs) because addActivityLog fires on every search keystroke
// past 2 characters — bundling it with the starfield/grid refs would force
// BackgroundElements to re-render while the user types.
export const [ActivityContext, useActivityContext] = createDomainContext('useActivityContext');
