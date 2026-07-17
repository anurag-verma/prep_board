import { act, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useUiStore } from '../../store/useUiStore';
import ConfettiBurst from './ConfettiBurst';

beforeEach(() => {
  useUiStore.setState({ celebration: 0 });
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('ConfettiBurst', () => {
  it('renders nothing on mount', () => {
    const { container } = render(<ConfettiBurst />);
    expect(container.querySelectorAll('.confetti-piece')).toHaveLength(0);
  });

  it('renders a burst of pieces when celebration increments, then clears itself', () => {
    vi.useFakeTimers();
    const { container } = render(<ConfettiBurst />);

    act(() => {
      useUiStore.getState().triggerCelebration();
    });
    expect(container.querySelectorAll('.confetti-piece').length).toBeGreaterThan(0);

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(container.querySelectorAll('.confetti-piece')).toHaveLength(0);
  });

  it('does not render a burst when prefers-reduced-motion is set', () => {
    vi.spyOn(window, 'matchMedia').mockReturnValue({
      matches: true,
      media: '(prefers-reduced-motion: reduce)',
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    } as MediaQueryList);

    const { container } = render(<ConfettiBurst />);
    act(() => {
      useUiStore.getState().triggerCelebration();
    });

    expect(container.querySelectorAll('.confetti-piece')).toHaveLength(0);
  });
});
