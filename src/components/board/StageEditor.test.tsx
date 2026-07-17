import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useBoardStore } from '../../store/useBoardStore';
import { useUiStore } from '../../store/useUiStore';
import { DEFAULT_STAGES } from '../../types/models';
import StageEditor from './StageEditor';

beforeEach(() => {
  useBoardStore.setState({ stages: DEFAULT_STAGES, applications: [] });
});

describe('StageEditor', () => {
  it('renders a row for every stage', () => {
    render(<StageEditor />);
    for (const stage of DEFAULT_STAGES) {
      expect(screen.getByDisplayValue(stage.name)).toBeInTheDocument();
    }
  });

  it('renaming a stage persists immediately', () => {
    render(<StageEditor />);
    const nameInputs = screen.getAllByLabelText('Stage name');
    fireEvent.change(nameInputs[0], { target: { value: 'Backlog' } });

    expect(useBoardStore.getState().stages[0].name).toBe('Backlog');
  });

  it('toggling terminal persists immediately', () => {
    render(<StageEditor />);
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);

    expect(useBoardStore.getState().stages[0].isTerminal).toBe(true);
  });

  it('Add stage appends a new stage and disables once at MAX_STAGES', () => {
    render(<StageEditor />);
    expect(useBoardStore.getState().stages).toHaveLength(6);

    fireEvent.click(screen.getByText('Add stage'));
    fireEvent.click(screen.getByText('Add stage'));
    expect(useBoardStore.getState().stages).toHaveLength(8);

    expect(screen.getByText('Add stage').closest('button')).toBeDisabled();
  });

  it('deleting an empty stage needs no destination picker, just a confirm', () => {
    render(<StageEditor />);
    fireEvent.click(screen.getByLabelText('Delete Wishlist'));

    expect(screen.getByText(/It has no applications/)).toBeInTheDocument();
    fireEvent.click(screen.getByText('Delete stage'));

    expect(useBoardStore.getState().stages.some((s) => s.id === 'wishlist')).toBe(false);
  });

  it('deleting a stage with applications relocates them to the chosen destination', () => {
    useBoardStore.getState().addApplication({ company: 'Acme', role: 'Eng', stageId: 'oa' });
    render(<StageEditor />);

    fireEvent.click(screen.getByLabelText('Delete OA'));
    expect(screen.getByText(/will move to/)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Destination stage'), {
      target: { value: 'interviewing' },
    });
    fireEvent.click(screen.getByText('Delete stage'));

    const app = useBoardStore.getState().applications[0];
    expect(app.stageId).toBe('interviewing');
    expect(useBoardStore.getState().stages.some((s) => s.id === 'oa')).toBe(false);
  });

  it('Cancel on the delete confirmation leaves the stage untouched', () => {
    render(<StageEditor />);
    fireEvent.click(screen.getByLabelText('Delete Wishlist'));
    fireEvent.click(screen.getByText('Cancel'));

    expect(useBoardStore.getState().stages.some((s) => s.id === 'wishlist')).toBe(true);
  });

  it('disables delete when only MIN_STAGES remain', () => {
    useBoardStore.setState({ stages: [DEFAULT_STAGES[0], DEFAULT_STAGES[1]] });
    render(<StageEditor />);

    const deleteButtons = screen.getAllByRole('button', { name: /^Delete/ });
    for (const button of deleteButtons) {
      expect(button).toBeDisabled();
    }
  });

  it('closes via the close button', () => {
    const closeSpy = vi.spyOn(useUiStore.getState(), 'closeStageEditor');
    render(<StageEditor />);
    fireEvent.click(screen.getByLabelText('Close'));
    expect(closeSpy).toHaveBeenCalled();
  });
});
