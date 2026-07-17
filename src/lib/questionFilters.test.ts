import { describe, expect, it } from 'vitest';
import { makeQuestion } from '../test/fixtures';
import { matchesQuestionFilters, NO_QUESTION_FILTERS } from './questionFilters';

describe('matchesQuestionFilters', () => {
  it('matches everything when no filters are active', () => {
    expect(matchesQuestionFilters(makeQuestion(), NO_QUESTION_FILTERS)).toBe(true);
  });

  it('matches search text against question text (case-insensitive)', () => {
    const q = makeQuestion({ text: 'Reverse a linked list' });
    expect(matchesQuestionFilters(q, { ...NO_QUESTION_FILTERS, searchText: 'linked' })).toBe(true);
    expect(matchesQuestionFilters(q, { ...NO_QUESTION_FILTERS, searchText: 'graph' })).toBe(false);
  });

  it('filters by category', () => {
    const q = makeQuestion({ category: 'sql' });
    expect(matchesQuestionFilters(q, { ...NO_QUESTION_FILTERS, category: 'sql' })).toBe(true);
    expect(matchesQuestionFilters(q, { ...NO_QUESTION_FILTERS, category: 'dsa' })).toBe(false);
  });

  it('filters by difficulty', () => {
    const q = makeQuestion({ difficulty: 'hard' });
    expect(matchesQuestionFilters(q, { ...NO_QUESTION_FILTERS, difficulty: 'hard' })).toBe(true);
    expect(matchesQuestionFilters(q, { ...NO_QUESTION_FILTERS, difficulty: 'easy' })).toBe(false);
  });

  it('filters by company id (membership in companyIds)', () => {
    const q = makeQuestion({ companyIds: ['app-1', 'app-2'] });
    expect(matchesQuestionFilters(q, { ...NO_QUESTION_FILTERS, companyId: 'app-1' })).toBe(true);
    expect(matchesQuestionFilters(q, { ...NO_QUESTION_FILTERS, companyId: 'app-3' })).toBe(false);
  });

  it('filters by a confidence ceiling (confidence <= maxConfidence)', () => {
    const q = makeQuestion({ confidence: 3 });
    expect(matchesQuestionFilters(q, { ...NO_QUESTION_FILTERS, maxConfidence: 3 })).toBe(true);
    expect(matchesQuestionFilters(q, { ...NO_QUESTION_FILTERS, maxConfidence: 4 })).toBe(true);
    expect(matchesQuestionFilters(q, { ...NO_QUESTION_FILTERS, maxConfidence: 2 })).toBe(false);
  });

  it('combines all filters with AND semantics', () => {
    const q = makeQuestion({
      text: 'Reverse a linked list',
      category: 'dsa',
      difficulty: 'medium',
      companyIds: ['app-1'],
      confidence: 2,
    });

    expect(
      matchesQuestionFilters(q, {
        searchText: 'linked',
        category: 'dsa',
        difficulty: 'medium',
        companyId: 'app-1',
        maxConfidence: 3,
      }),
    ).toBe(true);

    expect(
      matchesQuestionFilters(q, {
        searchText: 'linked',
        category: 'sql', // mismatched
        difficulty: 'medium',
        companyId: 'app-1',
        maxConfidence: 3,
      }),
    ).toBe(false);
  });
});
