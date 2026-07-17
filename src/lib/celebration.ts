import type { Stage } from '../types/models';

/** Whether a stage is "the Offer stage" for celebration purposes. Matches by
 * name (case/whitespace-insensitive) rather than the default `'offer'` id so
 * a renamed-but-still-called-Offer stage still celebrates; a stage renamed to
 * something else stops celebrating, which is the accepted trade-off (same
 * category as the rejection-stage heuristic in lib/stats.ts). */
export function isOfferStage(stage: Stage | undefined): boolean {
  if (!stage) return false;
  return stage.name.trim().toLowerCase() === 'offer';
}
