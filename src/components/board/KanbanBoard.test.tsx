import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useBoardStore } from '../../store/useBoardStore';
import { useUiStore } from '../../store/useUiStore';
import { DEFAULT_STAGES } from '../../types/models';
import KanbanBoard from './KanbanBoard';

beforeEach(() => {
  useBoardStore.setState({ stages: DEFAULT_STAGES, applications: [] });
  useUiStore.setState({
    collapsedStageIds: ['rejected'],
    searchText: '',
    priorityOnly: false,
    selectedTags: [],
    showArchived: false,
  });
});

describe('KanbanBoard', () => {
  it('renders all 6 default stages', () => {
    render(<KanbanBoard />);

    for (const stage of DEFAULT_STAGES) {
      if (stage.id === 'rejected') continue; // collapsed, name renders sideways
      expect(screen.getByRole('heading', { name: stage.name })).toBeInTheDocument();
    }
    // Rejected is collapsed but still labeled and accessible
    expect(
      screen.getByRole('button', { name: /Rejected, expand column/ }),
    ).toBeInTheDocument();
  });

  it('shows accurate counts per column', () => {
    useBoardStore.getState().addApplication({ company: 'Acme', role: 'Eng', stageId: 'applied' });
    useBoardStore.getState().addApplication({ company: 'Globex', role: 'PM', stageId: 'applied' });
    useBoardStore.getState().addApplication({ company: 'Initech', role: 'QA', stageId: 'oa' });

    render(<KanbanBoard />);

    const appliedHeading = screen.getByRole('heading', { name: 'Applied' });
    const appliedColumn = appliedHeading.closest('div')!.parentElement!;
    expect(within(appliedColumn).getByText('(2)')).toBeInTheDocument();

    const oaHeading = screen.getByRole('heading', { name: 'OA' });
    const oaColumn = oaHeading.closest('div')!.parentElement!;
    expect(within(oaColumn).getByText('(1)')).toBeInTheDocument();
  });

  it('excludes archived applications from column counts', () => {
    const app = useBoardStore
      .getState()
      .addApplication({ company: 'Acme', role: 'Eng', stageId: 'applied' });
    useBoardStore.getState().archiveApplication(app.id);

    render(<KanbanBoard />);

    const appliedHeading = screen.getByRole('heading', { name: 'Applied' });
    const appliedColumn = appliedHeading.closest('div')!.parentElement!;
    expect(within(appliedColumn).getByText('(0)')).toBeInTheDocument();
  });

  it('column counts reflect the active filters (priority toggle)', async () => {
    const acme = useBoardStore
      .getState()
      .addApplication({ company: 'Acme', role: 'Eng', stageId: 'applied' });
    useBoardStore.getState().updateApplication(acme.id, { priority: true });
    useBoardStore.getState().addApplication({ company: 'Globex', role: 'PM', stageId: 'applied' });

    render(<KanbanBoard />);

    const appliedColumnBefore = screen
      .getByRole('heading', { name: 'Applied' })
      .closest('div')!.parentElement!;
    expect(within(appliedColumnBefore).getByText('(2)')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Priority' }));

    await waitFor(() => {
      const appliedColumnAfter = screen
        .getByRole('heading', { name: 'Applied' })
        .closest('div')!.parentElement!;
      expect(within(appliedColumnAfter).getByText('(1)')).toBeInTheDocument();
    });
    expect(screen.getByText('Acme')).toBeInTheDocument();
    expect(screen.queryByText('Globex')).not.toBeInTheDocument();
  });

  it('archived applications are hidden from the board by default', () => {
    const app = useBoardStore
      .getState()
      .addApplication({ company: 'Archived Co', role: 'Eng', stageId: 'applied' });
    useBoardStore.getState().archiveApplication(app.id);

    render(<KanbanBoard />);

    expect(screen.queryByText('Archived Co')).not.toBeInTheDocument();
  });

  it('"Show archived" reveals archived cards, badged, without hiding active ones', () => {
    const archived = useBoardStore
      .getState()
      .addApplication({ company: 'Archived Co', role: 'Eng', stageId: 'applied' });
    useBoardStore.getState().archiveApplication(archived.id);
    useBoardStore
      .getState()
      .addApplication({ company: 'Active Co', role: 'Eng', stageId: 'applied' });

    render(<KanbanBoard />);
    fireEvent.click(screen.getByRole('button', { name: /Show archived/ }));

    expect(screen.getByText('Archived Co')).toBeInTheDocument();
    expect(screen.getByText('Active Co')).toBeInTheDocument();
    // the archived card carries a visible, accessible "Archived" label (not color-only)
    const archivedCard = screen.getByText('Archived Co').closest('button')!;
    expect(within(archivedCard).getByText('Archived')).toBeInTheDocument();
  });

  it('Rejected column is collapsed by default and expands on click', () => {
    useBoardStore
      .getState()
      .addApplication({ company: 'NoGo Inc', role: 'Eng', stageId: 'rejected' });

    render(<KanbanBoard />);

    expect(screen.queryByRole('heading', { name: 'Rejected' })).not.toBeInTheDocument();
    const expandButton = screen.getByRole('button', { name: /Rejected, expand column/ });

    fireEvent.click(expandButton);

    expect(screen.getByRole('heading', { name: 'Rejected' })).toBeInTheDocument();
    expect(screen.getByText('NoGo Inc')).toBeInTheDocument();
  });
});
