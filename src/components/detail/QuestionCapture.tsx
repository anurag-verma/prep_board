import { Link2, Plus, X } from 'lucide-react';
import { useState } from 'react';
import { createId } from '../../lib/id';
import { CATEGORY_LABELS, DIFFICULTY_LABELS, QUESTION_CATEGORIES, QUESTION_DIFFICULTIES } from '../../lib/questionLabels';
import { useQuestionStore } from '../../store/useQuestionStore';
import type { QuestionCategory, QuestionDifficulty } from '../../types/models';

interface DraftRow {
  draftId: string;
  text: string;
  category: QuestionCategory;
  difficulty: QuestionDifficulty;
}

interface QuestionCaptureProps {
  applicationId: string;
  questionIds: string[];
  onChange: (questionIds: string[]) => void;
}

function emptyDraftRow(): DraftRow {
  return { draftId: createId(), text: '', category: 'dsa', difficulty: 'medium' };
}

function QuestionCapture({ applicationId, questionIds, onChange }: QuestionCaptureProps) {
  const questions = useQuestionStore((s) => s.questions);
  const addQuestion = useQuestionStore((s) => s.addQuestion);
  const linkQuestionToApplication = useQuestionStore((s) => s.linkQuestionToApplication);

  const [draftRows, setDraftRows] = useState<DraftRow[]>([]);

  const linkedQuestions = questionIds
    .map((id) => questions.find((q) => q.id === id))
    .filter((q): q is NonNullable<typeof q> => q !== undefined);

  function updateDraft(draftId: string, patch: Partial<DraftRow>) {
    setDraftRows((rows) => rows.map((r) => (r.draftId === draftId ? { ...r, ...patch } : r)));
  }

  function removeDraft(draftId: string) {
    setDraftRows((rows) => rows.filter((r) => r.draftId !== draftId));
  }

  function saveToBank(row: DraftRow) {
    const text = row.text.trim();
    if (!text) return;
    const question = addQuestion({
      text,
      category: row.category,
      difficulty: row.difficulty,
      companyIds: [applicationId],
    });
    onChange([...questionIds, question.id]);
    removeDraft(row.draftId);
  }

  function linkExisting(row: DraftRow, existingId: string) {
    linkQuestionToApplication(existingId, applicationId);
    if (!questionIds.includes(existingId)) {
      onChange([...questionIds, existingId]);
    }
    removeDraft(row.draftId);
  }

  function unlink(questionId: string) {
    onChange(questionIds.filter((id) => id !== questionId));
  }

  function matchesFor(row: DraftRow) {
    const query = row.text.trim().toLowerCase();
    if (!query) return [];
    return questions
      .filter((q) => q.text.toLowerCase().includes(query) && !questionIds.includes(q.id))
      .slice(0, 5);
  }

  return (
    <div className="flex flex-col gap-2 text-sm">
      <div className="flex items-center justify-between">
        <span className="font-medium">Questions asked</span>
        <button
          type="button"
          onClick={() => setDraftRows((rows) => [...rows, emptyDraftRow()])}
          className="flex items-center gap-1 text-xs"
          style={{ color: 'var(--action)' }}
        >
          <Plus size={14} /> Add question
        </button>
      </div>

      {linkedQuestions.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {linkedQuestions.map((q) => (
            <li
              key={q.id}
              className="flex items-center justify-between gap-2 rounded border border-line px-2 py-1.5"
            >
              <span className="flex min-w-0 items-center gap-2">
                <Link2 aria-hidden size={12} className="shrink-0 text-muted" />
                <span className="truncate">{q.text}</span>
                <span className="shrink-0 rounded-full bg-bg px-1.5 py-0.5 text-xs text-muted">
                  {CATEGORY_LABELS[q.category]}
                </span>
                <span className="shrink-0 rounded-full bg-bg px-1.5 py-0.5 text-xs text-muted">
                  {DIFFICULTY_LABELS[q.difficulty]}
                </span>
              </span>
              <button
                type="button"
                onClick={() => unlink(q.id)}
                aria-label={`Unlink question ${q.text}`}
                title="Unlink question"
                className="shrink-0 text-muted hover:text-ink"
              >
                <X size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {draftRows.map((row) => {
        const matches = matchesFor(row);
        return (
          <div key={row.draftId} className="flex flex-col gap-1 rounded border border-line p-2">
            <div className="relative">
              <input
                value={row.text}
                onChange={(e) => updateDraft(row.draftId, { text: e.target.value })}
                placeholder="Question text"
                aria-label="Question text"
                className="w-full rounded border border-line bg-surface px-2 py-1 text-sm outline-none focus:border-action"
              />
              {matches.length > 0 && (
                <ul className="absolute z-10 mt-1 w-full rounded-md border border-line bg-surface [box-shadow:var(--shadow-popover)]">
                  {matches.map((m) => (
                    <li key={m.id}>
                      <button
                        type="button"
                        onClick={() => linkExisting(row, m.id)}
                        className="block w-full px-2 py-1.5 text-left text-xs hover:bg-bg"
                      >
                        Link existing: {m.text}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <select
                value={row.category}
                onChange={(e) =>
                  updateDraft(row.draftId, { category: e.target.value as QuestionCategory })
                }
                className="rounded border border-line bg-surface px-1.5 py-1 text-xs"
              >
                {QUESTION_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {CATEGORY_LABELS[c]}
                  </option>
                ))}
              </select>
              <select
                value={row.difficulty}
                onChange={(e) =>
                  updateDraft(row.draftId, { difficulty: e.target.value as QuestionDifficulty })
                }
                className="rounded border border-line bg-surface px-1.5 py-1 text-xs"
              >
                {QUESTION_DIFFICULTIES.map((d) => (
                  <option key={d} value={d}>
                    {DIFFICULTY_LABELS[d]}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => saveToBank(row)}
                disabled={!row.text.trim()}
                className="ml-auto rounded-md px-2 py-1 text-xs font-medium text-on-action disabled:opacity-40"
                style={{ backgroundColor: 'var(--action)' }}
              >
                Save to bank ↗
              </button>
              <button
                type="button"
                onClick={() => removeDraft(row.draftId)}
                aria-label="Remove question row"
                title="Remove question row"
                className="text-muted hover:text-ink"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default QuestionCapture;
