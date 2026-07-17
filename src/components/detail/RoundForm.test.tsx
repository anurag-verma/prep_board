import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useQuestionStore } from '../../store/useQuestionStore';
import RoundForm from './RoundForm';

beforeEach(() => {
  useQuestionStore.setState({ questions: [] });
});

describe('RoundForm', () => {
  it('saves a new round with defaults when nothing is changed', () => {
    const onSave = vi.fn();
    render(<RoundForm applicationId="app-1" onSave={onSave} onCancel={vi.fn()} />);

    fireEvent.click(screen.getByText('Save round'));

    expect(onSave).toHaveBeenCalledTimes(1);
    const saved = onSave.mock.calls[0][0];
    expect(saved.type).toBe('technical');
    expect(saved.outcome).toBe('pending');
    expect(saved.questionIds).toEqual([]);
  });

  it('saves the selected type, outcome, interviewers, and duration', () => {
    const onSave = vi.fn();
    render(<RoundForm applicationId="app-1" onSave={onSave} onCancel={vi.fn()} />);

    fireEvent.change(screen.getByLabelText('Type'), { target: { value: 'phone_screen' } });
    fireEvent.change(screen.getByLabelText('Interviewer(s)'), { target: { value: 'Priya' } });
    fireEvent.change(screen.getByLabelText('Duration (minutes)'), { target: { value: '30' } });
    fireEvent.click(screen.getByRole('radio', { name: 'Passed' }));
    fireEvent.click(screen.getByText('Save round'));

    const saved = onSave.mock.calls[0][0];
    expect(saved.type).toBe('phone_screen');
    expect(saved.interviewers).toBe('Priya');
    expect(saved.durationMins).toBe(30);
    expect(saved.outcome).toBe('passed');
  });

  it('pre-fills fields from an existing round when editing', () => {
    const onSave = vi.fn();
    render(
      <RoundForm
        applicationId="app-1"
        round={{
          id: 'r1',
          type: 'hr',
          date: '2026-07-10',
          interviewers: 'Sam',
          durationMins: 45,
          outcome: 'failed',
          prepNotes: 'prep',
          reflectionNotes: 'reflect',
          questionIds: [],
        }}
        onSave={onSave}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByLabelText('Type')).toHaveValue('hr');
    expect(screen.getByLabelText('Interviewer(s)')).toHaveValue('Sam');
    expect(screen.getByRole('radio', { name: 'Failed' })).toHaveAttribute('aria-checked', 'true');
  });

  it('calls onCancel without saving', () => {
    const onSave = vi.fn();
    const onCancel = vi.fn();
    render(<RoundForm applicationId="app-1" onSave={onSave} onCancel={onCancel} />);

    fireEvent.click(screen.getByText('Cancel'));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onSave).not.toHaveBeenCalled();
  });

  it('shows a Delete button only when editing an existing round', () => {
    const { rerender } = render(
      <RoundForm applicationId="app-1" onSave={vi.fn()} onCancel={vi.fn()} />,
    );
    expect(screen.queryByText('Delete round')).not.toBeInTheDocument();

    rerender(
      <RoundForm
        applicationId="app-1"
        round={{
          id: 'r1',
          type: 'hr',
          date: '2026-07-10',
          outcome: 'pending',
          prepNotes: '',
          reflectionNotes: '',
          questionIds: [],
        }}
        onSave={vi.fn()}
        onCancel={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText('Delete round')).toBeInTheDocument();
  });

  it('saving a new question via "Save to bank" includes its id in questionIds', () => {
    const onSave = vi.fn();
    render(<RoundForm applicationId="app-1" onSave={onSave} onCancel={vi.fn()} />);

    fireEvent.click(screen.getByText('Add question'));
    fireEvent.change(screen.getByLabelText('Question text'), {
      target: { value: 'Reverse a linked list' },
    });
    fireEvent.click(screen.getByText('Save to bank ↗'));
    fireEvent.click(screen.getByText('Save round'));

    const saved = onSave.mock.calls[0][0];
    expect(saved.questionIds).toHaveLength(1);

    const question = useQuestionStore.getState().questions[0];
    expect(question.text).toBe('Reverse a linked list');
    expect(question.companyIds).toEqual(['app-1']);
  });
});
