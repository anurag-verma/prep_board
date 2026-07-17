import { useEffect, useRef, useState } from 'react';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Shared modal/sheet a11y behavior: traps focus inside the container while
 * mounted, closes on Esc, moves focus in on mount and back to whatever
 * triggered it on unmount, and reveals a `visible` flag one frame after
 * mount so callers can animate in (CSS transition from a hidden starting
 * state to `visible`). */
export function useDialogBehavior<T extends HTMLElement>(onClose: () => void) {
  const containerRef = useRef<T>(null);
  const triggerRef = useRef<Element | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    triggerRef.current = document.activeElement;
    containerRef.current?.focus();
    const raf = requestAnimationFrame(() => setVisible(true));

    return () => {
      cancelAnimationFrame(raf);
      if (triggerRef.current instanceof HTMLElement) {
        triggerRef.current.focus();
      }
    };
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key !== 'Tab' || !containerRef.current) return;

      const focusable = Array.from(
        containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return { containerRef, visible };
}
