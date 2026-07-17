export type ThemePreference = 'system' | 'light' | 'dark';

/** What to write to `<html data-theme>` for a given preference. `'system'`
 * means "no attribute" — the CSS `prefers-color-scheme` media query decides,
 * so the OS-level setting is respected with zero JS involvement and no
 * flash-of-wrong-theme risk for the common case. */
export function themeAttributeFor(preference: ThemePreference): string | null {
  return preference === 'system' ? null : preference;
}
