import type { ReactNode } from 'react';
import { useDialogBehavior } from './useDialogBehavior';

interface ModalProps {
  onClose: () => void;
  children: ReactNode;
  'aria-label': string;
}

/** A centered modal dialog: backdrop, focus trap, Esc to close, focus
 * returns to whatever triggered it on unmount, fade/scale-in. */
function Modal({ onClose, children, 'aria-label': ariaLabel }: ModalProps) {
  const { containerRef, visible } = useDialogBehavior<HTMLDivElement>(onClose);

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center p-4">
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
        className={`relative flex max-h-[85vh] w-full max-w-md flex-col rounded-column bg-surface [box-shadow:var(--shadow-popover)] outline-none transition-all duration-200 ease-out ${
          visible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
      >
        {children}
      </div>
    </div>
  );
}

export default Modal;
