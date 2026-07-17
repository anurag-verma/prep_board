import type { Application } from '../types/models';

export interface BoardFilters {
  searchText: string;
  priorityOnly: boolean;
  selectedTags: string[];
}

/** Combines search text (company/role/tags), the priority toggle, and tag
 * multi-select (OR among selected tags) with AND semantics between filters. */
export function matchesFilters(app: Application, filters: BoardFilters): boolean {
  if (filters.priorityOnly && !app.priority) return false;

  if (filters.selectedTags.length > 0) {
    const hasAnySelectedTag = filters.selectedTags.some((tag) => app.tags.includes(tag));
    if (!hasAnySelectedTag) return false;
  }

  const query = filters.searchText.trim().toLowerCase();
  if (query) {
    const haystack = [app.company, app.role, ...app.tags].join(' ').toLowerCase();
    if (!haystack.includes(query)) return false;
  }

  return true;
}
