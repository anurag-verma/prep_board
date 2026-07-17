import { beforeEach, describe, expect, it } from 'vitest';
import { __resetStorageCacheForTests } from './persistStorage';
import { useQuestionStore } from './useQuestionStore';

beforeEach(() => {
  localStorage.clear();
  __resetStorageCacheForTests();
  useQuestionStore.setState({ questions: [] });
});

describe('useQuestionStore', () => {
  it('addQuestion fills in defaults for optional fields', () => {
    const q = useQuestionStore.getState().addQuestion({
      text: 'Two Sum',
      category: 'dsa',
      difficulty: 'easy',
    });

    expect(q.confidence).toBe(3);
    expect(q.companyIds).toEqual([]);
    expect(q.lastReviewedAt).toBeNull();
    expect(useQuestionStore.getState().questions).toHaveLength(1);
  });

  it('updateQuestion merges a patch', () => {
    const q = useQuestionStore
      .getState()
      .addQuestion({ text: 'Two Sum', category: 'dsa', difficulty: 'easy' });

    useQuestionStore.getState().updateQuestion(q.id, { confidence: 5 });

    expect(useQuestionStore.getState().questions.find((x) => x.id === q.id)?.confidence).toBe(5);
  });

  it('deleteQuestion removes it', () => {
    const q = useQuestionStore
      .getState()
      .addQuestion({ text: 'Two Sum', category: 'dsa', difficulty: 'easy' });

    useQuestionStore.getState().deleteQuestion(q.id);

    expect(useQuestionStore.getState().questions).toHaveLength(0);
  });

  it('linkQuestionToApplication adds a companyId without duplicating', () => {
    const q = useQuestionStore
      .getState()
      .addQuestion({ text: 'Two Sum', category: 'dsa', difficulty: 'easy' });

    useQuestionStore.getState().linkQuestionToApplication(q.id, 'app-1');
    useQuestionStore.getState().linkQuestionToApplication(q.id, 'app-1');

    expect(useQuestionStore.getState().questions.find((x) => x.id === q.id)?.companyIds).toEqual([
      'app-1',
    ]);
  });

  it('removeCompanyId strips an id from every question that has it', () => {
    const q1 = useQuestionStore
      .getState()
      .addQuestion({ text: 'Q1', category: 'dsa', difficulty: 'easy', companyIds: ['app-1'] });
    const q2 = useQuestionStore.getState().addQuestion({
      text: 'Q2',
      category: 'behavioral',
      difficulty: 'medium',
      companyIds: ['app-1', 'app-2'],
    });

    useQuestionStore.getState().removeCompanyId('app-1');

    const questions = useQuestionStore.getState().questions;
    expect(questions.find((q) => q.id === q1.id)?.companyIds).toEqual([]);
    expect(questions.find((q) => q.id === q2.id)?.companyIds).toEqual(['app-2']);
  });
});
