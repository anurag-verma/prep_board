import { useEffect } from 'react';
import { themeAttributeFor } from '../../lib/theme';
import { useThemeStore } from '../../store/useThemeStore';

/** Applies the current theme preference to `<html data-theme>` — a
 * component (not inline in `main.tsx`) so it can react to later changes via
 * the store subscription, not just apply once on load. Renders nothing. */
function ThemeEffect() {
  const preference = useThemeStore((s) => s.preference);

  useEffect(() => {
    const attr = themeAttributeFor(preference);
    if (attr === null) {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', attr);
    }
  }, [preference]);

  return null;
}

export default ThemeEffect;
