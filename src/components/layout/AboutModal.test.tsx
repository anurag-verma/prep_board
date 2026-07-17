import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useUiStore } from '../../store/useUiStore';
import AboutModal from './AboutModal';

beforeEach(() => {
  useUiStore.setState({ aboutModalOpen: true });
});

describe('AboutModal', () => {
  it('explains what PrepBoard is for', () => {
    render(<AboutModal />);
    expect(
      screen.getByText('Track your job search without a spreadsheet.'),
    ).toBeInTheDocument();
  });

  it('lists the main pages', () => {
    render(<AboutModal />);
    expect(screen.getByText(/kanban board for job applications/i)).toBeInTheDocument();
    expect(screen.getByText(/searchable bank of interview questions/i)).toBeInTheDocument();
    expect(screen.getByText(/funnel, response rate, streak/i)).toBeInTheDocument();
  });

  it('"Got it" closes the modal', () => {
    render(<AboutModal />);
    fireEvent.click(screen.getByText('Got it'));

    expect(useUiStore.getState().aboutModalOpen).toBe(false);
  });
});
