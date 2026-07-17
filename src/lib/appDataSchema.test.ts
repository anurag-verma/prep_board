import { describe, expect, it } from 'vitest';
import { makeAppData, makeApplication, makeQuestion, makeRound, makeStage } from '../test/fixtures';
import { DEFAULT_STAGES } from '../types/models';
import { MAX_IMPORT_BYTES, parseAndValidateAppData, validateAppData } from './appDataSchema';

function valid() {
  const question = makeQuestion({ id: 'q1' });
  const round = makeRound({ questionIds: ['q1'] });
  const app = makeApplication({ stageId: DEFAULT_STAGES[0].id, rounds: [round] });
  return makeAppData({ applications: [app], questions: [question] });
}

describe('parseAndValidateAppData — happy path', () => {
  it('accepts a well-formed export round-trip', () => {
    const data = valid();
    const result = parseAndValidateAppData(JSON.stringify(data));
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.data.applications).toHaveLength(1);
      expect(result.data.questions).toHaveLength(1);
    }
  });
});

describe('parseAndValidateAppData — hostile / malformed input', () => {
  it('rejects malformed JSON without throwing', () => {
    expect(() => parseAndValidateAppData('{ not valid json')).not.toThrow();
    const result = parseAndValidateAppData('{ not valid json');
    expect(result.valid).toBe(false);
  });

  it('rejects a file over the size limit', () => {
    const huge = JSON.stringify(valid()) + ' '.repeat(MAX_IMPORT_BYTES + 1);
    const result = parseAndValidateAppData(huge);
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.errors[0]).toMatch(/too large/i);
  });

  it('rejects non-object root values (array, string, number, null)', () => {
    for (const raw of ['[]', '"hello"', '42', 'null']) {
      const result = parseAndValidateAppData(raw);
      expect(result.valid).toBe(false);
    }
  });

  it('rejects a wrong schemaVersion', () => {
    const data = { ...valid(), schemaVersion: 999 };
    const result = validateAppData(data);
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.errors.some((e) => /schemaVersion/.test(e))).toBe(true);
  });

  it('rejects when stages/applications/questions are missing or wrong type', () => {
    const result = validateAppData({ schemaVersion: 1, stages: 'nope', applications: [], questions: [] });
    expect(result.valid).toBe(false);
  });

  it('rejects fewer than 2 stages', () => {
    const data = makeAppData({ stages: [makeStage()] });
    const result = validateAppData(data);
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.errors.some((e) => /between 2 and 8/.test(e))).toBe(true);
  });

  it('rejects more than 8 stages', () => {
    const stages = Array.from({ length: 9 }, (_, i) => makeStage({ id: `s${i}` }));
    const data = makeAppData({ stages });
    const result = validateAppData(data);
    expect(result.valid).toBe(false);
  });

  it('rejects duplicate stage ids', () => {
    const stages = [makeStage({ id: 'dup' }), makeStage({ id: 'dup' })];
    const result = validateAppData(makeAppData({ stages }));
    expect(result.valid).toBe(false);
  });

  it('rejects an application with an invalid enum for remote', () => {
    const app = makeApplication({ remote: 'from-space' as never });
    const result = validateAppData(makeAppData({ applications: [app] }));
    expect(result.valid).toBe(false);
  });

  it('rejects an application whose stageId does not exist (referential integrity)', () => {
    const app = makeApplication({ stageId: 'no-such-stage' });
    const result = validateAppData(makeAppData({ applications: [app] }));
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.errors.some((e) => /unknown stage/.test(e))).toBe(true);
  });

  it('rejects a round whose questionIds reference a question that does not exist', () => {
    const round = makeRound({ questionIds: ['ghost-question'] });
    const app = makeApplication({ rounds: [round] });
    const result = validateAppData(makeAppData({ applications: [app] }));
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.errors.some((e) => /unknown question/.test(e))).toBe(true);
  });

  it('rejects a round with an invalid type or outcome enum', () => {
    const badType = makeApplication({ rounds: [makeRound({ type: 'astrology' as never })] });
    expect(validateAppData(makeAppData({ applications: [badType] })).valid).toBe(false);

    const badOutcome = makeApplication({ rounds: [makeRound({ outcome: 'maybe' as never })] });
    expect(validateAppData(makeAppData({ applications: [badOutcome] })).valid).toBe(false);
  });

  it('rejects a question with an invalid category or difficulty enum', () => {
    const badCategory = makeQuestion({ category: 'trivia' as never });
    expect(validateAppData(makeAppData({ questions: [badCategory] })).valid).toBe(false);

    const badDifficulty = makeQuestion({ difficulty: 'nightmare' as never });
    expect(validateAppData(makeAppData({ questions: [badDifficulty] })).valid).toBe(false);
  });

  it('rejects a question with an out-of-range confidence value', () => {
    for (const confidence of [0, 6, -1, 3.5, 'high']) {
      const q = makeQuestion({ confidence: confidence as never });
      const result = validateAppData(makeAppData({ questions: [q] }));
      expect(result.valid).toBe(false);
    }
  });

  it('does NOT reject a question whose companyIds reference a nonexistent application (soft reference)', () => {
    const q = makeQuestion({ companyIds: ['some-deleted-app'] });
    const result = validateAppData(makeAppData({ questions: [q] }));
    expect(result.valid).toBe(true);
  });

  it('strips unknown keys rather than carrying them into the app', () => {
    const data = valid();
    const withPollution = {
      ...data,
      extraTopLevelKey: 'should be stripped',
      stages: data.stages.map((s) => ({ ...s, evilKey: 'nope' })),
    };
    const result = validateAppData(withPollution);
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.data).not.toHaveProperty('extraTopLevelKey');
      expect(result.data.stages[0]).not.toHaveProperty('evilKey');
    }
  });

  it('rejects (or at least strips) a __proto__-shaped key without polluting Object.prototype', () => {
    const raw = `{"schemaVersion":1,"stages":${JSON.stringify(DEFAULT_STAGES)},"applications":[],"questions":[],"__proto__":{"polluted":true}}`;
    const result = parseAndValidateAppData(raw);
    expect(result.valid).toBe(true);
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });

  it('rejects wrong types for boolean/string fields', () => {
    const app = makeApplication({ priority: 'yes' as never });
    expect(validateAppData(makeAppData({ applications: [app] })).valid).toBe(false);
  });

  it('rejects non-array tags', () => {
    const app = makeApplication({ tags: 'frontend,remote' as never });
    expect(validateAppData(makeAppData({ applications: [app] })).valid).toBe(false);
  });

  it('collects multiple errors at once rather than stopping at the first', () => {
    const app1 = makeApplication({ stageId: 'ghost-1' });
    const app2 = makeApplication({ priority: 'nope' as never });
    const result = validateAppData(makeAppData({ applications: [app1, app2] }));
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.errors.length).toBeGreaterThanOrEqual(2);
  });
});
