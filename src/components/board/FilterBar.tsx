import { Archive, ChevronDown, Flag, Search, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useBoardStore } from '../../store/useBoardStore';
import { useUiStore } from '../../store/useUiStore';
import { usePopoverBehavior } from '../ui/usePopoverBehavior';

const DEBOUNCE_MS = 150;

function FilterBar() {
  const applications = useBoardStore((s) => s.applications);
  const searchText = useUiStore((s) => s.searchText);
  const priorityOnly = useUiStore((s) => s.priorityOnly);
  const selectedTags = useUiStore((s) => s.selectedTags);
  const showArchived = useUiStore((s) => s.showArchived);
  const setSearchText = useUiStore((s) => s.setSearchText);
  const togglePriorityOnly = useUiStore((s) => s.togglePriorityOnly);
  const setSelectedTags = useUiStore((s) => s.setSelectedTags);
  const toggleShowArchived = useUiStore((s) => s.toggleShowArchived);
  const clearFilters = useUiStore((s) => s.clearFilters);

  const [searchInput, setSearchInput] = useState(searchText);
  const [tagMenuOpen, setTagMenuOpen] = useState(false);
  const closeTagMenu = useCallback(() => setTagMenuOpen(false), []);
  const tagMenuRef = usePopoverBehavior<HTMLDivElement>(tagMenuOpen, closeTagMenu);

  useEffect(() => {
    const timer = setTimeout(() => setSearchText(searchInput), DEBOUNCE_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const allTags = Array.from(new Set(applications.flatMap((app) => app.tags))).sort();

  function toggleTag(tag: string) {
    setSelectedTags(
      selectedTags.includes(tag)
        ? selectedTags.filter((t) => t !== tag)
        : [...selectedTags, tag],
    );
  }

  const hasActiveFilters =
    searchInput.trim() !== '' || priorityOnly || selectedTags.length > 0 || showArchived;

  function handleClearAll() {
    setSearchInput('');
    clearFilters();
  }

  return (
    <div className="flex items-center gap-2 px-4 pb-2 pt-4">
      <div className="relative w-64">
        <Search
          aria-hidden
          size={14}
          className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-muted"
        />
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search company, role, tags…"
          aria-label="Search applications"
          className="w-full rounded-md border border-line bg-surface py-1.5 pl-7 pr-2 text-sm outline-none focus:border-action"
        />
      </div>

      <button
        type="button"
        onClick={togglePriorityOnly}
        aria-pressed={priorityOnly}
        className="flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-sm hover:bg-bg"
        style={
          priorityOnly
            ? { borderColor: 'var(--flag)', color: 'var(--flag-text)' }
            : { borderColor: 'var(--line)', color: 'var(--muted)' }
        }
      >
        <Flag size={14} /> Priority
      </button>

      <div className="relative" ref={tagMenuRef}>
        <button
          type="button"
          onClick={() => setTagMenuOpen((o) => !o)}
          aria-haspopup="true"
          aria-expanded={tagMenuOpen}
          className="flex items-center gap-1 rounded-md border border-line px-2.5 py-1.5 text-sm text-muted hover:bg-bg hover:text-ink"
        >
          Tags{selectedTags.length > 0 ? ` (${selectedTags.length})` : ''}
          <ChevronDown size={14} />
        </button>
        {tagMenuOpen && (
          <div
            role="group"
            aria-label="Filter by tag"
            className="absolute left-0 z-10 mt-1 max-h-56 w-48 overflow-y-auto rounded-md border border-line bg-surface p-1 [box-shadow:var(--shadow-popover)]"
          >
            {allTags.length === 0 && <p className="px-2 py-1 text-xs text-muted">No tags yet.</p>}
            {allTags.map((tag) => (
              <label
                key={tag}
                className="flex items-center gap-2 rounded px-2 py-1 text-sm hover:bg-bg"
              >
                <input
                  type="checkbox"
                  checked={selectedTags.includes(tag)}
                  onChange={() => toggleTag(tag)}
                />
                {tag}
              </label>
            ))}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={toggleShowArchived}
        aria-pressed={showArchived}
        className="flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-sm hover:bg-bg"
        style={
          showArchived
            ? { borderColor: 'var(--action)', color: 'var(--action)' }
            : { borderColor: 'var(--line)', color: 'var(--muted)' }
        }
      >
        <Archive size={14} /> Show archived
      </button>

      {hasActiveFilters && (
        <button
          type="button"
          onClick={handleClearAll}
          className="flex items-center gap-1 text-sm text-muted hover:text-ink"
        >
          <X size={14} /> Clear all
        </button>
      )}
    </div>
  );
}

export default FilterBar;
