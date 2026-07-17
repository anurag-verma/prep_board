import { CATEGORY_LABELS, DIFFICULTY_LABELS, QUESTION_CATEGORIES, QUESTION_DIFFICULTIES } from '../../lib/questionLabels';
import type { QuestionFilters as QuestionFiltersType } from '../../lib/questionFilters';
import type { Application, ConfidenceRating, QuestionCategory, QuestionDifficulty } from '../../types/models';

interface QuestionFiltersProps {
  filters: QuestionFiltersType;
  onChange: (filters: QuestionFiltersType) => void;
  companies: Pick<Application, 'id' | 'company'>[];
}

function QuestionFilters({ filters, onChange, companies }: QuestionFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 px-4 pb-2">
      <input
        value={filters.searchText}
        onChange={(e) => onChange({ ...filters, searchText: e.target.value })}
        placeholder="Search questions…"
        aria-label="Search questions"
        className="w-56 rounded-md border border-line bg-surface px-2 py-1.5 text-sm outline-none focus:border-action"
      />

      <select
        value={filters.category}
        onChange={(e) => onChange({ ...filters, category: e.target.value as QuestionCategory | '' })}
        aria-label="Filter by category"
        className="rounded-md border border-line bg-surface px-2 py-1.5 text-sm"
      >
        <option value="">All categories</option>
        {QUESTION_CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {CATEGORY_LABELS[c]}
          </option>
        ))}
      </select>

      <select
        value={filters.difficulty}
        onChange={(e) =>
          onChange({ ...filters, difficulty: e.target.value as QuestionDifficulty | '' })
        }
        aria-label="Filter by difficulty"
        className="rounded-md border border-line bg-surface px-2 py-1.5 text-sm"
      >
        <option value="">All difficulties</option>
        {QUESTION_DIFFICULTIES.map((d) => (
          <option key={d} value={d}>
            {DIFFICULTY_LABELS[d]}
          </option>
        ))}
      </select>

      <select
        value={filters.companyId}
        onChange={(e) => onChange({ ...filters, companyId: e.target.value })}
        aria-label="Filter by company"
        className="rounded-md border border-line bg-surface px-2 py-1.5 text-sm"
      >
        <option value="">All companies</option>
        {companies.map((c) => (
          <option key={c.id} value={c.id}>
            {c.company}
          </option>
        ))}
      </select>

      <select
        value={filters.maxConfidence}
        onChange={(e) =>
          onChange({
            ...filters,
            maxConfidence: e.target.value ? (Number(e.target.value) as ConfidenceRating) : '',
          })
        }
        aria-label="Filter by maximum confidence"
        className="rounded-md border border-line bg-surface px-2 py-1.5 text-sm"
      >
        <option value="">Any confidence</option>
        {[1, 2, 3, 4, 5].map((n) => (
          <option key={n} value={n}>
            Confidence ≤ {n}
          </option>
        ))}
      </select>
    </div>
  );
}

export default QuestionFilters;
