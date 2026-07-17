import { isPlainObject, validateQuestion } from './appDataSchema';
import { SCHEMA_VERSION } from './schema';
import type { Question } from '../types/models';

export const MAX_IMPORT_BYTES = 2 * 1024 * 1024; // 2 MB, same ceiling as the full export

export interface QuestionBankData {
  schemaVersion: number;
  questions: Question[];
}

export type QuestionBankValidationResult =
  | { valid: true; data: QuestionBankData }
  | { valid: false; errors: string[] };

/** Parses and validates a bank-only JSON export: `{ schemaVersion, questions }`.
 * Reuses the same per-question validation as the full AppData import (PB-050) —
 * type-checked fields, enum checks, confidence 1–5 — but scoped to just the
 * question bank, with no stage/application referential checks to make. */
export function parseAndValidateQuestionBank(raw: string): QuestionBankValidationResult {
  if (raw.length > MAX_IMPORT_BYTES) {
    return {
      valid: false,
      errors: [`File is too large (max ${MAX_IMPORT_BYTES / (1024 * 1024)} MB).`],
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { valid: false, errors: ['File is not valid JSON.'] };
  }

  return validateQuestionBank(parsed);
}

export function validateQuestionBank(parsed: unknown): QuestionBankValidationResult {
  if (!isPlainObject(parsed)) {
    return { valid: false, errors: ['Root value must be an object.'] };
  }

  const errors: string[] = [];

  if (parsed.schemaVersion !== SCHEMA_VERSION) {
    errors.push(
      `Unsupported schemaVersion (expected ${SCHEMA_VERSION}, got ${JSON.stringify(parsed.schemaVersion)}).`,
    );
  }
  if (!Array.isArray(parsed.questions)) {
    errors.push('questions must be an array.');
  }
  if (errors.length > 0) {
    return { valid: false, errors };
  }

  const questions: Question[] = [];
  (parsed.questions as unknown[]).forEach((raw, i) => {
    const question = validateQuestion(raw, `questions[${i}]`, errors);
    if (question) questions.push(question);
  });

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true, data: { schemaVersion: SCHEMA_VERSION, questions } };
}
