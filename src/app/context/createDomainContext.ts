import { createContext, useContext } from 'react';

interface DomainContextOptions {
  // Name reported in the "must be used within its matching Provider" error.
  hookName: string;
  // Shown in React DevTools as the Context's name; defaults to hookName.
  displayName?: string;
}

// Factory for a domain-scoped context + hook pair. Each domain (settings,
// browser, loadout, terminal, overlay, effects, activity) gets its own
// Context identity so components only re-render when the slice they
// actually read changes, instead of sharing one god object rebuilt on
// every App render.
export default function createDomainContext<T>({ hookName, displayName }: DomainContextOptions) {
  const Context = createContext<T | null>(null);
  Context.displayName = displayName ?? hookName;

  function useDomainContext() {
    const value = useContext(Context);
    if (!value) {
      throw new Error(`${hookName} must be used within its matching Provider`);
    }
    return value;
  }

  return [Context, useDomainContext] as const;
}

// Opt-in dual-context pair for a domain wide enough that some consumers
// only ever read state and others only ever call actions (see AGENTS.md's
// "when to split a domain" rule). The actions context should be given only
// `useCallback` references — values that never change identity across a
// domain's state updates — so an actions-only consumer subscribed to it
// never re-renders when that domain's state changes.
//
// Splitting state from actions in a domain where most consumers read both
// together (e.g. `MainContent` filtering by search while also wiring up
// filter/drag handlers) buys nothing: that consumer still re-renders on
// every state change because it also reads the actions context, and now
// there are two contexts to wire up instead of one. Reach for this only
// once profiling (or the domain's actual consumer list) shows a real
// actions-only or state-only reader.
createDomainContext.withActions = function withActions<State, Actions>(
  options: DomainContextOptions
) {
  const [StateContext, useDomainState] = createDomainContext<State>(options);
  const [ActionsContext, useDomainActions] = createDomainContext<Actions>({
    hookName: `${options.hookName}Actions`,
    displayName: options.displayName ? `${options.displayName}Actions` : undefined,
  });

  return [StateContext, ActionsContext, useDomainState, useDomainActions] as const;
};
