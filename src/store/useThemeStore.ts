import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ThemePreference } from '../lib/theme';

interface ThemeState {
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
}

/** Deliberately its own localStorage key (`prepboard-theme`), not folded
 * into the shared `prepboard-data` blob — this is a UI preference, not
 * app data, so it shouldn't share that store's schemaVersion/migration
 * surface (or get wiped by "Delete all data", which only clears app data). */
export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      preference: 'system',
      setPreference: (preference) => set({ preference }),
    }),
    { name: 'prepboard-theme' },
  ),
);
