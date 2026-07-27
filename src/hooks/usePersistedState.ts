import { useEffect, useState } from 'react';

interface PersistedStateOptions<T> {
  fromStorage?: (raw: string) => T;
  toStorage?: (value: T) => string;
}

// Generic localStorage-backed useState. `fromStorage`/`toStorage` convert
// between the stored string and the value's real type (default: identity,
// suitable for plain strings). Falls back to `defaultValue` when nothing
// is stored yet, storage is unavailable (SSR), or parsing fails.
export default function usePersistedState<T>(
  key: string,
  defaultValue: T,
  { fromStorage, toStorage }: PersistedStateOptions<T> = {},
) {
  const parse = fromStorage ?? ((raw: string) => raw as T);
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
    // parse/stringify are intentionally omitted: callers must pass stable
    // serializers for a given `key`/`state`, or memoize them with useMemo/
    // useCallback if they need to vary at runtime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, state]);

  return [state, setState] as const;
}
