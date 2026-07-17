import type { Application, Stage } from '../types/models';

const FORMULA_TRIGGER_CHARS = ['=', '+', '-', '@'];

/** Escapes one CSV cell: prefixes formula-injection trigger characters with
 * a leading `'` (Security doc §4.4 — so `=cmd|'/c calc'!A1` opens as inert
 * text, not a formula), then applies standard CSV quoting for any value
 * containing a comma, double quote, or newline. */
export function escapeCsvField(value: string): string {
  let field = value;

  if (FORMULA_TRIGGER_CHARS.some((c) => field.startsWith(c))) {
    field = `'${field}`;
  }

  if (/["\r\n,]/.test(field)) {
    field = `"${field.replace(/"/g, '""')}"`;
  }

  return field;
}

const CSV_HEADERS = [
  'Company',
  'Role',
  'Stage',
  'Location',
  'Remote',
  'Salary Range',
  'Source',
  'Priority',
  'Tags',
  'URL',
  'Created',
];

/** Applications table CSV (not a full data export — that's the JSON export
 * from PB-050). Excludes archived applications, matching how the board and
 * stats already treat archives. */
export function applicationsToCsv(stages: Stage[], applications: Application[]): string {
  const stageNames = new Map(stages.map((s) => [s.id, s.name]));

  const rows = applications
    .filter((a) => a.archivedAt === null)
    .map((a) => [
      a.company,
      a.role,
      stageNames.get(a.stageId) ?? a.stageId,
      a.location ?? '',
      a.remote ?? '',
      a.salaryRange ?? '',
      a.source ?? '',
      a.priority ? 'Yes' : 'No',
      a.tags.join('; '),
      a.url ?? '',
      a.createdAt.slice(0, 10),
    ]);

  return [CSV_HEADERS, ...rows]
    .map((row) => row.map((cell) => escapeCsvField(String(cell))).join(','))
    .join('\r\n');
}
