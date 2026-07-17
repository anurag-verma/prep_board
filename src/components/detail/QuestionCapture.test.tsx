import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useQuestionStore } from '../../store/useQuestionStore';
import QuestionCapture from './QuestionCapture';

beforeEach(() => {
  useQuestionStore.setState({ questions: [] });
});

describe('QuestionCapture', () => {
  it('creates a new bank question with one click and shows it as a linked chip', () => {
    const onChange = vi.fn();
    render(<QuestionCapture applicationId="app-1" questionIds={[]} onChange={onChange} />);

    fireEvent.click(screen.getByText('Add question'));
    fireEvent.change(screen.getByLabelText('Question text'), {
      target: { value: 'Two Sum' },
    });
    fireEvent.click(screen.getByText('Save to bank ↗'));

    expect(useQuestionStore.getState().questions).toHaveLength(1);
    const question = useQuestionStore.getState().questions[0];
    expect(question.text).toBe('Two Sum');
    expect(question.companyIds).toEqual(['app-1']);
    expect(onChange).toHaveBeenCalledWith([question.id]);
  });

  it('does not save an empty question row', () => {
    render(<QuestionCapture applicationId="app-1" questionIds={[]} onChange={vi.fn()} />);

    fireEvent.click(screen.getByText('Add question'));
    expect(screen.getByText('Save to bank ↗')).toBeDisabled();
  });

  it('shows an existing question as a typeahead suggestion and links it instead of duplicating', () => {
    const existing = useQuestionStore.getState().addQuestion({
      text: 'Reverse a linked list',
      category: 'dsa',
      difficulty: 'medium',
      companyIds: ['app-1'],
    });

    const onChange = vi.fn();
    render(<QuestionCapture applicationId="app-2" questionIds={[]} onChange={onChange} />);

    fireEvent.click(screen.getByText('Add question'));
    fireEvent.change(screen.getByLabelText('Question text'), {
      target: { value: 'reverse a linked' },
    });

    fireEvent.click(screen.getByText(`Link existing: ${existing.text}`));

    // still just one bank entry, now tagged with both companies
    expect(useQuestionStore.getState().questions).toHaveLength(1);
    expect(useQuestionStore.getState().questions[0].companyIds.sort()).toEqual([
      'app-1',
      'app-2',
    ]);
    expect(onChange).toHaveBeenCalledWith([existing.id]);
  });

  it('renders linked questions as chips with category and difficulty', () => {
    const question = useQuestionStore.getState().addQuestion({
      text: 'Design a URL shortener',
      category: 'system_design',
      difficulty: 'hard',
      companyIds: ['app-1'],
    });

    render(
      <QuestionCapture applicationId="app-1" questionIds={[question.id]} onChange={vi.fn()} />,
    );

    expect(screen.getByText('Design a URL shortener')).toBeInTheDocument();
    expect(screen.getByText('System Design')).toBeInTheDocument();
    expect(screen.getByText('Hard')).toBeInTheDocument();
  });

  it('unlinking a chip removes it from questionIds without deleting the bank question', () => {
    const question = useQuestionStore.getState().addQuestion({
      text: 'Two Sum',
      category: 'dsa',
      difficulty: 'easy',
      companyIds: ['app-1'],
    });

    const onChange = vi.fn();
    render(
      <QuestionCapture applicationId="app-1" questionIds={[question.id]} onChange={onChange} />,
    );

    fireEvent.click(screen.getByLabelText(`Unlink question ${question.text}`));

    expect(onChange).toHaveBeenCalledWith([]);
    expect(useQuestionStore.getState().questions).toHaveLength(1);
  });
});
