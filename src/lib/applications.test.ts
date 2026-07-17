import { describe, expect, it } from 'vitest';
import { makeApplication, makeTimelineEvent } from '../test/fixtures';
import { getDaysInStage } from './applications';

describe('getDaysInStage', () => {
  it('is 0 on the same calendar day as createdAt when there are no other events', () => {
    const now = new Date('2026-07-16T15:00:00');
    const app = makeApplication({
      createdAt: new Date('2026-07-16T09:00:00').toISOString(),
      events: [makeTimelineEvent({ type: 'created', at: new Date('2026-07-16T09:00:00').toISOString() })],
    });

    expect(getDaysInStage(app, now)).toBe(0);
  });

  it('counts days since createdAt when there has been no stage_change', () => {
    const now = new Date('2026-07-16T12:00:00');
    const app = makeApplication({
      createdAt: new Date('2026-07-06T12:00:00').toISOString(),
      events: [makeTimelineEvent({ type: 'created', at: new Date('2026-07-06T12:00:00').toISOString() })],
    });

    expect(getDaysInStage(app, now)).toBe(10);
  });

  it('uses the latest stage_change event, not createdAt, once the app has moved', () => {
    const now = new Date('2026-07-16T12:00:00');
    const app = makeApplication({
      createdAt: new Date('2026-07-01T12:00:00').toISOString(),
      events: [
        makeTimelineEvent({ type: 'created', at: new Date('2026-07-01T12:00:00').toISOString() }),
        makeTimelineEvent({ type: 'stage_change', at: new Date('2026-07-13T12:00:00').toISOString() }),
      ],
    });

    expect(getDaysInStage(app, now)).toBe(3);
  });

  it('ignores non-stage events (round_added, note) that happen after the last stage_change', () => {
    const now = new Date('2026-07-16T12:00:00');
    const app = makeApplication({
      createdAt: new Date('2026-07-01T12:00:00').toISOString(),
      events: [
        makeTimelineEvent({ type: 'created', at: new Date('2026-07-01T12:00:00').toISOString() }),
        makeTimelineEvent({ type: 'stage_change', at: new Date('2026-07-13T12:00:00').toISOString() }),
        makeTimelineEvent({ type: 'round_added', at: new Date('2026-07-15T12:00:00').toISOString() }),
      ],
    });

    // still measured from the stage_change on the 13th, not the round_added on the 15th
    expect(getDaysInStage(app, now)).toBe(3);
  });

  it('counts a crossed midnight as a full day even when less than 24h elapsed', () => {
    const now = new Date('2026-07-16T00:30:00');
    const app = makeApplication({
      createdAt: new Date('2026-07-15T23:45:00').toISOString(),
      events: [makeTimelineEvent({ type: 'created', at: new Date('2026-07-15T23:45:00').toISOString() })],
    });

    expect(getDaysInStage(app, now)).toBe(1);
  });
});
