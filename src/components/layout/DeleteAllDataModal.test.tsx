import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { __resetStorageCacheForTests } from '../../store/persistStorage';
import { useBoardStore } from '../../store/useBoardStore';
import { useQuestionStore } from '../../store/useQuestionStore';
import { useUiStore } from '../../store/useUiStore';
import { DEFAULT_STAGES } from '../../types/models';
import DeleteAllDataModal from './DeleteAllDataModal';

beforeEach(() => {
  localStorage.clear();
  __resetStorageCacheForTests();
  useBoardStore.setState({ stages: DEFAULT_STAGES, applications: [] });
  useQuestionStore.setState({ questions: [] });
});

describe('DeleteAllDataModal', () => {
  it('the delete button starts disabled', () => {
    render(<DeleteAllDataModal />);
    expect(screen.getByText('Delete everything')).toBeDisabled();
  });

  it('stays disabled for a near-miss (wrong case, extra whitespace, partial word)', () => {
    render(<DeleteAllDataModal />);
    const input = screen.getByLabelText('Type DELETE to confirm');

    for (const attempt of ['delete', 'DELETE ', ' DELETE', 'DELET', 'deleted']) {
      fireEvent.change(input, { target: { value: attempt } });
      expect(screen.getByText('Delete everything')).toBeDisabled();
    }
  });

  it('enables the delete button only on an exact "DELETE" match', () => {
    render(<DeleteAllDataModal />);
    fireEvent.change(screen.getByLabelText('Type DELETE to confirm'), {
      target: { value: 'DELETE' },
    });
    expect(screen.getByText('Delete everything')).toBeEnabled();
  });

  it('clears applications, questions, and resets stages to the defaults', () => {
    useBoardStore.getState().addApplication({ company: 'Acme', role: 'Eng' });
    useQuestionStore.getState().addQuestion({ text: 'Two Sum', category: 'dsa', difficulty: 'easy' });
    useBoardStore.getState().addStage({ name: 'Custom' });

    render(<DeleteAllDataModal />);
    fireEvent.change(screen.getByLabelText('Type DELETE to confirm'), {
      target: { value: 'DELETE' },
    });
    fireEvent.click(screen.getByText('Delete everything'));

    expect(useBoardStore.getState().applications).toHaveLength(0);
    expect(useBoardStore.getState().stages).toEqual(DEFAULT_STAGES);
    expect(useQuestionStore.getState().questions).toHaveLength(0);
  });

  it('actually removes the localStorage key, not just the in-memory store', () => {
    useBoardStore.getState().addApplication({ company: 'Acme', role: 'Eng' });

    render(<DeleteAllDataModal />);
    fireEvent.change(screen.getByLabelText('Type DELETE to confirm'), {
      target: { value: 'DELETE' },
    });
    fireEvent.click(screen.getByText('Delete everything'));

    expect(localStorage.getItem('prepboard-data')).toBeNull();
  });

  it('closes the modal after deleting', () => {
    useUiStore.setState({ deleteAllDataModalOpen: true });
    render(<DeleteAllDataModal />);

    fireEvent.change(screen.getByLabelText('Type DELETE to confirm'), {
      target: { value: 'DELETE' },
    });
    fireEvent.click(screen.getByText('Delete everything'));

    expect(useUiStore.getState().deleteAllDataModalOpen).toBe(false);
  });

  it('Cancel closes without deleting anything', () => {
    useBoardStore.getState().addApplication({ company: 'Acme', role: 'Eng' });
    render(<DeleteAllDataModal />);

    fireEvent.click(screen.getByText('Cancel'));

    expect(useBoardStore.getState().applications).toHaveLength(1);
  });
});
