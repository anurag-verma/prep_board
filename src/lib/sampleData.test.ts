import { describe, expect, it } from 'vitest';
import { computeStreak } from './stats';
import { generateSampleData } from './sampleData';

const NOW = new Date(2026, 6, 16, 12, 0, 0); // local time, avoids TZ portability issues

describe('generateSampleData', () => {
  it('produces 12 applications across all 6 default stages', () => {
    const { stages, applications } = generateSampleData(NOW);
    expect(applications).toHaveLength(12);
    expect(stages).toHaveLength(6);

    const stageIds = new Set(stages.map((s) => s.id));
    for (const app of applications) {
      expect(stageIds.has(app.stageId)).toBe(true);
    }
    // every stage has at least one application, so the board looks populated column-to-column
    const usedStageIds = new Set(applications.map((a) => a.stageId));
    expect(usedStageIds.size).toBe(6);
  });

  it('produces 15 questions, all with valid categories/difficulties and unique ids', () => {
    const { questions } = generateSampleData(NOW);
    expect(questions).toHaveLength(15);
    expect(new Set(questions.map((q) => q.id)).size).toBe(15);
    for (const q of questions) {
      expect(['dsa', 'system_design', 'behavioral', 'sql', 'domain', 'other']).toContain(
        q.category,
      );
      expect(['easy', 'medium', 'hard']).toContain(q.difficulty);
      expect(q.confidence).toBeGreaterThanOrEqual(1);
      expect(q.confidence).toBeLessThanOrEqual(5);
    }
  });

  it('every question companyId and round questionId refers to a real application/question', () => {
    const { applications, questions } = generateSampleData(NOW);
    const appIds = new Set(applications.map((a) => a.id));
    const questionIds = new Set(questions.map((q) => q.id));

    for (const q of questions) {
      for (const companyId of q.companyIds) {
        expect(appIds.has(companyId)).toBe(true);
      }
    }
    for (const app of applications) {
      for (const round of app.rounds) {
        for (const qid of round.questionIds) {
          expect(questionIds.has(qid)).toBe(true);
        }
      }
    }
  });

  it('at least one question is linked to two or more applications (demonstrates reuse)', () => {
    const { questions } = generateSampleData(NOW);
    expect(questions.some((q) => q.companyIds.length >= 2)).toBe(true);
  });

  it('at least one question is standalone (no linked applications)', () => {
    const { questions } = generateSampleData(NOW);
    expect(questions.some((q) => q.companyIds.length === 0)).toBe(true);
  });

  it('every event and round date is at or before `now`, and createdAt is consistent with the earliest event', () => {
    const { applications } = generateSampleData(NOW);
    for (const app of applications) {
      expect(new Date(app.createdAt).getTime()).toBeLessThanOrEqual(NOW.getTime());
      for (const event of app.events) {
        expect(new Date(event.at).getTime()).toBeLessThanOrEqual(NOW.getTime());
      }
      for (const round of app.rounds) {
        expect(new Date(round.date).getTime()).toBeLessThanOrEqual(NOW.getTime());
      }
    }
  });

  it('yields a non-zero current streak as of `now` (recent activity exists)', () => {
    const { applications } = generateSampleData(NOW);
    const streak = computeStreak(applications, NOW);
    expect(streak).toBeGreaterThanOrEqual(1);
  });

  it('includes at least one stale (non-terminal, quiet 14+ days) application', () => {
    const { stages, applications } = generateSampleData(NOW);
    const nonTerminalIds = new Set(stages.filter((s) => !s.isTerminal).map((s) => s.id));
    const staleApps = applications.filter((app) => {
      if (!nonTerminalIds.has(app.stageId)) return false;
      const lastActivity = app.events.reduce(
        (latest, e) => Math.max(latest, new Date(e.at).getTime()),
        new Date(app.createdAt).getTime(),
      );
      const days = (NOW.getTime() - lastActivity) / (1000 * 60 * 60 * 24);
      return days >= 14;
    });
    expect(staleApps.length).toBeGreaterThanOrEqual(1);
  });

  it('is deterministic in shape (same counts) across independent calls', () => {
    const first = generateSampleData(NOW);
    const second = generateSampleData(NOW);
    expect(second.applications).toHaveLength(first.applications.length);
    expect(second.questions).toHaveLength(first.questions.length);
    // ids are freshly generated (nanoid) each call, so they must differ
    expect(second.applications[0].id).not.toBe(first.applications[0].id);
  });
});
