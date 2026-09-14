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
