import type { AppData } from '../types/models';

/** De-dupes by id: keeps every current item, appends only incoming items
 * whose id isn't already present. Existing wins on a collision. */
export function mergeById<T extends { id: string }>(current: T[], incoming: T[]): T[] {
  const existingIds = new Set(current.map((item) => item.id));
  const newOnes = incoming.filter((item) => !existingIds.has(item.id));
  return [...current, ...newOnes];
}

/** Combines an imported AppData into the current one, de-duping by id so
 * re-importing the same file (or overlapping data) never creates duplicates.
 * On an id collision the existing record wins — merge is additive, not a way
 * to overwrite what's already in the current session. */
export function mergeAppData(current: AppData, incoming: AppData): AppData {
  return {
    schemaVersion: current.schemaVersion,
    stages: mergeById(current.stages, incoming.stages),
    applications: mergeById(current.applications, incoming.applications),
    questions: mergeById(current.questions, incoming.questions),
  };
}
