import { differenceInCalendarDays, startOfDay } from 'date-fns';
import type { Application } from '../types/models';

const STAGE_TIME_EVENT_TYPES = new Set(['created', 'stage_change']);

/** Days since the application entered its current stage (local timezone). */
export function getDaysInStage(
  app: Pick<Application, 'events' | 'createdAt'>,
  now: Date = new Date(),
): number {
  const stageEvents = app.events.filter((e) => STAGE_TIME_EVENT_TYPES.has(e.type));
  const lastStageEventAt = stageEvents.at(-1)?.at ?? app.createdAt;
  return differenceInCalendarDays(startOfDay(now), startOfDay(new Date(lastStageEventAt)));
}

export const STALE_DAYS_IN_STAGE = 14;
