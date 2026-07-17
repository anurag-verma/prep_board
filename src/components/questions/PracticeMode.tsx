import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  buildPracticeDeck,
  summarizeSession,
  type PracticeReview,
  type SessionLength,
} from '../../lib/practice';
import { CATEGORY_LABELS } from '../../lib/questionLabels';
import { resolveCompanyName } from '../../lib/resolveCompanyName';
import { useBoardStore } from '../../store/useBoardStore';
import { useQuestionStore } from '../../store/useQuestionStore';
import type { Application, ConfidenceRating, Question } from '../../types/models';
import MarkdownLiteRenderer from '../ui/MarkdownLiteRenderer';
import { usePrefersReducedMotion } from '../ui/usePrefersReducedMotion';

interface PracticeModeProps {
  /** Already filtered by the page's active Question Bank filters. */
  questions: Question[];
  onExit: () => void;
}

type Phase = 'picking' | 'reviewing' | 'summary';

const CONFIDENCE_VALUES: ConfidenceRating[] = [1, 2, 3, 4, 5];
const SESSION_LENGTHS: SessionLength[] = [10, 25, 'all'];

function PracticeMode({ questions, onExit }: PracticeModeProps) {
  const applications = useBoardStore((s) => s.applications);
  const updateQuestion = useQuestionStore((s) => s.updateQuestion);

  const [phase, setPhase] = useState<Phase>('picking');
  const [deck, setDeck] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [reviews, setReviews] = useState<PracticeReview[]>([]);

  const current = deck[index];

  function startSession(length: SessionLength) {
    setDeck(buildPracticeDeck(questions, length));
    setIndex(0);
    setFlipped(false);
    setReviews([]);
    setPhase('reviewing');
  }

  function handleRate(rating: ConfidenceRating) {
    if (!current) return;
    updateQuestion(current.id, { confidence: rating, lastReviewedAt: new Date().toISOString() });
    setReviews((prev) => [...prev, { before: current.confidence, after: rating }]);

    if (index + 1 >= deck.length) {
      setPhase('summary');
    } else {
      setIndex((i) => i + 1);
      setFlipped(false);
    }
  }

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onExit();
        return;
      }
      if (phase !== 'reviewing') return;
      if (e.key === ' ' && !flipped) {
        e.preventDefault();
        setFlipped(true);
        return;
      }
      if (flipped && /^[1-5]$/.test(e.key)) {
        e.preventDefault();
        handleRate(Number(e.key) as ConfidenceRating);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, flipped, index, deck]);

  const summary = summarizeSession(reviews);

  return (
    <div className="fixed inset-0 z-30 flex flex-col bg-surface">
      <div className="flex items-center justify-between border-b border-line p-4">
        <span className="text-sm font-medium">Practice</span>
        <button
          type="button"
          aria-label="Exit practice"
          title="Exit practice"
          onClick={onExit}
          className="rounded p-1.5 text-muted hover:bg-bg hover:text-ink"
        >
          <X size={18} />
        </button>
      </div>

      {phase === 'reviewing' && deck.length > 0 && (
        <div
          className="h-1 w-full bg-line"
          role="progressbar"
          aria-valuenow={index}
          aria-valuemin={0}
          aria-valuemax={deck.length}
          aria-label={`Practice session progress: question ${index + 1} of ${deck.length}`}
        >
          <div
            className="h-1 bg-action transition-all"
            style={{ width: `${(index / deck.length) * 100}%` }}
          />
        </div>
      )}

      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
        {phase === 'picking' && (
          <div className="flex flex-col items-center gap-4">
            <p className="text-sm text-muted">
              {questions.length} question{questions.length === 1 ? '' : 's'} match your current
              filters.
            </p>
            <div className="flex gap-2">
              {SESSION_LENGTHS.map((length) => (
                <button
                  key={String(length)}
                  type="button"
                  disabled={questions.length === 0}
                  onClick={() => startSession(length)}
                  className="rounded-md border border-line px-4 py-2 text-sm font-medium hover:border-action hover:text-action disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {length === 'all' ? `All (${questions.length})` : length}
                </button>
              ))}
            </div>
          </div>
        )}

        {phase === 'reviewing' && current && (
          <>
            <FlashCard
              question={current}
              flipped={flipped}
              onFlip={() => setFlipped(true)}
              applications={applications}
            />
            {flipped && (
              <div className="flex flex-col items-center gap-2">
                <p className="text-sm font-medium">How confident?</p>
                <div role="radiogroup" aria-label="How confident?" className="flex gap-2">
                  {CONFIDENCE_VALUES.map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => handleRate(n)}
                      className="h-10 w-10 rounded-full border border-line text-sm font-medium hover:border-action hover:text-action"
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {phase === 'summary' && (
          <div className="flex flex-col items-center gap-4 text-center">
            <p className="text-lg font-semibold">
              {summary.count} reviewed · avg confidence {summary.avgConfidence.toFixed(1)} (
              {summary.delta >= 0 ? '+' : ''}
              {summary.delta.toFixed(1)})
            </p>
            <button
              type="button"
              onClick={onExit}
              className="rounded-md px-4 py-2 text-sm font-medium text-on-action"
              style={{ backgroundColor: 'var(--action)' }}
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

interface FlashCardProps {
  question: Question;
  flipped: boolean;
  onFlip: () => void;
  applications: Application[];
}

function FlashCard({ question, flipped, onFlip, applications }: FlashCardProps) {
  const [visible, setVisible] = useState(true);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    setVisible(false);
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, [flipped, question.id]);

  return (
    <button
      type="button"
      onClick={() => {
        if (!flipped) onFlip();
      }}
      className={`flex w-full max-w-lg flex-col gap-3 rounded-column border border-line bg-surface p-8 text-left [box-shadow:var(--shadow-popover)] transition-opacity ${
        prefersReducedMotion ? '' : 'duration-[250ms]'
      } ${visible ? 'opacity-100' : 'opacity-0'}`}
    >
      {!flipped ? (
        <>
          <div className="flex flex-wrap gap-1.5">
            <span className="rounded-full bg-bg px-2 py-0.5 text-xs text-muted">
              {CATEGORY_LABELS[question.category]}
            </span>
            {question.companyIds.map((id) => (
              <span key={id} className="rounded-full bg-bg px-2 py-0.5 text-xs text-muted">
                {resolveCompanyName(id, applications)}
              </span>
            ))}
          </div>
          <p className="text-lg font-medium">{question.text}</p>
          <p className="text-xs text-muted">Press Space or click to flip</p>
        </>
      ) : (
        <>
          <p className="text-xs font-medium text-muted">Your notes</p>
          {question.answerNotes ? (
            <MarkdownLiteRenderer text={question.answerNotes} className="text-sm" />
          ) : (
            <p className="text-sm text-muted">No answer notes yet.</p>
          )}
        </>
      )}
    </button>
  );
}

export default PracticeMode;
