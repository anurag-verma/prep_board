import { describe, expect, it } from 'vitest';
import { makeQuestion } from '../test/fixtures';
import { MAX_IMPORT_BYTES, parseAndValidateQuestionBank, validateQuestionBank } from './questionBankSchema';

function bankOf(questions: ReturnType<typeof makeQuestion>[]) {
  return { schemaVersion: 1, questions };
}

describe('parseAndValidateQuestionBank — round-trip', () => {
  it('round-trips a bank export losslessly', () => {
    const original = bankOf([
      makeQuestion({ id: 'q1', text: 'Reverse a linked list' }),
      makeQuestion({ id: 'q2', text: 'Design a URL shortener', category: 'system_design' }),
    ]);

    const result = parseAndValidateQuestionBank(JSON.stringify(original));

    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.data).toEqual(original);
    }
  });

  it('round-trips an empty bank', () => {
    const result = parseAndValidateQuestionBank(JSON.stringify(bankOf([])));
    expect(result.valid).toBe(true);
    if (result.valid) expect(result.data.questions).toEqual([]);
  });
});

describe('parseAndValidateQuestionBank — hostile input', () => {
  it('rejects malformed JSON without throwing', () => {
    expect(() => parseAndValidateQuestionBank('{ nope')).not.toThrow();
    expect(parseAndValidateQuestionBank('{ nope').valid).toBe(false);
  });

  it('rejects a file over the size limit', () => {
    const huge = JSON.stringify(bankOf([])) + ' '.repeat(MAX_IMPORT_BYTES + 1);
    const result = parseAndValidateQuestionBank(huge);
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.errors[0]).toMatch(/too large/i);
  });

  it('rejects non-object roots', () => {
    for (const raw of ['[]', '"x"', '42', 'null']) {
      expect(parseAndValidateQuestionBank(raw).valid).toBe(false);
    }
  });

  it('rejects a wrong schemaVersion', () => {
    const result = validateQuestionBank({ ...bankOf([]), schemaVersion: 999 });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.errors.some((e) => /schemaVersion/.test(e))).toBe(true);
  });

  it('rejects when questions is missing or not an array', () => {
    expect(validateQuestionBank({ schemaVersion: 1 }).valid).toBe(false);
    expect(validateQuestionBank({ schemaVersion: 1, questions: 'nope' }).valid).toBe(false);
  });

  it('rejects an invalid category/difficulty enum with a specific reason', () => {
    const bad = bankOf([makeQuestion({ category: 'trivia' as never })]);
    const result = validateQuestionBank(bad);
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.errors.some((e) => /category/.test(e))).toBe(true);
  });

  it('rejects an out-of-range confidence value', () => {
    const bad = bankOf([makeQuestion({ confidence: 7 as never })]);
    const result = validateQuestionBank(bad);
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.errors.some((e) => /confidence/.test(e))).toBe(true);
  });

  it('strips unknown keys rather than carrying them through', () => {
    const withPollution = {
      schemaVersion: 1,
      questions: [{ ...makeQuestion(), evilKey: 'nope' }],
    };
    const result = validateQuestionBank(withPollution);
    expect(result.valid).toBe(true);
    if (result.valid) expect(result.data.questions[0]).not.toHaveProperty('evilKey');
  });
});
