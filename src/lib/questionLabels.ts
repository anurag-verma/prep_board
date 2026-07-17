import type { QuestionCategory, QuestionDifficulty } from '../types/models';

export const CATEGORY_LABELS: Record<QuestionCategory, string> = {
  dsa: 'DSA',
  system_design: 'System Design',
  behavioral: 'Behavioral',
  sql: 'SQL',
  domain: 'Domain',
  other: 'Other',
};

export const DIFFICULTY_LABELS: Record<QuestionDifficulty, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
};

export const QUESTION_CATEGORIES: QuestionCategory[] = [
  'dsa',
  'system_design',
  'behavioral',
  'sql',
  'domain',
  'other',
];

export const QUESTION_DIFFICULTIES: QuestionDifficulty[] = ['easy', 'medium', 'hard'];
