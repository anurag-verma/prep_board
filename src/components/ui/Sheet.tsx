import type { ReactNode } from 'react';
import { useDialogBehavior } from './useDialogBehavior';

interface SheetProps {
  onClose: () => void;
  children: ReactNode;
  'aria-label': string;
}

/** A right-side sheet (full-screen on mobile): backdrop, focus trap, Esc to
 * close, focus returns to whatever triggered it on unmount, slide-in. */
function Sheet({ onClose, children, 'aria-label': ariaLabel }: SheetProps) {
  const { containerRef, visible } = useDialogBehavior<HTMLDivElement>(onClose);

  return (
    <div className="fixed inset-0 z-20">
      <div
        aria-hidden
        onClick={onClose}
        className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-200 ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
      />
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        tabIndex={-1}
        className={`absolute inset-y-0 right-0 flex w-full flex-col bg-surface [box-shadow:var(--shadow-popover)] outline-none transition-transform duration-200 ease-out md:w-[520px] ${
          visible ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {children}
      </div>
    </div>
  );
}

export default Sheet;
