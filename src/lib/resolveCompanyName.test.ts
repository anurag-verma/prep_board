import { describe, expect, it } from 'vitest';
import { makeApplication } from '../test/fixtures';
import { resolveCompanyName } from './resolveCompanyName';

describe('resolveCompanyName', () => {
  it('resolves to the matching application company name', () => {
    const app = makeApplication({ id: 'app-1', company: 'Acme Corp' });
    expect(resolveCompanyName('app-1', [app])).toBe('Acme Corp');
  });

  it('falls back to "(archived)" when the application no longer exists', () => {
    expect(resolveCompanyName('deleted-app', [])).toBe('(archived)');
  });
});
