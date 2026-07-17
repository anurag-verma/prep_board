import { describe, expect, it } from 'vitest';
import { themeAttributeFor } from './theme';

describe('themeAttributeFor', () => {
  it('returns null for "system" (no attribute — CSS media query decides)', () => {
    expect(themeAttributeFor('system')).toBeNull();
  });

  it('returns "light" for an explicit light preference', () => {
    expect(themeAttributeFor('light')).toBe('light');
  });

  it('returns "dark" for an explicit dark preference', () => {
    expect(themeAttributeFor('dark')).toBe('dark');
  });
});
