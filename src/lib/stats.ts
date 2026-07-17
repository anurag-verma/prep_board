import {
  differenceInCalendarDays,
  endOfWeek,
  format,
  startOfDay,
  startOfWeek,
  subDays,
  subWeeks,
} from 'date-fns';
import type { Application, Stage } from '../types/models';

export const STALE_DAYS = 14;
export const GHOSTED_DAYS = 21;

/** Days since the most recent event of ANY type on this application (not
 * just stage moves — that's `getDaysInStage` in lib/applications.ts, a
 * different measure). Falls back to createdAt if there are no events yet. */
export function daysSinceLastActivity(
  app: Pick<Application, 'events' | 'createdAt'>,
  now: Date = new Date(),
): number {
  const timestamps =
    app.events.length > 0
      ? app.events.map((e) => new Date(e.at).getTime())
      : [new Date(app.createdAt).getTime()];
  const lastActivity = new Date(Math.max(...timestamps));
  return differenceInCalendarDays(startOfDay(now), startOfDay(lastActivity));
}

export interface FunnelStep {
  stageId: string;
  name: string;
  count: number;
  /** Fraction of the previous step's count that reached this step; null for the first step. */
  conversionFromPrevious: number | null;
}

/** Cumulative "reached this stage or later" counts, derived purely from
 * stage ORDER (never stage names), so custom/reordered/renamed stages work
 * without special-casing. "Reached" uses the furthest stage_change target
 * ever logged, not just the current stage, so dragging a card backward for
 * a correction doesn't shrink the funnel. */
export function computeFunnel(stages: Stage[], applications: Application[]): FunnelStep[] {
  const active = applications.filter((a) => a.archivedAt === null);
  const stageIndex = new Map(stages.map((s, i) => [s.id, i]));

  function maxIndexReached(app: Application): number {
    let maxIdx = stageIndex.get(app.stageId) ?? 0;
    for (const event of app.events) {
      if (event.type === 'stage_change' && event.toStageId) {
        const idx = stageIndex.get(event.toStageId);
        if (idx !== undefined && idx > maxIdx) maxIdx = idx;
      }
    }
    return maxIdx;
  }

  const reachedIndices = active.map(maxIndexReached);

  const counts = stages.map((_, i) => reachedIndices.filter((idx) => idx >= i).length);

  return stages.map((stage, i) => ({
    stageId: stage.id,
    name: stage.name,
    count: counts[i],
    conversionFromPrevious: i === 0 ? null : counts[i - 1] === 0 ? 0 : counts[i] / counts[i - 1],
  }));
}

export interface WeeklyActivityBucket {
  weekStart: string; // yyyy-MM-dd
  count: number;
}

/** Applications created per week, oldest to newest, for the last `weeks` weeks. */
export function computeWeeklyActivity(
  applications: Application[],
  weeks = 12,
  now: Date = new Date(),
): WeeklyActivityBucket[] {
  const active = applications.filter((a) => a.archivedAt === null);
  const buckets: WeeklyActivityBucket[] = [];

  for (let i = weeks - 1; i >= 0; i--) {
    const weekStart = startOfWeek(subWeeks(now, i), { weekStartsOn: 1 });
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
    const count = active.filter((a) => {
      const created = new Date(a.createdAt);
      return created >= weekStart && created <= weekEnd;
    }).length;
    buckets.push({ weekStart: format(weekStart, 'yyyy-MM-dd'), count });
  }

  return buckets;
}

/** No explicit "is this the rejection stage" flag exists on Stage, so this
 * uses a name-based heuristic among terminal stages — same pragmatic
 * convention already used for the Rejected column's collapse-by-default
 * behavior. A renamed rejection stage without "reject" in its name is
 * treated as a successful terminal stage instead (documented trade-off). */
function isRejectedStage(stage: Stage): boolean {
  return stage.isTerminal && /reject/i.test(stage.name);
}

export interface ResponseBreakdown {
  progressed: number;
  rejected: number;
  ghosted: number;
  waiting: number;
}

/** Buckets every application that has left the first ("wishlist") stage
 * into one of four outcomes. Priority: rejected > reached a non-rejected
 * terminal stage (progressed) > ghosted (non-terminal, 21+ days quiet) >
 * progressed past the initial applied stage > still waiting. */
export function computeResponseBreakdown(
  stages: Stage[],
  applications: Application[],
  now: Date = new Date(),
): ResponseBreakdown {
  const stageIndex = new Map(stages.map((s, i) => [s.id, i]));
  const appliedThresholdIndex = stages.length > 1 ? 1 : 0;

  const result: ResponseBreakdown = { progressed: 0, rejected: 0, ghosted: 0, waiting: 0 };

  for (const app of applications) {
    if (app.archivedAt !== null) continue;
    const idx = stageIndex.get(app.stageId);
    if (idx === undefined || idx < appliedThresholdIndex) continue;

    const stage = stages[idx];
    if (isRejectedStage(stage)) {
      result.rejected += 1;
    } else if (stage.isTerminal) {
      result.progressed += 1;
    } else if (daysSinceLastActivity(app, now) >= GHOSTED_DAYS) {
      result.ghosted += 1;
    } else if (idx > appliedThresholdIndex) {
      result.progressed += 1;
    } else {
      result.waiting += 1;
    }
  }

  return result;
}

export interface PipelineStageCount {
  stageId: string;
  name: string;
  color: string;
  count: number;
}

/** Current card count per stage, in stage order. */
export function computePipelineSnapshot(
  stages: Stage[],
  applications: Application[],
): PipelineStageCount[] {
  return stages.map((stage) => ({
    stageId: stage.id,
    name: stage.name,
    color: stage.color,
    count: applications.filter((a) => a.archivedAt === null && a.stageId === stage.id).length,
  }));
}

/** Consecutive calendar days (local timezone) with >=1 event across any
 * application. If today has no event yet, that doesn't break the streak —
 * it just isn't counted until logged; the streak still reflects the run
 * ending yesterday. */
export function computeStreak(applications: Application[], now: Date = new Date()): number {
  const activeDays = new Set<number>();
  for (const app of applications) {
    if (app.archivedAt !== null) continue;
    for (const event of app.events) {
      activeDays.add(startOfDay(new Date(event.at)).getTime());
    }
  }

  let cursor = startOfDay(now);
  if (!activeDays.has(cursor.getTime())) {
    cursor = subDays(cursor, 1);
  }

  let streak = 0;
  while (activeDays.has(cursor.getTime())) {
    streak += 1;
    cursor = subDays(cursor, 1);
  }
  return streak;
}

/** Whether any active application has logged an event today (local time) —
 * i.e. whether today already extends the current streak. Separate from
 * `computeStreak` itself since a UI chip needs both "how long" and "does
 * today already count" (to decide fill state) independently. */
export function hasLoggedToday(applications: Application[], now: Date = new Date()): boolean {
  const today = startOfDay(now).getTime();
  return applications.some(
    (app) =>
      app.archivedAt === null &&
      app.events.some((event) => startOfDay(new Date(event.at)).getTime() === today),
  );
}

export interface StaleEntry {
  application: Application;
  daysQuiet: number;
}

/** Non-terminal applications with no activity for STALE_DAYS+, worst first. */
export function computeStaleList(
  stages: Stage[],
  applications: Application[],
  now: Date = new Date(),
): StaleEntry[] {
  const terminalIds = new Set(stages.filter((s) => s.isTerminal).map((s) => s.id));

  return applications
    .filter((a) => a.archivedAt === null && !terminalIds.has(a.stageId))
    .map((a) => ({ application: a, daysQuiet: daysSinceLastActivity(a, now) }))
    .filter((entry) => entry.daysQuiet >= STALE_DAYS)
    .sort((a, b) => b.daysQuiet - a.daysQuiet);
}

export interface HeatmapDay {
  date: string; // yyyy-MM-dd
  active: boolean;
}

/** One entry per day for the last `days` days (oldest first, today last),
 * marking whether any event happened that local calendar day. Same
 * activity-day derivation as `computeStreak`, just windowed and unrolled
 * into a calendar strip instead of counted. */
export function computeActivityHeatmap(
  applications: Application[],
  days = 30,
  now: Date = new Date(),
): HeatmapDay[] {
  const activeDays = new Set<number>();
  for (const app of applications) {
    if (app.archivedAt !== null) continue;
    for (const event of app.events) {
      activeDays.add(startOfDay(new Date(event.at)).getTime());
    }
  }

  const result: HeatmapDay[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const day = startOfDay(subDays(now, i));
    result.push({ date: format(day, 'yyyy-MM-dd'), active: activeDays.has(day.getTime()) });
  }
  return result;
}
