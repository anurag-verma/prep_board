import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useBoardStore } from '../../store/useBoardStore';
import { DEFAULT_STAGES } from '../../types/models';
import StreakChip from './StreakChip';

beforeEach(() => {
  useBoardStore.setState({ stages: DEFAULT_STAGES, applications: [] });
});

describe('StreakChip', () => {
  it('shows a 0-day streak with no applications', () => {
    render(<StreakChip />);
    expect(screen.getByLabelText('0-day activity streak')).toHaveTextContent('▲ 0-day streak');
  });

  it('reflects a real streak computed from today\'s activity', () => {
    useBoardStore.getState().addApplication({ company: 'Acme', role: 'Engineer' });

    render(<StreakChip />);

    expect(screen.getByLabelText('1-day activity streak, logged today')).toHaveTextContent(
      '▲ 1-day streak',
    );
  });
});
