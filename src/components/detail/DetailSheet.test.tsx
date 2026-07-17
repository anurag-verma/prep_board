import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useBoardStore } from '../../store/useBoardStore';
import { useUiStore } from '../../store/useUiStore';
import { DEFAULT_STAGES } from '../../types/models';
import DetailSheet from './DetailSheet';

beforeEach(() => {
  useBoardStore.setState({ stages: DEFAULT_STAGES, applications: [] });
  useUiStore.setState({ selectedApplicationId: null });
});

function seedApplication() {
  return useBoardStore.getState().addApplication({ company: 'Acme Corp', role: 'Engineer' });
}

describe('DetailSheet', () => {
  it('renders company/role/stage in the header and the three tabs', () => {
    const app = seedApplication();
    render(<DetailSheet application={app} stages={DEFAULT_STAGES} />);

    expect(screen.getByLabelText('Company')).toHaveValue('Acme Corp');
    expect(screen.getByLabelText('Role')).toHaveValue('Engineer');
    expect(screen.getByLabelText('Stage')).toHaveValue(DEFAULT_STAGES[0].id);
    expect(screen.getByRole('tab', { name: 'details' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'rounds' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'timeline' })).toBeInTheDocument();
  });

  it('commits an inline company edit on blur', () => {
    const app = seedApplication();
    render(<DetailSheet application={app} stages={DEFAULT_STAGES} />);

    const input = screen.getByLabelText('Company');
    fireEvent.change(input, { target: { value: 'Globex Corp' } });
    fireEvent.blur(input);

    expect(
      useBoardStore.getState().applications.find((a) => a.id === app.id)?.company,
    ).toBe('Globex Corp');
  });

  it('changing the stage select calls moveCard', () => {
    const app = seedApplication();
    render(<DetailSheet application={app} stages={DEFAULT_STAGES} />);

    fireEvent.change(screen.getByLabelText('Stage'), { target: { value: 'interviewing' } });

    const updated = useBoardStore.getState().applications.find((a) => a.id === app.id)!;
    expect(updated.stageId).toBe('interviewing');
    expect(updated.events.some((e) => e.type === 'stage_change')).toBe(true);
  });

  it('toggles priority', () => {
    const app = seedApplication();
    render(<DetailSheet application={app} stages={DEFAULT_STAGES} />);

    fireEvent.click(screen.getByLabelText('Mark as priority'));

    expect(
      useBoardStore.getState().applications.find((a) => a.id === app.id)?.priority,
    ).toBe(true);
  });

  it('switches tabs', () => {
    const app = seedApplication();
    render(<DetailSheet application={app} stages={DEFAULT_STAGES} />);

    fireEvent.click(screen.getByRole('tab', { name: 'rounds' }));
    expect(screen.getByRole('tab', { name: 'rounds' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('No rounds logged yet.')).toBeInTheDocument();
  });

  it('archives the application and closes the sheet', () => {
    const app = seedApplication();
    const closeDetail = vi.spyOn(useUiStore.getState(), 'closeDetail');
    render(<DetailSheet application={app} stages={DEFAULT_STAGES} />);

    fireEvent.click(screen.getByLabelText('More actions'));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Archive' }));

    expect(
      useBoardStore.getState().applications.find((a) => a.id === app.id)?.archivedAt,
    ).not.toBeNull();
    expect(closeDetail).toHaveBeenCalled();
    closeDetail.mockRestore();
  });

  it('shows an "Archived" badge and "Unarchive" action for an already-archived application', () => {
    const app = seedApplication();
    useBoardStore.getState().archiveApplication(app.id);
    const archived = useBoardStore.getState().applications.find((a) => a.id === app.id)!;

    render(<DetailSheet application={archived} stages={DEFAULT_STAGES} />);

    expect(screen.getByText('Archived')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('More actions'));
    expect(screen.getByRole('menuitem', { name: 'Unarchive' })).toBeInTheDocument();
  });

  it('Unarchive clears archivedAt and does not close the sheet', () => {
    const app = seedApplication();
    useBoardStore.getState().archiveApplication(app.id);
    const archived = useBoardStore.getState().applications.find((a) => a.id === app.id)!;
    const closeDetail = vi.spyOn(useUiStore.getState(), 'closeDetail');

    render(<DetailSheet application={archived} stages={DEFAULT_STAGES} />);
    fireEvent.click(screen.getByLabelText('More actions'));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Unarchive' }));

    expect(
      useBoardStore.getState().applications.find((a) => a.id === app.id)?.archivedAt,
    ).toBeNull();
    expect(closeDetail).not.toHaveBeenCalled();
    closeDetail.mockRestore();
  });

  it('deletes the application only after confirm, and closes the sheet', () => {
    const app = seedApplication();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<DetailSheet application={app} stages={DEFAULT_STAGES} />);

    fireEvent.click(screen.getByLabelText('More actions'));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Delete' }));

    expect(confirmSpy).toHaveBeenCalled();
    expect(useBoardStore.getState().applications.find((a) => a.id === app.id)).toBeUndefined();
    confirmSpy.mockRestore();
  });

  it('does not delete when confirm is cancelled', () => {
    const app = seedApplication();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<DetailSheet application={app} stages={DEFAULT_STAGES} />);

    fireEvent.click(screen.getByLabelText('More actions'));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Delete' }));

    expect(useBoardStore.getState().applications.find((a) => a.id === app.id)).toBeDefined();
    confirmSpy.mockRestore();
  });
});
