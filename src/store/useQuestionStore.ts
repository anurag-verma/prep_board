import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { createId } from '../lib/id';
import { SCHEMA_VERSION } from '../lib/schema';
import type { Question } from '../types/models';
import { sharedStorage } from './persistStorage';

export interface QuestionInput {
  text: string;
  category: Question['category'];
  difficulty: Question['difficulty'];
  answerNotes?: string;
  confidence?: Question['confidence'];
  companyIds?: string[];
}

interface QuestionState {
  schemaVersion: number;
  questions: Question[];

  addQuestion: (input: QuestionInput) => Question;
  updateQuestion: (id: string, patch: Partial<Question>) => void;
  deleteQuestion: (id: string) => void;
  linkQuestionToApplication: (questionId: string, applicationId: string) => void;
  /** Referential integrity: strip a deleted application's id from every question. */
  removeCompanyId: (applicationId: string) => void;
}

export const useQuestionStore = create<QuestionState>()(
  persist(
    (set) => ({
      schemaVersion: SCHEMA_VERSION,
      questions: [],

      addQuestion: (input) => {
        const question: Question = {
          id: createId(),
          text: input.text,
          category: input.category,
          difficulty: input.difficulty,
          answerNotes: input.answerNotes ?? '',
          confidence: input.confidence ?? 3,
          companyIds: input.companyIds ?? [],
          createdAt: new Date().toISOString(),
          lastReviewedAt: null,
        };
        set((state) => ({ questions: [...state.questions, question] }));
        return question;
      },

      updateQuestion: (id, patch) => {
        set((state) => ({
          questions: state.questions.map((q) => (q.id === id ? { ...q, ...patch } : q)),
        }));
      },

      deleteQuestion: (id) => {
        set((state) => ({ questions: state.questions.filter((q) => q.id !== id) }));
      },

      linkQuestionToApplication: (questionId, applicationId) => {
        set((state) => ({
          questions: state.questions.map((q) =>
            q.id === questionId && !q.companyIds.includes(applicationId)
              ? { ...q, companyIds: [...q.companyIds, applicationId] }
              : q,
          ),
        }));
      },

      removeCompanyId: (applicationId) => {
        set((state) => ({
          questions: state.questions.map((q) =>
            q.companyIds.includes(applicationId)
              ? { ...q, companyIds: q.companyIds.filter((id) => id !== applicationId) }
              : q,
          ),
        }));
      },
    }),
    {
      name: 'questions',
      storage: createJSONStorage(() => sharedStorage),
      version: SCHEMA_VERSION,
    },
  ),
);
