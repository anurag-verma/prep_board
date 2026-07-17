import { format } from 'date-fns';
import {
  ArrowRightCircle,
  CalendarPlus,
  Sparkles,
  StickyNote,
  type LucideIcon,
} from 'lucide-react';
import { useState, type KeyboardEvent } from 'react';
import { sortEventsNewestFirst } from '../../lib/timeline';
import { useBoardStore } from '../../store/useBoardStore';
import type { Application, TimelineEventType } from '../../types/models';

const EVENT_ICONS: Record<TimelineEventType, LucideIcon> = {
  created: Sparkles,
  stage_change: ArrowRightCircle,
  round_added: CalendarPlus,
  note: StickyNote,
  custom: StickyNote,
};

interface TimelineTabProps {
  application: Application;
}

function TimelineTab({ application }: TimelineTabProps) {
  const addNote = useBoardStore((s) => s.addNote);
  const [noteText, setNoteText] = useState('');

  function handleAddNote() {
    const trimmed = noteText.trim();
    if (!trimmed) return;
    addNote(application.id, trimmed);
    setNoteText('');
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddNote();
    }
  }

  const sortedEvents = sortEventsNewestFirst(application.events);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-1.5">
        <input
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a note…"
          aria-label="New note"
          className="flex-1 rounded border border-line bg-surface px-2 py-1.5 text-sm outline-none focus:border-action"
        />
        <button
          type="button"
          onClick={handleAddNote}
          disabled={!noteText.trim()}
          className="rounded-md px-3 py-1.5 text-sm font-medium text-on-action disabled:opacity-40"
          style={{ backgroundColor: 'var(--action)' }}
        >
          Add note
        </button>
      </div>

      <ul className="flex flex-col gap-2">
        {sortedEvents.map((event) => {
          const Icon = EVENT_ICONS[event.type];
          return (
            <li key={event.id} className="flex items-start gap-2 text-sm">
              <Icon aria-hidden size={14} className="mt-0.5 shrink-0 text-muted" />
              <div className="flex flex-col">
                <span>{event.label}</span>
                <span className="font-mono text-xs text-muted">
                  {format(new Date(event.at), 'MMM d, yyyy · HH:mm')}
                </span>
              </div>
            </li>
          );
        })}
        {sortedEvents.length === 0 && <p className="text-sm text-muted">No activity yet.</p>}
      </ul>
    </div>
  );
}

export default TimelineTab;
