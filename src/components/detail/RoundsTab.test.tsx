import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useBoardStore } from '../../store/useBoardStore';
import { DEFAULT_STAGES } from '../../types/models';
import DetailSheet from './DetailSheet';

beforeEach(() => {
  useBoardStore.setState({ stages: DEFAULT_STAGES, applications: [] });
});

function seedApplication() {
  return useBoardStore.getState().addApplication({ company: 'Acme Corp', role: 'Engineer' });
}

function currentApp(id: string) {
  return useBoardStore.getState().applications.find((a) => a.id === id)!;
}

// Rendered via DetailSheet (not RoundsTab standalone) so re-renders pick up
// fresh application props from the store after each store mutation, same
// caveat noted for ApplicationForm in PB-021.
function renderRoundsTab(applicationId: string) {
  const utils = render(
    <DetailSheet application={currentApp(applicationId)} stages={DEFAULT_STAGES} />,
  );
  fireEvent.click(screen.getByRole('tab', { name: 'rounds' }));
  return utils;
}

describe('RoundsTab (via DetailSheet)', () => {
  it('shows an empty state and an Add round button when there are no rounds', () => {
    const app = seedApplication();
    renderRoundsTab(app.id);

    expect(screen.getByText('No rounds logged yet.')).toBeInTheDocument();
    expect(screen.getByText('Add round')).toBeInTheDocument();
  });

  it('adding a round logs a round_added event and shows it in the list', () => {
    const app = seedApplication();
    const { rerender } = renderRoundsTab(app.id);

    fireEvent.click(screen.getByText('Add round'));
    fireEvent.change(screen.getByLabelText('Type'), { target: { value: 'phone_screen' } });
    fireEvent.click(screen.getByText('Save round'));

    const updated = currentApp(app.id);
    expect(updated.rounds).toHaveLength(1);
    expect(updated.events.some((e) => e.type === 'round_added')).toBe(true);

    rerender(<DetailSheet application={updated} stages={DEFAULT_STAGES} />);
    expect(screen.getByText('Phone Screen')).toBeInTheDocument();
  });

  it('clicking an existing round opens it for editing, and saving updates it', () => {
    const app = seedApplication();
    useBoardStore.getState().addRound(app.id, {
      type: 'technical',
      date: '2026-07-16',
      outcome: 'pending',
      prepNotes: '',
      reflectionNotes: '',
      questionIds: [],
    });
    const { rerender } = renderRoundsTab(app.id);
    rerender(<DetailSheet application={currentApp(app.id)} stages={DEFAULT_STAGES} />);
    fireEvent.click(screen.getByRole('tab', { name: 'rounds' }));

    fireEvent.click(screen.getByText('Technical'));
    fireEvent.click(screen.getByRole('radio', { name: 'Passed' }));
    fireEvent.click(screen.getByText('Save round'));

    expect(currentApp(app.id).rounds[0].outcome).toBe('passed');
  });

  it('deletes a round from the edit form', () => {
    const app = seedApplication();
    const round = useBoardStore.getState().addRound(app.id, {
      type: 'technical',
      date: '2026-07-16',
      outcome: 'pending',
      prepNotes: '',
      reflectionNotes: '',
      questionIds: [],
    });
    const { rerender } = renderRoundsTab(app.id);
    rerender(<DetailSheet application={currentApp(app.id)} stages={DEFAULT_STAGES} />);
    fireEvent.click(screen.getByRole('tab', { name: 'rounds' }));

    fireEvent.click(screen.getByText('Technical'));
    fireEvent.click(screen.getByText('Delete round'));

    expect(currentApp(app.id).rounds.find((r) => r.id === round.id)).toBeUndefined();
  });

  it('cancelling the new-round form discards it without saving', () => {
    const app = seedApplication();
    renderRoundsTab(app.id);

    fireEvent.click(screen.getByText('Add round'));
    fireEvent.click(screen.getByText('Cancel'));

    expect(currentApp(app.id).rounds).toHaveLength(0);
    expect(screen.getByText('Add round')).toBeInTheDocument();
  });
});
