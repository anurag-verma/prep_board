import type { TimelineEvent } from '../types/models';

/** Sorts events newest-first. Events is append-only and chronological, so
 * when two events share the same millisecond timestamp (common — several
 * can be logged in one synchronous store action), array position breaks the
 * tie: the later-appended event (higher original index) sorts first. */
export function sortEventsNewestFirst(events: TimelineEvent[]): TimelineEvent[] {
  return events
    .map((event, index) => ({ event, index }))
    .sort((a, b) => {
      const diff = new Date(b.event.at).getTime() - new Date(a.event.at).getTime();
      return diff !== 0 ? diff : b.index - a.index;
    })
    .map(({ event }) => event);
}
