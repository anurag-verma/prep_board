import { describe, expect, it } from 'vitest';
import { makeApplication, makeStage, makeTimelineEvent } from '../test/fixtures';
import { DEFAULT_STAGES } from '../types/models';
import {
  computeActivityHeatmap,
  computeFunnel,
  computePipelineSnapshot,
  computeResponseBreakdown,
  computeStaleList,
  computeStreak,
  computeWeeklyActivity,
  daysSinceLastActivity,
  GHOSTED_DAYS,
  hasLoggedToday,
  STALE_DAYS,
} from './stats';

const NOW = new Date(2026, 6, 16, 12, 0, 0); // local time, avoids TZ portability issues

describe('daysSinceLastActivity', () => {
  it('uses the most recent event regardless of array order', () => {
    const app = makeApplication({
      createdAt: new Date(2026, 6, 1, 9, 0).toISOString(),
      events: [
        makeTimelineEvent({ at: new Date(2026, 6, 10, 9, 0).toISOString() }),
        makeTimelineEvent({ at: new Date(2026, 6, 2, 9, 0).toISOString() }), // out of order
      ],
    });
    expect(daysSinceLastActivity(app, NOW)).toBe(6); // from Jul 10 to Jul 16
  });

  it('falls back to createdAt when there are no events', () => {
    const app = makeApplication({ createdAt: new Date(2026, 6, 9, 9, 0).toISOString(), events: [] });
    expect(daysSinceLastActivity(app, NOW)).toBe(7);
  });
});

describe('computeFunnel', () => {
  it('produces cumulative reached-or-later counts in stage order', () => {
    const stages = DEFAULT_STAGES;
    const apps = [
      makeApplication({ stageId: 'wishlist' }),
      makeApplication({ stageId: 'applied' }),
      makeApplication({ stageId: 'applied' }),
      makeApplication({ stageId: 'interviewing' }),
      makeApplication({ stageId: 'offer' }),
    ];

    const funnel = computeFunnel(stages, apps);
    const byId = Object.fromEntries(funnel.map((f) => [f.stageId, f.count]));

    expect(byId.wishlist).toBe(5); // everyone has reached at least wishlist
    expect(byId.applied).toBe(4); // all but the wishlist-only one
    expect(byId.oa).toBe(2); // interviewing + offer
    expect(byId.interviewing).toBe(2);
    expect(byId.offer).toBe(1);
    expect(byId.rejected).toBe(0);
  });

  it('uses the furthest stage_change target reached, not just current stage', () => {
    const app = makeApplication({
      stageId: 'applied', // dragged back after reaching interviewing
      events: [
        makeTimelineEvent({ type: 'stage_change', toStageId: 'interviewing' }),
        makeTimelineEvent({ type: 'stage_change', toStageId: 'applied' }),
      ],
    });

    const funnel = computeFunnel(DEFAULT_STAGES, [app]);
    const byId = Object.fromEntries(funnel.map((f) => [f.stageId, f.count]));
    expect(byId.interviewing).toBe(1); // still counted as having reached it
  });

  it('computes conversion rates between consecutive steps', () => {
    const apps = [
      makeApplication({ stageId: 'applied' }),
      makeApplication({ stageId: 'applied' }),
      makeApplication({ stageId: 'oa' }),
    ];
    const funnel = computeFunnel(DEFAULT_STAGES, apps);
    const applied = funnel.find((f) => f.stageId === 'applied')!;
    const oa = funnel.find((f) => f.stageId === 'oa')!;

    expect(applied.count).toBe(3);
    expect(oa.count).toBe(1);
    expect(oa.conversionFromPrevious).toBeCloseTo(1 / 3);
  });

  it('handles a completely custom/reordered stage set', () => {
    const customStages = [
      makeStage({ id: 'sourced', name: 'Sourced', isTerminal: false }),
      makeStage({ id: 'screen', name: 'Screening', isTerminal: false }),
      makeStage({ id: 'onsite', name: 'Onsite', isTerminal: false }),
      makeStage({ id: 'hired', name: 'Hired', isTerminal: true }),
    ];
    const apps = [
      makeApplication({ stageId: 'sourced' }),
      makeApplication({ stageId: 'onsite' }),
      makeApplication({ stageId: 'hired' }),
    ];

    const funnel = computeFunnel(customStages, apps);
    expect(funnel.map((f) => f.stageId)).toEqual(['sourced', 'screen', 'onsite', 'hired']);
    const byId = Object.fromEntries(funnel.map((f) => [f.stageId, f.count]));
    expect(byId.sourced).toBe(3);
    expect(byId.screen).toBe(2);
    expect(byId.onsite).toBe(2);
    expect(byId.hired).toBe(1);
  });

  it('excludes archived applications', () => {
    const app = makeApplication({ stageId: 'offer', archivedAt: new Date().toISOString() });
    const funnel = computeFunnel(DEFAULT_STAGES, [app]);
    expect(funnel.find((f) => f.stageId === 'wishlist')!.count).toBe(0);
  });

  it('first step has a null conversion rate', () => {
    const funnel = computeFunnel(DEFAULT_STAGES, [makeApplication()]);
    expect(funnel[0].conversionFromPrevious).toBeNull();
  });
});

describe('computeWeeklyActivity', () => {
  it('buckets applications created this week into the final bucket', () => {
    const app = makeApplication({ createdAt: NOW.toISOString() });
    const buckets = computeWeeklyActivity([app], 12, NOW);
    expect(buckets).toHaveLength(12);
    expect(buckets.at(-1)!.count).toBe(1);
    expect(buckets[0].count).toBe(0);
  });

  it('excludes archived applications', () => {
    const app = makeApplication({ createdAt: NOW.toISOString(), archivedAt: NOW.toISOString() });
    const buckets = computeWeeklyActivity([app], 12, NOW);
    expect(buckets.at(-1)!.count).toBe(0);
  });

  it('places an application created 11 weeks ago in the first bucket', () => {
    const elevenWeeksAgo = new Date(NOW);
    elevenWeeksAgo.setDate(elevenWeeksAgo.getDate() - 11 * 7);
    const app = makeApplication({ createdAt: elevenWeeksAgo.toISOString() });
    const buckets = computeWeeklyActivity([app], 12, NOW);
    expect(buckets[0].count).toBe(1);
  });
});

describe('computeResponseBreakdown', () => {
  it('counts a rejected application (terminal stage with "reject" in the name)', () => {
    const app = makeApplication({ stageId: 'rejected' });
    const result = computeResponseBreakdown(DEFAULT_STAGES, [app], NOW);
    expect(result.rejected).toBe(1);
  });

  it('counts a successful terminal stage as progressed', () => {
    const app = makeApplication({ stageId: 'offer' });
    const result = computeResponseBreakdown(DEFAULT_STAGES, [app], NOW);
    expect(result.progressed).toBe(1);
  });

  it('counts an application that advanced beyond Applied as progressed', () => {
    const app = makeApplication({ stageId: 'interviewing' });
    const result = computeResponseBreakdown(DEFAULT_STAGES, [app], NOW);
    expect(result.progressed).toBe(1);
  });

  it('counts a quiet non-terminal application as ghosted at exactly 21 days', () => {
    const twentyOneDaysAgo = new Date(NOW);
    twentyOneDaysAgo.setDate(twentyOneDaysAgo.getDate() - GHOSTED_DAYS);
    const app = makeApplication({
      stageId: 'applied',
      events: [makeTimelineEvent({ at: twentyOneDaysAgo.toISOString() })],
    });
    const result = computeResponseBreakdown(DEFAULT_STAGES, [app], NOW);
    expect(result.ghosted).toBe(1);
  });

  it('counts a recently-active Applied application as waiting, not ghosted', () => {
    const app = makeApplication({
      stageId: 'applied',
      events: [makeTimelineEvent({ at: NOW.toISOString() })],
    });
    const result = computeResponseBreakdown(DEFAULT_STAGES, [app], NOW);
    expect(result.waiting).toBe(1);
  });

  it('ignores applications still sitting in the pre-application (Wishlist) stage', () => {
    const app = makeApplication({ stageId: 'wishlist' });
    const result = computeResponseBreakdown(DEFAULT_STAGES, [app], NOW);
    expect(result).toEqual({ progressed: 0, rejected: 0, ghosted: 0, waiting: 0 });
  });

  it('excludes archived applications', () => {
    const app = makeApplication({ stageId: 'rejected', archivedAt: NOW.toISOString() });
    const result = computeResponseBreakdown(DEFAULT_STAGES, [app], NOW);
    expect(result.rejected).toBe(0);
  });
});

describe('computePipelineSnapshot', () => {
  it('counts current cards per stage, excluding archived', () => {
    const apps = [
      makeApplication({ stageId: 'applied' }),
      makeApplication({ stageId: 'applied', archivedAt: NOW.toISOString() }),
      makeApplication({ stageId: 'oa' }),
    ];
    const snapshot = computePipelineSnapshot(DEFAULT_STAGES, apps);
    const byId = Object.fromEntries(snapshot.map((s) => [s.stageId, s.count]));
    expect(byId.applied).toBe(1);
    expect(byId.oa).toBe(1);
    expect(byId.wishlist).toBe(0);
  });
});

describe('computeStreak', () => {
  it('is 0 when there are no events at all', () => {
    expect(computeStreak([makeApplication({ events: [] })], NOW)).toBe(0);
  });

  it('counts today if an event happened today', () => {
    const app = makeApplication({ events: [makeTimelineEvent({ at: NOW.toISOString() })] });
    expect(computeStreak([app], NOW)).toBe(1);
  });

  it('counts consecutive days across multiple applications', () => {
    const day1 = new Date(2026, 6, 14, 10, 0);
    const day2 = new Date(2026, 6, 15, 10, 0);
    const day3 = new Date(2026, 6, 16, 10, 0);
    const apps = [
      makeApplication({ events: [makeTimelineEvent({ at: day1.toISOString() })] }),
      makeApplication({ events: [makeTimelineEvent({ at: day2.toISOString() })] }),
      makeApplication({ events: [makeTimelineEvent({ at: day3.toISOString() })] }),
    ];
    expect(computeStreak(apps, NOW)).toBe(3);
  });

  it('does not break the streak just because today has no event yet', () => {
    const yesterday = new Date(2026, 6, 15, 10, 0);
    const app = makeApplication({ events: [makeTimelineEvent({ at: yesterday.toISOString() })] });
    expect(computeStreak([app], NOW)).toBe(1);
  });

  it('is broken by a gap (event 2 days ago, nothing yesterday)', () => {
    const twoDaysAgo = new Date(2026, 6, 14, 10, 0);
    const app = makeApplication({ events: [makeTimelineEvent({ at: twoDaysAgo.toISOString() })] });
    expect(computeStreak([app], NOW)).toBe(0);
  });

  it('midnight boundary: an event at 23:59 counts for that day, not the next', () => {
    const lateNight = new Date(2026, 6, 15, 23, 59);
    const app = makeApplication({ events: [makeTimelineEvent({ at: lateNight.toISOString() })] });
    // "now" is Jul 16 at noon; the event was Jul 15 23:59 -> yesterday, streak intact at 1
    expect(computeStreak([app], NOW)).toBe(1);
  });

  it('midnight boundary: an event at 00:01 belongs to the new day, not the previous one', () => {
    const justAfterMidnight = new Date(2026, 6, 16, 0, 1);
    const app = makeApplication({
      events: [makeTimelineEvent({ at: justAfterMidnight.toISOString() })],
    });
    // "now" is also Jul 16 -> same calendar day -> counts as today
    expect(computeStreak([app], NOW)).toBe(1);
  });

  it('excludes archived applications', () => {
    const app = makeApplication({
      archivedAt: NOW.toISOString(),
      events: [makeTimelineEvent({ at: NOW.toISOString() })],
    });
    expect(computeStreak([app], NOW)).toBe(0);
  });
});

describe('hasLoggedToday', () => {
  it('is false when there are no applications', () => {
    expect(hasLoggedToday([], NOW)).toBe(false);
  });

  it('is true when an active application has an event today', () => {
    const app = makeApplication({ events: [makeTimelineEvent({ at: NOW.toISOString() })] });
    expect(hasLoggedToday([app], NOW)).toBe(true);
  });

  it('is false when the most recent event was yesterday', () => {
    const yesterday = new Date(2026, 6, 15, 10, 0);
    const app = makeApplication({ events: [makeTimelineEvent({ at: yesterday.toISOString() })] });
    expect(hasLoggedToday([app], NOW)).toBe(false);
  });

  it('ignores events on archived applications', () => {
    const app = makeApplication({
      archivedAt: NOW.toISOString(),
      events: [makeTimelineEvent({ at: NOW.toISOString() })],
    });
    expect(hasLoggedToday([app], NOW)).toBe(false);
  });

  it('midnight boundary: 23:59 event does not count as "today" for a noon "now" the next day', () => {
    const lateNight = new Date(2026, 6, 15, 23, 59);
    const app = makeApplication({ events: [makeTimelineEvent({ at: lateNight.toISOString() })] });
    expect(hasLoggedToday([app], NOW)).toBe(false);
  });
});

describe('computeStaleList', () => {
  it('includes a non-terminal application quiet for exactly STALE_DAYS', () => {
    const staleDate = new Date(NOW);
    staleDate.setDate(staleDate.getDate() - STALE_DAYS);
    const app = makeApplication({
      stageId: 'applied',
      events: [makeTimelineEvent({ at: staleDate.toISOString() })],
    });
    const list = computeStaleList(DEFAULT_STAGES, [app], NOW);
    expect(list).toHaveLength(1);
    expect(list[0].daysQuiet).toBe(STALE_DAYS);
  });

  it('excludes an application one day short of STALE_DAYS', () => {
    const almostStale = new Date(NOW);
    almostStale.setDate(almostStale.getDate() - (STALE_DAYS - 1));
    const app = makeApplication({
      stageId: 'applied',
      events: [makeTimelineEvent({ at: almostStale.toISOString() })],
    });
    expect(computeStaleList(DEFAULT_STAGES, [app], NOW)).toHaveLength(0);
  });

  it('excludes terminal-stage applications regardless of quietness', () => {
    const longAgo = new Date(2020, 0, 1);
    const app = makeApplication({
      stageId: 'offer',
      events: [makeTimelineEvent({ at: longAgo.toISOString() })],
    });
    expect(computeStaleList(DEFAULT_STAGES, [app], NOW)).toHaveLength(0);
  });

  it('sorts worst (quietest) first', () => {
    const tenDaysAgo = new Date(NOW);
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 20);
    const thirtyDaysAgo = new Date(NOW);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const lessStale = makeApplication({
      stageId: 'applied',
      events: [makeTimelineEvent({ at: tenDaysAgo.toISOString() })],
    });
    const moreStale = makeApplication({
      stageId: 'oa',
      events: [makeTimelineEvent({ at: thirtyDaysAgo.toISOString() })],
    });
    const list = computeStaleList(DEFAULT_STAGES, [lessStale, moreStale], NOW);
    expect(list[0].application.id).toBe(moreStale.id);
    expect(list[1].application.id).toBe(lessStale.id);
  });

  it('excludes archived applications', () => {
    const longAgo = new Date(2020, 0, 1);
    const app = makeApplication({
      stageId: 'applied',
      archivedAt: NOW.toISOString(),
      events: [makeTimelineEvent({ at: longAgo.toISOString() })],
    });
    expect(computeStaleList(DEFAULT_STAGES, [app], NOW)).toHaveLength(0);
  });
});

describe('computeActivityHeatmap', () => {
  it('returns `days` entries, oldest first, today last', () => {
    const heatmap = computeActivityHeatmap([], 30, NOW);
    expect(heatmap).toHaveLength(30);
    expect(heatmap.at(-1)!.date).toBe('2026-07-16');
    expect(heatmap[0].date).toBe('2026-06-17');
  });

  it('marks today active when there is an event today', () => {
    const app = makeApplication({ events: [makeTimelineEvent({ at: NOW.toISOString() })] });
    const heatmap = computeActivityHeatmap([app], 30, NOW);
    expect(heatmap.at(-1)!.active).toBe(true);
  });

  it('marks a day with no events as inactive', () => {
    const heatmap = computeActivityHeatmap([], 30, NOW);
    expect(heatmap.every((d) => !d.active)).toBe(true);
  });

  it('excludes archived applications', () => {
    const app = makeApplication({
      archivedAt: NOW.toISOString(),
      events: [makeTimelineEvent({ at: NOW.toISOString() })],
    });
    const heatmap = computeActivityHeatmap([app], 30, NOW);
    expect(heatmap.at(-1)!.active).toBe(false);
  });
});
