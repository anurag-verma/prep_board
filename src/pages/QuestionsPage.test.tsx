import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useBoardStore } from '../store/useBoardStore';
import { useQuestionStore } from '../store/useQuestionStore';
import { DEFAULT_STAGES } from '../types/models';
import QuestionsPage from './QuestionsPage';

beforeEach(() => {
  useBoardStore.setState({ stages: DEFAULT_STAGES, applications: [] });
  useQuestionStore.setState({ questions: [] });
});

describe('QuestionsPage', () => {
  it('shows an empty state when there are no questions', () => {
    render(<QuestionsPage />);
    expect(screen.getByText(/No questions yet/)).toBeInTheDocument();
  });

  it('lists questions and resolves company chips to names', () => {
    const app = useBoardStore.getState().addApplication({ company: 'Acme Corp', role: 'Eng' });
    useQuestionStore.getState().addQuestion({
      text: 'Reverse a linked list',
      category: 'dsa',
      difficulty: 'medium',
      companyIds: [app.id],
    });

    render(<QuestionsPage />);

    const row = screen.getByText('Reverse a linked list').closest('button')!;
    expect(within(row).getByText('Acme Corp')).toBeInTheDocument();
  });

  it('shows "(archived)" for a companyId whose application was deleted', () => {
    useQuestionStore.getState().addQuestion({
      text: 'Design a URL shortener',
      category: 'system_design',
      difficulty: 'hard',
      companyIds: ['deleted-app-id'],
    });

    render(<QuestionsPage />);

    expect(screen.getByText('(archived)')).toBeInTheDocument();
  });

  it('filters combine: category + search text', () => {
    useQuestionStore.getState().addQuestion({
      text: 'Reverse a linked list',
      category: 'dsa',
      difficulty: 'medium',
    });
    useQuestionStore.getState().addQuestion({
      text: 'Design a URL shortener',
      category: 'system_design',
      difficulty: 'hard',
    });

    render(<QuestionsPage />);

    fireEvent.change(screen.getByLabelText('Filter by category'), {
      target: { value: 'system_design' },
    });
    expect(screen.queryByText('Reverse a linked list')).not.toBeInTheDocument();
    expect(screen.getByText('Design a URL shortener')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Search questions'), {
      target: { value: 'linked list' },
    });
    expect(screen.queryByText('Design a URL shortener')).not.toBeInTheDocument();
    expect(screen.getByText('No questions match these filters.')).toBeInTheDocument();
  });

  it('opens the editor sheet on row click and edits persist', () => {
    useQuestionStore.getState().addQuestion({
      text: 'Two Sum',
      category: 'dsa',
      difficulty: 'easy',
    });

    render(<QuestionsPage />);
    fireEvent.click(screen.getByText('Two Sum'));

    expect(screen.getByRole('dialog', { name: 'Edit question' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('radio', { name: '5' }));

    const updated = useQuestionStore.getState().questions[0];
    expect(updated.confidence).toBe(5);
  });

  it('"+ Add question" creates a standalone question with no companyIds', () => {
    render(<QuestionsPage />);

    fireEvent.click(screen.getByRole('button', { name: /Add question/ }));
    expect(screen.getByRole('dialog', { name: 'Add question' })).toBeInTheDocument();

    fireEvent.change(screen.getByRole('textbox', { name: 'Question' }), {
      target: { value: 'What is a closure?' },
    });
    fireEvent.click(screen.getByText('Save question'));

    const questions = useQuestionStore.getState().questions;
    expect(questions).toHaveLength(1);
    expect(questions[0].text).toBe('What is a closure?');
    expect(questions[0].companyIds).toEqual([]);
  });

  it('does not create a question with blank text', () => {
    render(<QuestionsPage />);
    fireEvent.click(screen.getByRole('button', { name: /Add question/ }));
    expect(screen.getByText('Save question')).toBeDisabled();
  });
});
