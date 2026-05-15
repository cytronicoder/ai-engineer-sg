export const storageKeys = {
  interests: "aie-pocket-interests",
  savedSessions: "aie-pocket-saved-sessions",
  planExportSelection: "aie-pocket-plan-export-selection",
  dayFilter: "aie-pocket-day-filter",
  tab: "aie-pocket-active-tab",
};

export function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeJson<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}
