import { createContext, useContext } from 'react';

// Factory for a domain-scoped context + hook pair. Each domain (settings,
// browser, terminal, overlay, effects) gets its own Context identity so
// components only re-render when the slice they actually read changes,
// instead of sharing one god object rebuilt on every App render.
export default function createDomainContext<T>(hookName: string) {
  const Context = createContext<T | null>(null);

  function useDomainContext() {
    const value = useContext(Context);
    if (!value) {
      throw new Error(`${hookName} must be used within its matching Provider`);
    }
    return value;
  }

  return [Context, useDomainContext] as const;
}
