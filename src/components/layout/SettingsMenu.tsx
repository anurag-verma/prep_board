import { Check, Info, Lock, Moon, SlidersHorizontal, Sun, SunMoon, Trash2 } from 'lucide-react';
import { useCallback } from 'react';
import type { ThemePreference } from '../../lib/theme';
import { useThemeStore } from '../../store/useThemeStore';
import { useUiStore } from '../../store/useUiStore';
import { usePopoverBehavior } from '../ui/usePopoverBehavior';

/** Fixed (not theme-variable) preview colors — a Dark swatch must look dark
 * even while the app itself is in Light mode, and vice versa, so these are
 * deliberately literal rather than sourced from the current --tokens. */
const THEME_OPTIONS: {
  value: ThemePreference;
  label: string;
  icon: typeof Sun;
  swatch: string;
  iconColor: string;
}[] = [
  {
    value: 'system',
    label: 'System',
    icon: SunMoon,
    swatch: 'linear-gradient(135deg, #f5f6f4 0%, #f5f6f4 50%, #14171a 50%, #14171a 100%)',
    iconColor: '#66707b',
  },
  { value: 'light', label: 'Light', icon: Sun, swatch: '#f5f6f4', iconColor: '#17202b' },
  { value: 'dark', label: 'Dark', icon: Moon, swatch: '#14171a', iconColor: '#e7e9e5' },
];

function SettingsMenu() {
  const settingsMenuOpen = useUiStore((s) => s.settingsMenuOpen);
  const setSettingsMenuOpen = useUiStore((s) => s.setSettingsMenuOpen);
  const openStageEditor = useUiStore((s) => s.openStageEditor);
  const openDeleteAllDataModal = useUiStore((s) => s.openDeleteAllDataModal);
  const openPrivacyModal = useUiStore((s) => s.openPrivacyModal);
  const openAboutModal = useUiStore((s) => s.openAboutModal);
  const themePreference = useThemeStore((s) => s.preference);
  const setThemePreference = useThemeStore((s) => s.setPreference);

  const close = useCallback(() => setSettingsMenuOpen(false), [setSettingsMenuOpen]);
  const containerRef = usePopoverBehavior<HTMLDivElement>(settingsMenuOpen, close);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        aria-label="Settings"
        title="Settings"
        aria-haspopup="menu"
        aria-expanded={settingsMenuOpen}
        onClick={() => setSettingsMenuOpen(!settingsMenuOpen)}
        className="rounded-md border border-line p-1.5 text-muted hover:bg-bg hover:text-ink"
      >
        ⚙
      </button>

      {settingsMenuOpen && (
        <div
          role="menu"
          className="absolute right-0 z-10 mt-1 w-48 rounded-md border border-line bg-surface p-2 [box-shadow:var(--shadow-popover)]"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setSettingsMenuOpen(false);
              openStageEditor();
            }}
            className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-bg"
          >
            <SlidersHorizontal size={14} /> Edit stages
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={openPrivacyModal}
            className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-bg"
          >
            <Lock size={14} /> Privacy
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={openAboutModal}
            className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-bg"
          >
            <Info size={14} /> About
          </button>

          <div
            role="group"
            aria-label="Theme"
            className="my-1 rounded-md border border-line bg-bg p-2"
          >
            <p className="mb-1.5 px-1 text-xs font-semibold uppercase tracking-wide text-muted">
              Theme
            </p>
            <div className="flex gap-1.5">
              {THEME_OPTIONS.map(({ value, label, icon: Icon, swatch, iconColor }) => {
                const active = themePreference === value;
                return (
                  <button
                    key={value}
                    type="button"
                    role="menuitemradio"
                    aria-checked={active}
                    aria-label={label}
                    title={label}
                    onClick={() => setThemePreference(value)}
                    className="flex flex-1 flex-col items-center gap-1 rounded-md p-1 text-xs font-medium transition-shadow"
                    style={{
                      color: active ? 'var(--action)' : 'var(--muted)',
                      boxShadow: active ? '0 0 0 2px var(--action)' : '0 0 0 1px var(--line)',
                    }}
                  >
                    <span
                      className="relative flex h-8 w-full items-center justify-center rounded"
                      style={{ background: swatch }}
                    >
                      <Icon size={14} color={iconColor} />
                      {active && (
                        <span
                          className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full"
                          style={{ backgroundColor: 'var(--action)', color: 'var(--on-action)' }}
                        >
                          <Check size={9} strokeWidth={3} />
                        </span>
                      )}
                    </span>
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            role="menuitem"
            onClick={openDeleteAllDataModal}
            className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-bg"
            style={{ color: 'var(--danger)' }}
          >
            <Trash2 size={14} /> Delete all data
          </button>
        </div>
      )}
    </div>
  );
}

export default SettingsMenu;
