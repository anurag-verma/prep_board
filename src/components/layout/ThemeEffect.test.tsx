import { act, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useThemeStore } from '../../store/useThemeStore';
import ThemeEffect from './ThemeEffect';

beforeEach(() => {
  useThemeStore.setState({ preference: 'system' });
  document.documentElement.removeAttribute('data-theme');
});

afterEach(() => {
  document.documentElement.removeAttribute('data-theme');
});

describe('ThemeEffect', () => {
  it('sets no data-theme attribute for "system"', () => {
    render(<ThemeEffect />);
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
  });

  it('sets data-theme="dark" for an explicit dark preference', () => {
    useThemeStore.setState({ preference: 'dark' });
    render(<ThemeEffect />);
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('sets data-theme="light" for an explicit light preference', () => {
    useThemeStore.setState({ preference: 'light' });
    render(<ThemeEffect />);
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('reacts to a later preference change without remounting', () => {
    render(<ThemeEffect />);
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);

    act(() => {
      useThemeStore.getState().setPreference('dark');
    });
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');

    act(() => {
      useThemeStore.getState().setPreference('system');
    });
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
  });
});
