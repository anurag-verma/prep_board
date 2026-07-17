import type { StateStorage } from 'zustand/middleware';

const STORAGE_KEY = 'prepboard-data';
const DEBOUNCE_MS = 500;

let corruptOnLoad = false;
let cache: Record<string, unknown> | null = null;
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function readAll(): Record<string, unknown> {
  if (cache) return cache;

  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    cache = {};
    return cache;
  }

  try {
    cache = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    corruptOnLoad = true;
    localStorage.setItem(`${STORAGE_KEY}-corrupt-${Date.now()}`, raw);
    localStorage.removeItem(STORAGE_KEY);
    cache = {};
  }
  return cache;
}

function scheduleFlush() {
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(() => {
    flushTimer = null;
    if (cache) localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  }, DEBOUNCE_MS);
}

/** A zustand persist storage that keeps every slice under one localStorage
 * key (`prepboard-data`), debounced, with corrupt-JSON recovery. */
export const sharedStorage: StateStorage = {
  getItem: (name) => {
    const all = readAll();
    const value = all[name];
    return value === undefined ? null : JSON.stringify(value);
  },
  setItem: (name, value) => {
    const all = readAll();
    all[name] = JSON.parse(value);
    scheduleFlush();
  },
  removeItem: (name) => {
    const all = readAll();
    delete all[name];
    scheduleFlush();
  },
};

/** True if the last load hit corrupt JSON and fell back to a fresh start. */
export function didRecoverFromCorruptData(): boolean {
  readAll();
  return corruptOnLoad;
}

/** "Delete all my data" (Security doc §2): cancels any pending debounced
 * write, clears the in-memory cache, and removes the localStorage key
 * outright. Clearing localStorage alone (without resetting the cache) would
 * get silently undone by the next debounced flush re-writing stale data. */
export function clearAllData(): void {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  cache = {};
  localStorage.removeItem(STORAGE_KEY);
}

/** Test-only: reset in-memory cache so each test starts from localStorage fresh. */
export function __resetStorageCacheForTests(): void {
  cache = null;
  corruptOnLoad = false;
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
}

/** Test-only: bypass the debounce and write the current cache to localStorage now. */
export function __flushStorageForTests(): void {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  if (cache) localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
}
