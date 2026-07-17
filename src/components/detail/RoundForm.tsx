import { useState } from 'react';
import type { Round, RoundOutcome, RoundType } from '../../types/models';
import MarkdownLiteEditor from '../ui/MarkdownLiteEditor';
import QuestionCapture from './QuestionCapture';
import {
  emptyRoundDraft,
  OUTCOME_COLORS,
  OUTCOME_LABELS,
  ROUND_OUTCOMES,
  ROUND_TYPE_LABELS,
  ROUND_TYPES,
} from './roundMeta';

interface RoundFormProps {
  applicationId: string;
  round?: Round;
  onSave: (round: Omit<Round, 'id'>) => void;
  onCancel: () => void;
  onDelete?: () => void;
}

function RoundForm({ applicationId, round, onSave, onCancel, onDelete }: RoundFormProps) {
  const [type, setType] = useState<RoundType>(round?.type ?? 'technical');
  const [date, setDate] = useState(round?.date ?? emptyRoundDraft().date);
  const [interviewers, setInterviewers] = useState(round?.interviewers ?? '');
  const [durationMins, setDurationMins] = useState(round?.durationMins?.toString() ?? '');
  const [outcome, setOutcome] = useState<RoundOutcome>(round?.outcome ?? 'pending');
  const [prepNotes, setPrepNotes] = useState(round?.prepNotes ?? '');
  const [reflectionNotes, setReflectionNotes] = useState(round?.reflectionNotes ?? '');
  const [questionIds, setQuestionIds] = useState<string[]>(round?.questionIds ?? []);

  function handleSave() {
    onSave({
      type,
      date,
      interviewers: interviewers.trim() || undefined,
      durationMins: durationMins.trim() ? Number(durationMins) : undefined,
      outcome,
      prepNotes,
      reflectionNotes,
      questionIds,
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Type</span>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as RoundType)}
          className="rounded border border-line bg-surface px-2 py-1.5"
        >
          {ROUND_TYPES.map((t) => (
            <option key={t} value={t}>
              {ROUND_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Date</span>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded border border-line bg-surface px-2 py-1.5"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Interviewer(s)</span>
        <input
          value={interviewers}
          onChange={(e) => setInterviewers(e.target.value)}
          placeholder="Alex, Priya"
          className="rounded border border-line bg-surface px-2 py-1.5 outline-none focus:border-action"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Duration (minutes)</span>
        <input
          type="number"
          min={0}
          value={durationMins}
          onChange={(e) => setDurationMins(e.target.value)}
          className="rounded border border-line bg-surface px-2 py-1.5 outline-none focus:border-action"
        />
      </label>

      <fieldset className="flex flex-col gap-1 text-sm">
        <legend className="font-medium">Outcome</legend>
        <div role="radiogroup" className="flex flex-wrap gap-1.5">
          {ROUND_OUTCOMES.map((o) => (
            <button
              key={o}
              type="button"
              role="radio"
              aria-checked={outcome === o}
              onClick={() => setOutcome(o)}
              className="rounded-full border px-3 py-1 text-xs font-medium hover:bg-bg"
              style={
                outcome === o
                  ? { borderColor: OUTCOME_COLORS[o], color: OUTCOME_COLORS[o] }
                  : { borderColor: 'var(--line)', color: 'var(--muted)' }
              }
            >
              {OUTCOME_LABELS[o]}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Prep notes</span>
        <MarkdownLiteEditor value={prepNotes} onChange={setPrepNotes} aria-label="Prep notes" />
      </div>

      <div className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Reflection notes</span>
        <MarkdownLiteEditor
          value={reflectionNotes}
          onChange={setReflectionNotes}
          aria-label="Reflection notes"
        />
      </div>

      <QuestionCapture
        applicationId={applicationId}
        questionIds={questionIds}
        onChange={setQuestionIds}
      />

      <div className="flex items-center justify-between pt-2">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSave}
            className="rounded-md px-3 py-1.5 text-sm font-medium text-on-action"
            style={{ backgroundColor: 'var(--action)' }}
          >
            Save round
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-line px-3 py-1.5 text-sm text-muted hover:bg-bg hover:text-ink"
          >
            Cancel
          </button>
        </div>
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="text-sm"
            style={{ color: 'var(--danger)' }}
          >
            Delete round
          </button>
        )}
      </div>
    </div>
  );
}

export default RoundForm;
