import createDomainContext from './createDomainContext';

// terminal history, holo/text terminal open state, input
export const [TerminalContext, useTerminalContext] = createDomainContext('useTerminalContext');
