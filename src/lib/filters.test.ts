import { describe, expect, it } from 'vitest';
import { makeApplication } from '../test/fixtures';
import { matchesFilters } from './filters';

const noFilters = { searchText: '', priorityOnly: false, selectedTags: [] };

describe('matchesFilters', () => {
  it('matches everything when no filters are active', () => {
    const app = makeApplication();
    expect(matchesFilters(app, noFilters)).toBe(true);
  });

  it('matches search text against company (case-insensitive)', () => {
    const app = makeApplication({ company: 'Acme Corp' });
    expect(matchesFilters(app, { ...noFilters, searchText: 'acme' })).toBe(true);
    expect(matchesFilters(app, { ...noFilters, searchText: 'globex' })).toBe(false);
  });

  it('matches search text against role', () => {
    const app = makeApplication({ role: 'Frontend Engineer' });
    expect(matchesFilters(app, { ...noFilters, searchText: 'frontend' })).toBe(true);
  });

  it('matches search text against tags', () => {
    const app = makeApplication({ tags: ['remote-ok', 'series-b'] });
    expect(matchesFilters(app, { ...noFilters, searchText: 'series-b' })).toBe(true);
  });

  it('priorityOnly excludes non-priority applications', () => {
    const app = makeApplication({ priority: false });
    expect(matchesFilters(app, { ...noFilters, priorityOnly: true })).toBe(false);
  });

  it('priorityOnly includes priority applications', () => {
    const app = makeApplication({ priority: true });
    expect(matchesFilters(app, { ...noFilters, priorityOnly: true })).toBe(true);
  });

  it('selectedTags matches if the app has ANY of the selected tags', () => {
    const app = makeApplication({ tags: ['remote-ok'] });
    expect(matchesFilters(app, { ...noFilters, selectedTags: ['remote-ok', 'urgent'] })).toBe(
      true,
    );
  });

  it('selectedTags excludes an app with none of the selected tags', () => {
    const app = makeApplication({ tags: ['onsite'] });
    expect(matchesFilters(app, { ...noFilters, selectedTags: ['remote-ok'] })).toBe(false);
  });

  it('combines filters with AND semantics', () => {
    const app = makeApplication({ company: 'Acme Corp', priority: true, tags: ['remote-ok'] });

    // all three match
    expect(
      matchesFilters(app, { searchText: 'acme', priorityOnly: true, selectedTags: ['remote-ok'] }),
    ).toBe(true);

    // search matches but priority doesn't
    expect(
      matchesFilters(
        { ...app, priority: false },
        { searchText: 'acme', priorityOnly: true, selectedTags: ['remote-ok'] },
      ),
    ).toBe(false);

    // priority and tag match but search text doesn't
    expect(
      matchesFilters(app, { searchText: 'globex', priorityOnly: true, selectedTags: ['remote-ok'] }),
    ).toBe(false);
  });
});
