import createDomainContext from './createDomainContext';
import type { TerminalContextValue } from './contextTypes';

// terminal history, holo/text terminal open state, input
export const [TerminalContext, useTerminalContext] = createDomainContext<TerminalContextValue>('useTerminalContext');
