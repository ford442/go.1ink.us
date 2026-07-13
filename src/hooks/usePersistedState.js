import { useEffect, useState } from 'react';

// Generic localStorage-backed useState. `fromStorage`/`toStorage` convert
// between the stored string and the value's real type (default: identity,
// suitable for plain strings). Falls back to `defaultValue` when nothing
// is stored yet, storage is unavailable (SSR), or parsing fails.
export default function usePersistedState(key, defaultValue, { fromStorage, toStorage } = {}) {
  const parse = fromStorage || ((raw) => raw);
  const stringify = toStorage || ((value) => String(value));

  const [state, setState] = useState(() => {
    if (typeof window === 'undefined') return defaultValue;
    const stored = localStorage.getItem(key);
    if (stored === null) return defaultValue;
    try {
      return parse(stored);
    } catch {
      return defaultValue;
    }
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, stringify(state));
    // stringify is intentionally omitted: callers typically pass an inline
    // function, and its behavior only depends on `key`/`state` in practice.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, state]);

  return [state, setState];
}
