import { format } from 'date-fns';
import { CATEGORY_LABELS, DIFFICULTY_LABELS } from '../../lib/questionLabels';
import { resolveCompanyName } from '../../lib/resolveCompanyName';
import { useBoardStore } from '../../store/useBoardStore';
import type { Question } from '../../types/models';
import ConfidenceDots from './ConfidenceDots';

interface QuestionRowProps {
  question: Question;
  onClick: () => void;
}

function QuestionRow({ question, onClick }: QuestionRowProps) {
  const applications = useBoardStore((s) => s.applications);

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-card border border-line bg-surface p-3 text-left text-sm [box-shadow:var(--shadow-resting)] transition-shadow hover:[box-shadow:var(--shadow-elevated)]"
    >
      <span className="min-w-0 flex-1 truncate font-medium">{question.text}</span>
      <span className="shrink-0 rounded-full bg-bg px-2 py-0.5 text-xs text-muted">
        {CATEGORY_LABELS[question.category]}
      </span>
      <span className="shrink-0 rounded-full bg-bg px-2 py-0.5 text-xs text-muted">
        {DIFFICULTY_LABELS[question.difficulty]}
      </span>
      <span className="hidden shrink-0 items-center gap-1 sm:flex">
        {question.companyIds.slice(0, 2).map((id) => (
          <span key={id} className="rounded-full bg-bg px-2 py-0.5 text-xs text-muted">
            {resolveCompanyName(id, applications)}
          </span>
        ))}
        {question.companyIds.length > 2 && (
          <span className="text-xs text-muted">+{question.companyIds.length - 2}</span>
        )}
      </span>
      <ConfidenceDots confidence={question.confidence} />
      <span className="hidden w-24 shrink-0 font-mono text-xs text-muted md:block">
        {question.lastReviewedAt ? format(new Date(question.lastReviewedAt), 'MMM d, yyyy') : '—'}
      </span>
    </button>
  );
}

export default QuestionRow;
