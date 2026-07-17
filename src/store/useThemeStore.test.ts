import { beforeEach, describe, expect, it } from 'vitest';
import { useThemeStore } from './useThemeStore';

beforeEach(() => {
  localStorage.clear();
  useThemeStore.setState({ preference: 'system' });
});

describe('useThemeStore', () => {
  it('defaults to "system"', () => {
    expect(useThemeStore.getState().preference).toBe('system');
  });

  it('setPreference updates the preference', () => {
    useThemeStore.getState().setPreference('dark');
    expect(useThemeStore.getState().preference).toBe('dark');
  });

  it('persists under its own localStorage key, separate from the app data blob', () => {
    useThemeStore.getState().setPreference('light');

    const raw = localStorage.getItem('prepboard-theme');
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw!).state.preference).toBe('light');
    expect(localStorage.getItem('prepboard-data')).toBeNull();
  });
});
