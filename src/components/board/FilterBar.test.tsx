import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useBoardStore } from '../../store/useBoardStore';
import { useUiStore } from '../../store/useUiStore';
import { DEFAULT_STAGES } from '../../types/models';
import FilterBar from './FilterBar';

beforeEach(() => {
  useBoardStore.setState({ stages: DEFAULT_STAGES, applications: [] });
  useUiStore.setState({ searchText: '', priorityOnly: false, selectedTags: [] });
});

describe('FilterBar', () => {
  it('debounces search text before committing it to the store', async () => {
    vi.useFakeTimers();
    render(<FilterBar />);

    fireEvent.change(screen.getByLabelText('Search applications'), {
      target: { value: 'acme' },
    });

    // not committed yet
    expect(useUiStore.getState().searchText).toBe('');

    vi.advanceTimersByTime(150);
    expect(useUiStore.getState().searchText).toBe('acme');

    vi.useRealTimers();
  });

  it('toggles priorityOnly', () => {
    render(<FilterBar />);
    fireEvent.click(screen.getByRole('button', { name: /Priority/ }));
    expect(useUiStore.getState().priorityOnly).toBe(true);
  });

  it('lists distinct tags across applications and toggles selection', () => {
    useBoardStore.getState().addApplication({ company: 'A', role: 'Eng' });
    useBoardStore.setState((s) => ({
      applications: s.applications.map((a) => ({ ...a, tags: ['remote-ok', 'urgent'] })),
    }));

    render(<FilterBar />);
    fireEvent.click(screen.getByRole('button', { name: /Tags/ }));

    fireEvent.click(screen.getByLabelText('remote-ok'));
    expect(useUiStore.getState().selectedTags).toEqual(['remote-ok']);

    fireEvent.click(screen.getByLabelText('remote-ok'));
    expect(useUiStore.getState().selectedTags).toEqual([]);
  });

  it('shows Clear all only when a filter is active, and clears everything', async () => {
    render(<FilterBar />);
    expect(screen.queryByText('Clear all')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Priority/ }));
    expect(screen.getByText('Clear all')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Clear all'));

    await waitFor(() => expect(screen.queryByText('Clear all')).not.toBeInTheDocument());
    expect(useUiStore.getState().priorityOnly).toBe(false);
    expect(useUiStore.getState().searchText).toBe('');
    expect(useUiStore.getState().selectedTags).toEqual([]);
  });
});
