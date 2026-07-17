import { describe, expect, it } from 'vitest';
import { makeAppData, makeApplication, makeQuestion, makeStage } from '../test/fixtures';
import { mergeAppData } from './appDataMerge';

describe('mergeAppData', () => {
  it('adds genuinely new applications/questions/stages', () => {
    const current = makeAppData({ applications: [makeApplication({ id: 'a1' })] });
    const incoming = makeAppData({ applications: [makeApplication({ id: 'a2' })] });

    const merged = mergeAppData(current, incoming);

    expect(merged.applications.map((a) => a.id).sort()).toEqual(['a1', 'a2']);
  });

  it('does not duplicate when the same id appears in both (re-importing the same export)', () => {
    const app = makeApplication({ id: 'a1', company: 'Acme' });
    const current = makeAppData({ applications: [app] });
    const incoming = makeAppData({ applications: [app] });

    const merged = mergeAppData(current, incoming);

    expect(merged.applications).toHaveLength(1);
  });

  it('merging the same export twice is idempotent', () => {
    const current = makeAppData({
      applications: [makeApplication({ id: 'a1' })],
      questions: [makeQuestion({ id: 'q1' })],
    });
    const incoming = makeAppData({
      applications: [makeApplication({ id: 'a1' })],
      questions: [makeQuestion({ id: 'q1' })],
    });

    const merged1 = mergeAppData(current, incoming);
    const merged2 = mergeAppData(merged1, incoming);

    expect(merged2.applications).toHaveLength(1);
    expect(merged2.questions).toHaveLength(1);
  });

  it('keeps the existing record on an id collision rather than overwriting it', () => {
    const current = makeAppData({
      applications: [makeApplication({ id: 'a1', company: 'Original Co' })],
    });
    const incoming = makeAppData({
      applications: [makeApplication({ id: 'a1', company: 'Imported Co' })],
    });

    const merged = mergeAppData(current, incoming);

    expect(merged.applications[0].company).toBe('Original Co');
  });

  it('merges stages by id too (default stages in both files do not duplicate)', () => {
    const current = makeAppData(); // DEFAULT_STAGES (6)
    const incoming = makeAppData(); // same DEFAULT_STAGES

    const merged = mergeAppData(current, incoming);

    expect(merged.stages).toHaveLength(6);
  });

  it('adds a genuinely new custom stage without touching existing ones', () => {
    const current = makeAppData();
    const incoming = makeAppData({ stages: [...current.stages, makeStage({ id: 'custom-1' })] });

    const merged = mergeAppData(current, incoming);

    expect(merged.stages).toHaveLength(7);
    expect(merged.stages.some((s) => s.id === 'custom-1')).toBe(true);
  });
});
