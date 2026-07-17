import { describe, expect, it } from 'vitest';
import { makeQuestion } from '../test/fixtures';
import {
  buildPracticeDeck,
  computeWeight,
  orderPracticeDeck,
  summarizeSession,
} from './practice';

const NOW = new Date('2026-07-16T12:00:00.000Z');

describe('computeWeight', () => {
  it('gives lower confidence a higher weight than higher confidence, all else equal', () => {
    const lowConfidence = makeQuestion({ confidence: 1, lastReviewedAt: null });
    const highConfidence = makeQuestion({ confidence: 5, lastReviewedAt: null });

    expect(computeWeight(lowConfidence, NOW)).toBeGreaterThan(computeWeight(highConfidence, NOW));
  });

  it('gives a never-reviewed question full weight (no recency penalty)', () => {
    const q = makeQuestion({ confidence: 2, lastReviewedAt: null });
    expect(computeWeight(q, NOW)).toBe(4); // 6 - 2, no taper
  });

  it('tapers weight down for a question reviewed very recently', () => {
    const reviewedToday = makeQuestion({ confidence: 2, lastReviewedAt: NOW.toISOString() });
    const neverReviewed = makeQuestion({ confidence: 2, lastReviewedAt: null });

    expect(computeWeight(reviewedToday, NOW)).toBeLessThan(computeWeight(neverReviewed, NOW));
  });

  it('restores full weight once enough days have passed since review', () => {
    const longAgo = new Date(NOW);
    longAgo.setDate(longAgo.getDate() - 30);
    const q = makeQuestion({ confidence: 2, lastReviewedAt: longAgo.toISOString() });

    expect(computeWeight(q, NOW)).toBe(4);
  });
});

describe('orderPracticeDeck', () => {
  it('is a permutation of the input (same questions, no duplicates/drops)', () => {
    const questions = [
      makeQuestion({ id: 'a', confidence: 1 }),
      makeQuestion({ id: 'b', confidence: 3 }),
      makeQuestion({ id: 'c', confidence: 5 }),
    ];
    const ordered = orderPracticeDeck(questions, NOW);
    expect(ordered.map((q) => q.id).sort()).toEqual(['a', 'b', 'c']);
  });

  it('is deterministic given a fixed rng', () => {
    const questions = [
      makeQuestion({ id: 'a', confidence: 3 }),
      makeQuestion({ id: 'b', confidence: 3 }),
    ];
    const fixedRng = () => 0; // always picks the first remaining item
    expect(orderPracticeDeck(questions, NOW, fixedRng).map((q) => q.id)).toEqual(['a', 'b']);
  });

  it('statistically prioritizes low-confidence questions (appear earlier, more often)', () => {
    const lowConfidence = makeQuestion({ id: 'low', confidence: 1, lastReviewedAt: null });
    const highConfidence = makeQuestion({ id: 'high', confidence: 5, lastReviewedAt: null });

    let lowFirstCount = 0;
    const trials = 500;
    for (let i = 0; i < trials; i++) {
      const ordered = orderPracticeDeck([lowConfidence, highConfidence], NOW, Math.random);
      if (ordered[0].id === 'low') lowFirstCount++;
    }

    // low confidence has 5x the weight of high confidence (5 vs 1), so it
    // should be drawn first roughly 5/6 of the time — assert it's clearly
    // the majority, with slack for randomness.
    expect(lowFirstCount / trials).toBeGreaterThan(0.7);
  });
});

describe('buildPracticeDeck', () => {
  const questions = Array.from({ length: 20 }, (_, i) => makeQuestion({ id: `q${i}` }));

  it('trims to the requested session length', () => {
    expect(buildPracticeDeck(questions, 10, NOW)).toHaveLength(10);
  });

  it('returns everything for "all"', () => {
    expect(buildPracticeDeck(questions, 'all', NOW)).toHaveLength(20);
  });

  it('does not error when session length exceeds available questions', () => {
    expect(buildPracticeDeck(questions.slice(0, 5), 25, NOW)).toHaveLength(5);
  });
});

describe('summarizeSession', () => {
  it('returns zeroed summary for an empty session', () => {
    expect(summarizeSession([])).toEqual({ count: 0, avgConfidence: 0, delta: 0 });
  });

  it('computes count, average post-review confidence, and delta', () => {
    const summary = summarizeSession([
      { before: 2, after: 3 },
      { before: 3, after: 4 },
    ]);
    expect(summary.count).toBe(2);
    expect(summary.avgConfidence).toBeCloseTo(3.5);
    expect(summary.delta).toBeCloseTo(1.0);
  });

  it('reports a negative delta when confidence drops on average', () => {
    const summary = summarizeSession([{ before: 4, after: 2 }]);
    expect(summary.delta).toBeCloseTo(-2);
  });
});
