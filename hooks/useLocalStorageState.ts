import { useEffect, useState } from "react";

export function useLocalStorageState<T>(key: string, fallback: T): [T, (value: T) => void] {
  const [state, setState] = useState<T>(fallback);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const value = window.localStorage.getItem(key);
      if (value) {
        setState(JSON.parse(value) as T);
      }
    } catch {
      // ignore
    }
    setHydrated(true);
  }, [key]);

  useEffect(() => {
    if (hydrated) {
      try {
        window.localStorage.setItem(key, JSON.stringify(state));
      } catch {
        // ignore
      }
    }
  }, [key, state, hydrated]);

  return [state, setState];
}

