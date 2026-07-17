import { Play, Plus } from 'lucide-react';
import { useState } from 'react';
import QuestionBankImportExportMenu from '../components/questions/QuestionBankImportExportMenu';
import QuestionEditorSheet from '../components/questions/QuestionEditorSheet';
import QuestionFilters from '../components/questions/QuestionFilters';
import QuestionRow from '../components/questions/QuestionRow';
import PracticeMode from '../components/questions/PracticeMode';
import { matchesQuestionFilters, NO_QUESTION_FILTERS } from '../lib/questionFilters';
import { useBoardStore } from '../store/useBoardStore';
import { useQuestionStore } from '../store/useQuestionStore';

function QuestionsPage() {
  const questions = useQuestionStore((s) => s.questions);
  const applications = useBoardStore((s) => s.applications);
  const [filters, setFilters] = useState(NO_QUESTION_FILTERS);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [practicing, setPracticing] = useState(false);

  const companies = Array.from(
    new Map(
      questions
        .flatMap((q) => q.companyIds)
        .map((id) => applications.find((a) => a.id === id))
        .filter((a): a is NonNullable<typeof a> => a !== undefined)
        .map((a) => [a.id, a]),
    ).values(),
  );

  const filtered = questions.filter((q) => matchesQuestionFilters(q, filters));
  const selectedQuestion = questions.find((q) => q.id === selectedQuestionId);

  return (
    <div>
      <div className="flex items-center justify-between px-4 pt-4">
        <h1 className="text-xl font-semibold">Question Bank</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPracticing(true)}
            disabled={filtered.length === 0}
            className="flex items-center gap-1 rounded-md border border-line px-2.5 py-1.5 text-sm text-muted hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Play size={14} /> Practice
          </button>
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-sm font-medium text-on-action"
            style={{ backgroundColor: 'var(--action)' }}
          >
            <Plus size={14} /> Add question
          </button>
          <QuestionBankImportExportMenu />
        </div>
      </div>

      <QuestionFilters filters={filters} onChange={setFilters} companies={companies} />

      <div className="flex flex-col gap-2 p-4 pt-0">
        {filtered.length === 0 && (
          <p className="text-sm text-muted">
            {questions.length === 0
              ? 'No questions yet — bank them from a round in the Board, or add one directly.'
              : 'No questions match these filters.'}
          </p>
        )}
        {filtered.map((question) => (
          <QuestionRow
            key={question.id}
            question={question}
            onClick={() => setSelectedQuestionId(question.id)}
          />
        ))}
      </div>

      {selectedQuestion && (
        <QuestionEditorSheet
          question={selectedQuestion}
          onClose={() => setSelectedQuestionId(null)}
        />
      )}
      {creating && <QuestionEditorSheet onClose={() => setCreating(false)} />}
      {practicing && (
        <PracticeMode questions={filtered} onExit={() => setPracticing(false)} />
      )}
    </div>
  );
}

export default QuestionsPage;
