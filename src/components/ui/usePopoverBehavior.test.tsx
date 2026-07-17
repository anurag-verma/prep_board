import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { usePopoverBehavior } from './usePopoverBehavior';

function TestPopover({ closeOnEscape }: { closeOnEscape?: boolean }) {
  const [open, setOpen] = useState(true);
  const ref = usePopoverBehavior<HTMLDivElement>(open, () => setOpen(false), { closeOnEscape });

  return (
    <div>
      <div data-testid="outside">Outside</div>
      <div ref={ref} data-testid="popover">
        {open ? 'open' : 'closed'}
      </div>
    </div>
  );
}

describe('usePopoverBehavior', () => {
  it('closes on Escape by default', () => {
    render(<TestPopover />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.getByTestId('popover')).toHaveTextContent('closed');
  });

  it('closes on an outside click', () => {
    render(<TestPopover />);
    fireEvent.mouseDown(screen.getByTestId('outside'));
    expect(screen.getByTestId('popover')).toHaveTextContent('closed');
  });

  it('does not close on a click inside the popover', () => {
    render(<TestPopover />);
    fireEvent.mouseDown(screen.getByTestId('popover'));
    expect(screen.getByTestId('popover')).toHaveTextContent('open');
  });

  it('skips Escape handling when closeOnEscape is false, but outside-click still closes it', () => {
    render(<TestPopover closeOnEscape={false} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.getByTestId('popover')).toHaveTextContent('open');

    fireEvent.mouseDown(screen.getByTestId('outside'));
    expect(screen.getByTestId('popover')).toHaveTextContent('closed');
  });

  it('removes its listeners on unmount (no stray calls after unmount)', () => {
    const onClose = vi.fn();
    function Wrapper() {
      const ref = usePopoverBehavior<HTMLDivElement>(true, onClose);
      return <div ref={ref}>content</div>;
    }
    const { unmount } = render(<Wrapper />);
    unmount();

    fireEvent.keyDown(document, { key: 'Escape' });
    fireEvent.mouseDown(document.body);

    expect(onClose).not.toHaveBeenCalled();
  });
});
