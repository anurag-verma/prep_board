import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useThemeStore } from '../../store/useThemeStore';
import { useUiStore } from '../../store/useUiStore';
import SettingsMenu from './SettingsMenu';

beforeEach(() => {
  useUiStore.setState({
    settingsMenuOpen: false,
    stageEditorOpen: false,
    deleteAllDataModalOpen: false,
    privacyModalOpen: false,
  });
  useThemeStore.setState({ preference: 'system' });
});

describe('SettingsMenu', () => {
  it('opens the menu on click, showing Edit stages, Privacy, and Delete all data', () => {
    render(<SettingsMenu />);
    fireEvent.click(screen.getByRole('button', { name: 'Settings' }));

    expect(screen.getByRole('menuitem', { name: /Edit stages/ })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /Privacy/ })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /Delete all data/ })).toBeInTheDocument();
  });

  it('"Privacy" opens the privacy modal and closes the menu', () => {
    render(<SettingsMenu />);
    fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
    fireEvent.click(screen.getByRole('menuitem', { name: /Privacy/ }));

    expect(useUiStore.getState().privacyModalOpen).toBe(true);
    expect(useUiStore.getState().settingsMenuOpen).toBe(false);
  });

  it('"Edit stages" opens the stage editor and closes the menu', () => {
    render(<SettingsMenu />);
    fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
    fireEvent.click(screen.getByRole('menuitem', { name: /Edit stages/ }));

    expect(useUiStore.getState().stageEditorOpen).toBe(true);
    expect(useUiStore.getState().settingsMenuOpen).toBe(false);
  });

  it('"Delete all data" opens the delete-all modal and closes the menu', () => {
    render(<SettingsMenu />);
    fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
    fireEvent.click(screen.getByRole('menuitem', { name: /Delete all data/ }));

    expect(useUiStore.getState().deleteAllDataModalOpen).toBe(true);
    expect(useUiStore.getState().settingsMenuOpen).toBe(false);
  });

  it('shows a System/Light/Dark theme control, System checked by default', () => {
    render(<SettingsMenu />);
    fireEvent.click(screen.getByRole('button', { name: 'Settings' }));

    const system = screen.getByRole('menuitemradio', { name: 'System' });
    const light = screen.getByRole('menuitemradio', { name: 'Light' });
    const dark = screen.getByRole('menuitemradio', { name: 'Dark' });
    expect(system).toHaveAttribute('aria-checked', 'true');
    expect(light).toHaveAttribute('aria-checked', 'false');
    expect(dark).toHaveAttribute('aria-checked', 'false');
  });

  it('picking Dark updates the theme store and does not close the menu', () => {
    render(<SettingsMenu />);
    fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
    fireEvent.click(screen.getByRole('menuitemradio', { name: 'Dark' }));

    expect(useThemeStore.getState().preference).toBe('dark');
    expect(useUiStore.getState().settingsMenuOpen).toBe(true);
    expect(screen.getByRole('menuitemradio', { name: 'Dark' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
  });

  it('closes on Escape', () => {
    render(<SettingsMenu />);
    fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
    expect(useUiStore.getState().settingsMenuOpen).toBe(true);

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(useUiStore.getState().settingsMenuOpen).toBe(false);
  });

  it('closes on an outside click', () => {
    render(
      <div>
        <div data-testid="outside">Elsewhere</div>
        <SettingsMenu />
      </div>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
    expect(useUiStore.getState().settingsMenuOpen).toBe(true);

    fireEvent.mouseDown(screen.getByTestId('outside'));

    expect(useUiStore.getState().settingsMenuOpen).toBe(false);
  });

  it('does not close on a click inside the menu', () => {
    render(<SettingsMenu />);
    fireEvent.click(screen.getByRole('button', { name: 'Settings' }));

    fireEvent.mouseDown(screen.getByRole('menuitem', { name: /Edit stages/ }));

    expect(useUiStore.getState().settingsMenuOpen).toBe(true);
  });
});
