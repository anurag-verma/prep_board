import type { ConfidenceRating, Question, QuestionCategory, QuestionDifficulty } from '../types/models';

export interface QuestionFilters {
  searchText: string;
  category: QuestionCategory | '';
  difficulty: QuestionDifficulty | '';
  companyId: string | '';
  maxConfidence: ConfidenceRating | '';
}

export const NO_QUESTION_FILTERS: QuestionFilters = {
  searchText: '',
  category: '',
  difficulty: '',
  companyId: '',
  maxConfidence: '',
};

/** Combines search text, category, difficulty, company, and a confidence
 * ceiling with AND semantics. */
export function matchesQuestionFilters(question: Question, filters: QuestionFilters): boolean {
  if (filters.category && question.category !== filters.category) return false;
  if (filters.difficulty && question.difficulty !== filters.difficulty) return false;
  if (filters.companyId && !question.companyIds.includes(filters.companyId)) return false;
  if (filters.maxConfidence && question.confidence > filters.maxConfidence) return false;

  const query = filters.searchText.trim().toLowerCase();
  if (query && !question.text.toLowerCase().includes(query)) return false;

  return true;
}
