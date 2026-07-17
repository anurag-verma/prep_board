import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import Sheet from './Sheet';

function ToggleableSheet() {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button onClick={() => setOpen(true)}>Trigger</button>
      {open && (
        <Sheet onClose={() => setOpen(false)} aria-label="Test sheet">
          <button>Inside</button>
        </Sheet>
      )}
    </div>
  );
}

function renderWithTrigger() {
  const onClose = vi.fn();
  render(
    <div>
      <button>Open trigger</button>
      <Sheet onClose={onClose} aria-label="Test sheet">
        <button>First</button>
        <button>Last</button>
      </Sheet>
    </div>,
  );
  return onClose;
}

describe('Sheet', () => {
  it('renders as a labeled dialog', () => {
    renderWithTrigger();
    expect(screen.getByRole('dialog', { name: 'Test sheet' })).toBeInTheDocument();
  });

  it('calls onClose on Escape', () => {
    const onClose = renderWithTrigger();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when the backdrop is clicked', () => {
    const onClose = renderWithTrigger();
    const backdrop = document.querySelector('[aria-hidden="true"]')!;
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('traps Tab focus: Tab on the last element wraps to the first', () => {
    renderWithTrigger();
    const first = screen.getByRole('button', { name: 'First' });
    const last = screen.getByRole('button', { name: 'Last' });

    last.focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(document.activeElement).toBe(first);
  });

  it('traps Shift+Tab: on the first element it wraps to the last', () => {
    renderWithTrigger();
    const first = screen.getByRole('button', { name: 'First' });
    const last = screen.getByRole('button', { name: 'Last' });

    first.focus();
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(last);
  });

  it('returns focus to the trigger element once the sheet unmounts', () => {
    render(<ToggleableSheet />);

    const trigger = screen.getByRole('button', { name: 'Trigger' });
    // A real browser click also focuses the clicked button; jsdom's fireEvent.click
    // doesn't, so focus it explicitly to reproduce what Sheet actually captures.
    trigger.focus();
    fireEvent.click(trigger);
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(document.activeElement).toBe(trigger);
  });
});
