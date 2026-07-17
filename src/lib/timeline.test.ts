import { describe, expect, it } from 'vitest';
import { makeTimelineEvent } from '../test/fixtures';
import { sortEventsNewestFirst } from './timeline';

describe('sortEventsNewestFirst', () => {
  it('sorts strictly by timestamp when timestamps differ', () => {
    const older = makeTimelineEvent({ id: 'e1', at: '2026-07-01T00:00:00.000Z' });
    const newer = makeTimelineEvent({ id: 'e2', at: '2026-07-10T00:00:00.000Z' });

    expect(sortEventsNewestFirst([older, newer]).map((e) => e.id)).toEqual(['e2', 'e1']);
  });

  it('breaks a timestamp tie using array position (later-appended wins)', () => {
    const sameInstant = '2026-07-16T12:00:00.000Z';
    const first = makeTimelineEvent({ id: 'e1', at: sameInstant });
    const second = makeTimelineEvent({ id: 'e2', at: sameInstant });
    const third = makeTimelineEvent({ id: 'e3', at: sameInstant });

    // appended in order e1, e2, e3 -> newest-first should be e3, e2, e1
    expect(sortEventsNewestFirst([first, second, third]).map((e) => e.id)).toEqual([
      'e3',
      'e2',
      'e1',
    ]);
  });

  it('is stable and correct with a mix of tied and distinct timestamps', () => {
    const t1 = '2026-07-01T00:00:00.000Z';
    const t2 = '2026-07-10T00:00:00.000Z';
    const a = makeTimelineEvent({ id: 'a', at: t1 });
    const b = makeTimelineEvent({ id: 'b', at: t2 });
    const c = makeTimelineEvent({ id: 'c', at: t2 }); // ties with b, appended after

    expect(sortEventsNewestFirst([a, b, c]).map((e) => e.id)).toEqual(['c', 'b', 'a']);
  });

  it('does not mutate the input array', () => {
    const events = [
      makeTimelineEvent({ id: 'e1', at: '2026-07-01T00:00:00.000Z' }),
      makeTimelineEvent({ id: 'e2', at: '2026-07-10T00:00:00.000Z' }),
    ];
    const original = [...events];
    sortEventsNewestFirst(events);
    expect(events).toEqual(original);
  });
});
