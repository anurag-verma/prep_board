import { describe, expect, it } from 'vitest';
import { makeApplication, makeStage } from '../test/fixtures';
import { applicationsToCsv, escapeCsvField } from './csv';

describe('escapeCsvField', () => {
  it('leaves a plain value untouched', () => {
    expect(escapeCsvField('Acme Corp')).toBe('Acme Corp');
  });

  it.each([
    ['=cmd|\'/c calc\'!A1', "'=cmd|'/c calc'!A1"],
    ['+1+1', "'+1+1"],
    ['-1+1', "'-1+1"],
    ['@SUM(A1:A10)', "'@SUM(A1:A10)"],
  ])('prefixes a formula-injection payload starting with a trigger char: %s', (input, expected) => {
    expect(escapeCsvField(input)).toBe(expected);
  });

  it('does not prefix a value that merely contains a trigger char mid-string', () => {
    expect(escapeCsvField('Salary: 18-24L')).toBe('Salary: 18-24L');
  });

  it('quotes a value containing a comma', () => {
    expect(escapeCsvField('Bengaluru, India')).toBe('"Bengaluru, India"');
  });

  it('quotes and doubles internal quotes', () => {
    expect(escapeCsvField('Say "hi"')).toBe('"Say ""hi"""');
  });

  it('quotes a value containing a newline', () => {
    expect(escapeCsvField('line1\nline2')).toBe('"line1\nline2"');
  });

  it('applies the formula prefix before quoting, when both are needed', () => {
    expect(escapeCsvField('=A1,B1')).toBe('"\'=A1,B1"');
  });
});

describe('applicationsToCsv', () => {
  const stages = [makeStage({ id: 's1', name: 'Applied' })];

  it('includes a header row and one row per application', () => {
    const app = makeApplication({ stageId: 's1', company: 'Acme', role: 'Engineer' });
    const csv = applicationsToCsv(stages, [app]);
    const lines = csv.split('\r\n');
    expect(lines[0]).toBe(
      'Company,Role,Stage,Location,Remote,Salary Range,Source,Priority,Tags,URL,Created',
    );
    expect(lines[1]).toContain('Acme');
    expect(lines[1]).toContain('Engineer');
    expect(lines[1]).toContain('Applied');
  });

  it('excludes archived applications', () => {
    const app = makeApplication({
      stageId: 's1',
      company: 'Archived Co',
      archivedAt: new Date().toISOString(),
    });
    const csv = applicationsToCsv(stages, [app]);
    expect(csv).not.toContain('Archived Co');
    expect(csv.split('\r\n')).toHaveLength(1); // header only
  });

  it('neutralizes a formula-injection payload in a user-controlled field (company name)', () => {
    const app = makeApplication({
      stageId: 's1',
      company: '=HYPERLINK("http://evil.example","click")',
    });
    const csv = applicationsToCsv(stages, [app]);
    expect(csv).toContain("'=HYPERLINK");
    // the raw (unprefixed) formula string must not appear anywhere
    expect(csv).not.toMatch(/(?<!')=HYPERLINK/);
  });

  it('joins tags with a semicolon so they do not need comma-quoting in the common case', () => {
    const app = makeApplication({ stageId: 's1', tags: ['remote-ok', 'series-b'] });
    const csv = applicationsToCsv(stages, [app]);
    expect(csv).toContain('remote-ok; series-b');
  });

  it('renders priority as Yes/No', () => {
    const app = makeApplication({ stageId: 's1', priority: true });
    const csv = applicationsToCsv(stages, [app]);
    expect(csv.split('\r\n')[1]).toContain('Yes');
  });

  it('falls back to the raw stageId if the stage cannot be resolved', () => {
    const app = makeApplication({ stageId: 'ghost-stage' });
    const csv = applicationsToCsv(stages, [app]);
    expect(csv).toContain('ghost-stage');
  });
});
