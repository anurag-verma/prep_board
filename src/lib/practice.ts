import { differenceInCalendarDays } from 'date-fns';
import type { ConfidenceRating, Question } from '../types/models';

/** Questions reviewed within this many days get their weight tapered down;
 * beyond it they're back to full weight. */
const RECENCY_WINDOW_DAYS = 7;

/** Weight ∝ (6 − confidence) — low confidence surfaces more — tapered by how
 * recently the question was reviewed, so something just reviewed doesn't
 * immediately reappear even if its confidence is still low. Never reviewed
 * gets full weight (no penalty). */
export function computeWeight(question: Pick<Question, 'confidence' | 'lastReviewedAt'>, now: Date): number {
  const confidenceWeight = 6 - question.confidence;

  if (!question.lastReviewedAt) return confidenceWeight;

  const daysSinceReview = differenceInCalendarDays(now, new Date(question.lastReviewedAt));
  const recencyFactor = Math.max(0, Math.min(1, daysSinceReview / RECENCY_WINDOW_DAYS));
  return confidenceWeight * (0.2 + 0.8 * recencyFactor);
}

/** Weighted shuffle without replacement: repeatedly draws from the remaining
 * pool with probability proportional to weight. `rng` is injectable so tests
 * can drive it deterministically (default is `Math.random` for real use). */
export function orderPracticeDeck(
  questions: Question[],
  now: Date = new Date(),
  rng: () => number = Math.random,
): Question[] {
  const pool = questions.map((q) => ({ q, weight: Math.max(computeWeight(q, now), 0.0001) }));
  const ordered: Question[] = [];

  while (pool.length > 0) {
    const totalWeight = pool.reduce((sum, p) => sum + p.weight, 0);
    let r = rng() * totalWeight;
    let idx = 0;
    for (; idx < pool.length - 1; idx++) {
      r -= pool[idx].weight;
      if (r <= 0) break;
    }
    ordered.push(pool[idx].q);
    pool.splice(idx, 1);
  }

  return ordered;
}

export type SessionLength = 10 | 25 | 'all';

/** Orders the (already filtered) deck and trims it to the chosen session length. */
export function buildPracticeDeck(
  questions: Question[],
  sessionLength: SessionLength,
  now: Date = new Date(),
  rng: () => number = Math.random,
): Question[] {
  const ordered = orderPracticeDeck(questions, now, rng);
  return sessionLength === 'all' ? ordered : ordered.slice(0, sessionLength);
}

export interface PracticeReview {
  before: ConfidenceRating;
  after: ConfidenceRating;
}

export interface SessionSummary {
  count: number;
  avgConfidence: number;
  delta: number;
}

/** Session-end stats: how many reviewed, average post-review confidence, and
 * the change vs. average pre-review confidence. */
export function summarizeSession(reviews: PracticeReview[]): SessionSummary {
  if (reviews.length === 0) return { count: 0, avgConfidence: 0, delta: 0 };

  const avgBefore = reviews.reduce((sum, r) => sum + r.before, 0) / reviews.length;
  const avgAfter = reviews.reduce((sum, r) => sum + r.after, 0) / reviews.length;

  return { count: reviews.length, avgConfidence: avgAfter, delta: avgAfter - avgBefore };
}
