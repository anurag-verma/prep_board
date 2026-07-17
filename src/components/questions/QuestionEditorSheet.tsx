import { format } from 'date-fns';
import { X } from 'lucide-react';
import { useState } from 'react';
import {
  CATEGORY_LABELS,
  DIFFICULTY_LABELS,
  QUESTION_CATEGORIES,
  QUESTION_DIFFICULTIES,
} from '../../lib/questionLabels';
import { resolveCompanyName } from '../../lib/resolveCompanyName';
import { useBoardStore } from '../../store/useBoardStore';
import { useQuestionStore } from '../../store/useQuestionStore';
import type { ConfidenceRating, Question, QuestionCategory, QuestionDifficulty } from '../../types/models';
import MarkdownLiteEditor from '../ui/MarkdownLiteEditor';
import Sheet from '../ui/Sheet';

interface QuestionEditorSheetProps {
  /** Omit to render in "create" mode: a blank form with its own Save button,
   * committing on submit rather than per-field. */
  question?: Question;
  onClose: () => void;
}

const CONFIDENCE_VALUES: ConfidenceRating[] = [1, 2, 3, 4, 5];

function QuestionEditorSheet({ question, onClose }: QuestionEditorSheetProps) {
  const addQuestion = useQuestionStore((s) => s.addQuestion);
  const updateQuestion = useQuestionStore((s) => s.updateQuestion);
  const applications = useBoardStore((s) => s.applications);

  const isCreating = question === undefined;

  const [text, setText] = useState(question?.text ?? '');
  const [category, setCategory] = useState<QuestionCategory>(question?.category ?? 'dsa');
  const [difficulty, setDifficulty] = useState<QuestionDifficulty>(question?.difficulty ?? 'medium');
  const [confidence, setConfidence] = useState<ConfidenceRating>(question?.confidence ?? 3);
  const [answerNotes, setAnswerNotes] = useState(question?.answerNotes ?? '');

  function commitText() {
    if (!question) return;
    const trimmed = text.trim();
    if (trimmed && trimmed !== question.text) {
      updateQuestion(question.id, { text: trimmed });
    } else {
      setText(question.text);
    }
  }

  function handleCreate() {
    const trimmed = text.trim();
    if (!trimmed) return;
    addQuestion({ text: trimmed, category, difficulty, confidence, answerNotes });
    onClose();
  }

  return (
    <Sheet onClose={onClose} aria-label={isCreating ? 'Add question' : 'Edit question'}>
      <div className="flex items-center justify-between border-b border-line p-4">
        <h2 className="text-lg font-semibold">{isCreating ? 'Add question' : 'Edit question'}</h2>
        <button
          type="button"
          aria-label="Close"
          title="Close"
          onClick={onClose}
          className="rounded p-1.5 text-muted hover:bg-bg hover:text-ink"
        >
          <X size={18} />
        </button>
      </div>

      <div className="flex flex-col gap-4 overflow-y-auto p-4 text-sm">
        <label className="flex flex-col gap-1">
          <span className="font-medium">Question</span>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={commitText}
            rows={3}
            className="resize-none rounded border border-line bg-surface px-2 py-1.5 outline-none focus:border-action"
          />
        </label>

        <div className="flex gap-2">
          <label className="flex flex-1 flex-col gap-1">
            <span className="font-medium">Category</span>
            <select
              value={category}
              onChange={(e) => {
                const value = e.target.value as QuestionCategory;
                setCategory(value);
                if (question) updateQuestion(question.id, { category: value });
              }}
              className="rounded border border-line bg-surface px-2 py-1.5"
            >
              {QUESTION_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABELS[c]}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-1 flex-col gap-1">
            <span className="font-medium">Difficulty</span>
            <select
              value={difficulty}
              onChange={(e) => {
                const value = e.target.value as QuestionDifficulty;
                setDifficulty(value);
                if (question) updateQuestion(question.id, { difficulty: value });
              }}
              className="rounded border border-line bg-surface px-2 py-1.5"
            >
              {QUESTION_DIFFICULTIES.map((d) => (
                <option key={d} value={d}>
                  {DIFFICULTY_LABELS[d]}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex flex-col gap-1">
          <span className="font-medium">Confidence</span>
          <div role="radiogroup" aria-label="Confidence" className="flex gap-1.5">
            {CONFIDENCE_VALUES.map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={confidence === n}
                onClick={() => {
                  setConfidence(n);
                  if (question) updateQuestion(question.id, { confidence: n });
                }}
                className="h-8 w-8 rounded-full border text-sm font-medium hover:bg-bg"
                style={
                  confidence === n
                    ? { borderColor: 'var(--action)', color: 'var(--action)' }
                    : { borderColor: 'var(--line)', color: 'var(--muted)' }
                }
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <span className="font-medium">Answer notes</span>
          <MarkdownLiteEditor
            value={answerNotes}
            onChange={setAnswerNotes}
            onBlur={() => {
              if (question) updateQuestion(question.id, { answerNotes });
            }}
            aria-label="Answer notes"
          />
        </div>

        {question && (
          <>
            <div className="flex flex-col gap-1">
              <span className="font-medium">Companies</span>
              {question.companyIds.length === 0 ? (
                <p className="text-muted">Not linked to any application yet.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {question.companyIds.map((id) => (
                    <span key={id} className="rounded-full bg-bg px-2 py-0.5 text-xs text-muted">
                      {resolveCompanyName(id, applications)}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <span className="font-medium">Last reviewed</span>
              <span className="font-mono text-xs text-muted">
                {question.lastReviewedAt
                  ? format(new Date(question.lastReviewedAt), 'MMM d, yyyy · HH:mm')
                  : 'Never'}
              </span>
            </div>
          </>
        )}

        {isCreating && (
          <button
            type="button"
            onClick={handleCreate}
            disabled={!text.trim()}
            className="rounded-md px-3 py-1.5 text-sm font-medium text-on-action disabled:opacity-40"
            style={{ backgroundColor: 'var(--action)' }}
          >
            Save question
          </button>
        )}
      </div>
    </Sheet>
  );
}

export default QuestionEditorSheet;
