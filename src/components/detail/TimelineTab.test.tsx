import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useBoardStore } from '../../store/useBoardStore';
import { DEFAULT_STAGES } from '../../types/models';
import TimelineTab from './TimelineTab';

beforeEach(() => {
  useBoardStore.setState({ stages: DEFAULT_STAGES, applications: [] });
});

function seedApplication() {
  return useBoardStore.getState().addApplication({ company: 'Acme Corp', role: 'Engineer' });
}

function currentApp(id: string) {
  return useBoardStore.getState().applications.find((a) => a.id === id)!;
}

describe('TimelineTab', () => {
  it('shows the created event with a mono timestamp', () => {
    const app = seedApplication();
    render(<TimelineTab application={app} />);

    expect(screen.getByText('Application created')).toBeInTheDocument();
  });

  it('lists events newest first', () => {
    const app = seedApplication();
    useBoardStore.getState().moveCard(app.id, 'interviewing');

    render(<TimelineTab application={currentApp(app.id)} />);

    const items = screen.getAllByRole('listitem');
    expect(items[0]).toHaveTextContent('Moved to Interviewing');
    expect(items[1]).toHaveTextContent('Application created');
  });

  it('stage moves (from drag/select) appear automatically', () => {
    const app = seedApplication();
    useBoardStore.getState().moveCard(app.id, 'oa');

    render(<TimelineTab application={currentApp(app.id)} />);

    expect(screen.getByText('Moved to OA')).toBeInTheDocument();
  });

  it('adds a manual note via the input and Enter key, newest first', () => {
    const app = seedApplication();
    const { rerender } = render(<TimelineTab application={app} />);

    const input = screen.getByLabelText('New note');
    fireEvent.change(input, { target: { value: 'Sent a follow-up email' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    const updated = currentApp(app.id);
    expect(updated.events.some((e) => e.label === 'Sent a follow-up email')).toBe(true);

    rerender(<TimelineTab application={updated} />);
    const items = screen.getAllByRole('listitem');
    expect(items[0]).toHaveTextContent('Sent a follow-up email');

    // input clears after submit
    expect(screen.getByLabelText('New note')).toHaveValue('');
  });

  it('adds a manual note via the button click', () => {
    const app = seedApplication();
    render(<TimelineTab application={app} />);

    fireEvent.change(screen.getByLabelText('New note'), { target: { value: 'Called recruiter' } });
    fireEvent.click(screen.getByText('Add note'));

    expect(currentApp(app.id).events.some((e) => e.label === 'Called recruiter')).toBe(true);
  });

  it('does not add an empty note', () => {
    const app = seedApplication();
    render(<TimelineTab application={app} />);

    expect(screen.getByText('Add note')).toBeDisabled();
    fireEvent.keyDown(screen.getByLabelText('New note'), { key: 'Enter' });

    expect(currentApp(app.id).events).toHaveLength(1); // just "created"
  });
});
