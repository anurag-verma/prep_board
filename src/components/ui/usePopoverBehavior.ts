import { useEffect, useRef } from 'react';

/** Shared keyboard/pointer behavior for small toggle-button popovers
 * (dropdown menus, filter panels): closes on Escape, closes on an
 * outside click, and returns focus to the trigger when it closes that way
 * (native to Esc/outside-click, same as a native `<select>`). Unlike
 * `useDialogBehavior`, this does NOT trap focus — these are lightweight
 * popovers anchored to a visible trigger button, not modal dialogs. */
interface PopoverBehaviorOptions {
  /** Set false when this popover is nested inside a dialog/sheet that already
   * owns Escape (e.g. DetailSheet's "More actions" menu) — otherwise both
   * listeners fire on the same keypress and Escape closes the whole dialog
   * instead of just the popover. Outside-click closing has no such conflict,
   * so it stays on regardless. Defaults to true. */
  closeOnEscape?: boolean;
}

export function usePopoverBehavior<T extends HTMLElement>(
  open: boolean,
  onClose: () => void,
  { closeOnEscape = true }: PopoverBehaviorOptions = {},
) {
  const containerRef = useRef<T>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (closeOnEscape && e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose, closeOnEscape]);

  return containerRef;
}
