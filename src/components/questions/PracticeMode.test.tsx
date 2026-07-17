import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useBoardStore } from '../../store/useBoardStore';
import { useQuestionStore } from '../../store/useQuestionStore';
import { DEFAULT_STAGES } from '../../types/models';
import PracticeMode from './PracticeMode';

beforeEach(() => {
  useBoardStore.setState({ stages: DEFAULT_STAGES, applications: [] });
  useQuestionStore.setState({ questions: [] });
});

function seedQuestions(n: number) {
  return Array.from({ length: n }, (_, i) =>
    useQuestionStore.getState().addQuestion({
      text: `Question ${i}`,
      category: 'dsa',
      difficulty: 'easy',
      answerNotes: `Answer ${i}`,
    }),
  );
}

describe('PracticeMode', () => {
  it('shows the session-length picker first, with the filtered count', () => {
    const questions = seedQuestions(3);
    render(<PracticeMode questions={questions} onExit={vi.fn()} />);

    expect(screen.getByText('3 questions match your current filters.')).toBeInTheDocument();
    expect(screen.getByText('All (3)')).toBeInTheDocument();
  });

  it('starting a session shows the question front, not the answer', () => {
    const questions = seedQuestions(2);
    render(<PracticeMode questions={questions} onExit={vi.fn()} />);

    fireEvent.click(screen.getByText('All (2)'));

    expect(screen.getByText(/Press Space or click to flip/)).toBeInTheDocument();
    expect(screen.queryByText('Answer 0')).not.toBeInTheDocument();
  });

  it('flips to show the answer on click, and shows the confidence prompt', () => {
    const questions = seedQuestions(1);
    render(<PracticeMode questions={questions} onExit={vi.fn()} />);

    fireEvent.click(screen.getByText('All (1)'));
    fireEvent.click(screen.getByText(questions[0].text));

    expect(screen.getByText('Answer 0')).toBeInTheDocument();
    expect(screen.getByText('How confident?')).toBeInTheDocument();
  });

  it('flips via the Space key (keyboard-only session)', () => {
    const questions = seedQuestions(1);
    render(<PracticeMode questions={questions} onExit={vi.fn()} />);

    fireEvent.click(screen.getByText('All (1)'));
    fireEvent.keyDown(document, { key: ' ' });

    expect(screen.getByText('Answer 0')).toBeInTheDocument();
  });

  it('rating via number keys updates confidence and advances to the next card', () => {
    // Both seeded questions share the same confidence, so which one the
    // weighted shuffle deals first is genuinely random — assert on "exactly
    // one was rated," not on a specific question by insertion order.
    const questions = seedQuestions(2);
    render(<PracticeMode questions={questions} onExit={vi.fn()} />);

    fireEvent.click(screen.getByText('All (2)'));
    fireEvent.keyDown(document, { key: ' ' });
    fireEvent.keyDown(document, { key: '5' });

    const updated = useQuestionStore.getState().questions;
    const rated = updated.filter((q) => q.confidence === 5);
    expect(rated).toHaveLength(1);
    expect(rated[0].lastReviewedAt).not.toBeNull();
    expect(updated.find((q) => q.id !== rated[0].id)!.lastReviewedAt).toBeNull();

    // advanced to card 2, back to the front face
    expect(screen.getByText(/Press Space or click to flip/)).toBeInTheDocument();
  });

  it('rating the last card shows the session summary', () => {
    const questions = seedQuestions(1);
    render(<PracticeMode questions={questions} onExit={vi.fn()} />);

    fireEvent.click(screen.getByText('All (1)'));
    fireEvent.keyDown(document, { key: ' ' });
    fireEvent.click(screen.getByRole('button', { name: '4' }));

    expect(screen.getByText(/reviewed · avg confidence/)).toBeInTheDocument();
  });

  it('Esc exits at any phase', () => {
    const onExit = vi.fn();
    const questions = seedQuestions(1);
    render(<PracticeMode questions={questions} onExit={onExit} />);

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onExit).toHaveBeenCalledTimes(1);
  });

  it('disables session-length buttons when there are no questions', () => {
    render(<PracticeMode questions={[]} onExit={vi.fn()} />);
    expect(screen.getByText('All (0)').closest('button')).toBeDisabled();
  });
});
