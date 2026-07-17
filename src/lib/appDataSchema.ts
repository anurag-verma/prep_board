import { SCHEMA_VERSION } from './schema';
import type {
  AppData,
  Application,
  Contact,
  Question,
  Round,
  Stage,
  TimelineEvent,
} from '../types/models';

export const MAX_IMPORT_BYTES = 2 * 1024 * 1024; // 2 MB, per Security doc §4.4

export type ValidationResult =
  | { valid: true; data: AppData }
  | { valid: false; errors: string[] };

const ROUND_TYPES = new Set([
  'phone_screen',
  'oa',
  'technical',
  'system_design',
  'behavioral',
  'hr',
  'other',
]);
const ROUND_OUTCOMES = new Set(['pending', 'passed', 'failed', 'no_response']);
const QUESTION_CATEGORIES = new Set(['dsa', 'system_design', 'behavioral', 'sql', 'domain', 'other']);
const QUESTION_DIFFICULTIES = new Set(['easy', 'medium', 'hard']);
const CONFIDENCE_RATINGS = new Set([1, 2, 3, 4, 5]);
const TIMELINE_EVENT_TYPES = new Set(['created', 'stage_change', 'round_added', 'note', 'custom']);
const REMOTE_VALUES = new Set(['onsite', 'hybrid', 'remote']);

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isOptionalString(value: unknown): value is string | undefined {
  return value === undefined || typeof value === 'string';
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === 'string');
}

/** Parses and fully validates a JSON string as an `AppData` export. Never
 * "fixes" bad data — collects every problem found and rejects. Unknown keys
 * on every object are silently stripped (never carried into the app). */
export function parseAndValidateAppData(raw: string): ValidationResult {
  if (raw.length > MAX_IMPORT_BYTES) {
    return { valid: false, errors: [`File is too large (max ${MAX_IMPORT_BYTES / (1024 * 1024)} MB).`] };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { valid: false, errors: ['File is not valid JSON.'] };
  }

  return validateAppData(parsed);
}

export function validateAppData(parsed: unknown): ValidationResult {
  const errors: string[] = [];

  if (!isPlainObject(parsed)) {
    return { valid: false, errors: ['Root value must be an object.'] };
  }

  if (parsed.schemaVersion !== SCHEMA_VERSION) {
    errors.push(
      `Unsupported schemaVersion (expected ${SCHEMA_VERSION}, got ${JSON.stringify(parsed.schemaVersion)}).`,
    );
  }

  if (!Array.isArray(parsed.stages)) {
    errors.push('stages must be an array.');
  }
  if (!Array.isArray(parsed.applications)) {
    errors.push('applications must be an array.');
  }
  if (!Array.isArray(parsed.questions)) {
    errors.push('questions must be an array.');
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  const rawStages = parsed.stages as unknown[];
  const rawApplications = parsed.applications as unknown[];
  const rawQuestions = parsed.questions as unknown[];

  const stages: Stage[] = [];
  rawStages.forEach((raw, i) => {
    const stage = validateStage(raw, `stages[${i}]`, errors);
    if (stage) stages.push(stage);
  });

  if (stages.length < 2 || stages.length > 8) {
    errors.push(`stages must have between 2 and 8 entries (got ${stages.length}).`);
  }

  const stageIds = new Set(stages.map((s) => s.id));
  if (stageIds.size !== stages.length) {
    errors.push('stages contain duplicate ids.');
  }

  const questions: Question[] = [];
  rawQuestions.forEach((raw, i) => {
    const question = validateQuestion(raw, `questions[${i}]`, errors);
    if (question) questions.push(question);
  });
  const questionIds = new Set(questions.map((q) => q.id));

  const applications: Application[] = [];
  rawApplications.forEach((raw, i) => {
    const app = validateApplication(raw, `applications[${i}]`, stageIds, questionIds, errors);
    if (app) applications.push(app);
  });

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    data: { schemaVersion: SCHEMA_VERSION, stages, applications, questions },
  };
}

function validateStage(raw: unknown, path: string, errors: string[]): Stage | null {
  if (!isPlainObject(raw)) {
    errors.push(`${path} must be an object.`);
    return null;
  }
  const { id, name, color, isTerminal } = raw;
  let ok = true;
  if (!isString(id)) {
    errors.push(`${path}.id must be a string.`);
    ok = false;
  }
  if (!isString(name)) {
    errors.push(`${path}.name must be a string.`);
    ok = false;
  }
  if (!isString(color)) {
    errors.push(`${path}.color must be a string.`);
    ok = false;
  }
  if (!isBoolean(isTerminal)) {
    errors.push(`${path}.isTerminal must be a boolean.`);
    ok = false;
  }
  if (!ok) return null;
  return { id: id as string, name: name as string, color: color as string, isTerminal: isTerminal as boolean };
}

function validateContact(raw: unknown, path: string, errors: string[]): Contact | null {
  if (!isPlainObject(raw)) {
    errors.push(`${path} must be an object.`);
    return null;
  }
  const { id, name, role, email } = raw;
  let ok = true;
  if (!isString(id)) {
    errors.push(`${path}.id must be a string.`);
    ok = false;
  }
  if (!isString(name)) {
    errors.push(`${path}.name must be a string.`);
    ok = false;
  }
  if (!isOptionalString(role)) {
    errors.push(`${path}.role must be a string if present.`);
    ok = false;
  }
  if (!isOptionalString(email)) {
    errors.push(`${path}.email must be a string if present.`);
    ok = false;
  }
  if (!ok) return null;
  return {
    id: id as string,
    name: name as string,
    role: role as string | undefined,
    email: email as string | undefined,
  };
}

function validateTimelineEvent(raw: unknown, path: string, errors: string[]): TimelineEvent | null {
  if (!isPlainObject(raw)) {
    errors.push(`${path} must be an object.`);
    return null;
  }
  const { id, type, at, label, fromStageId, toStageId } = raw;
  let ok = true;
  if (!isString(id)) {
    errors.push(`${path}.id must be a string.`);
    ok = false;
  }
  if (!isString(type) || !TIMELINE_EVENT_TYPES.has(type)) {
    errors.push(`${path}.type must be one of ${[...TIMELINE_EVENT_TYPES].join(', ')}.`);
    ok = false;
  }
  if (!isString(at)) {
    errors.push(`${path}.at must be a string.`);
    ok = false;
  }
  if (!isString(label)) {
    errors.push(`${path}.label must be a string.`);
    ok = false;
  }
  if (!isOptionalString(fromStageId)) {
    errors.push(`${path}.fromStageId must be a string if present.`);
    ok = false;
  }
  if (!isOptionalString(toStageId)) {
    errors.push(`${path}.toStageId must be a string if present.`);
    ok = false;
  }
  if (!ok) return null;
  return {
    id: id as string,
    type: type as TimelineEvent['type'],
    at: at as string,
    label: label as string,
    fromStageId: fromStageId as string | undefined,
    toStageId: toStageId as string | undefined,
  };
}

function validateRound(
  raw: unknown,
  path: string,
  questionIds: Set<string>,
  errors: string[],
): Round | null {
  if (!isPlainObject(raw)) {
    errors.push(`${path} must be an object.`);
    return null;
  }
  const { id, type, date, interviewers, durationMins, outcome, prepNotes, reflectionNotes, questionIds: qids } = raw;
  let ok = true;
  if (!isString(id)) {
    errors.push(`${path}.id must be a string.`);
    ok = false;
  }
  if (!isString(type) || !ROUND_TYPES.has(type)) {
    errors.push(`${path}.type must be one of ${[...ROUND_TYPES].join(', ')}.`);
    ok = false;
  }
  if (!isString(date)) {
    errors.push(`${path}.date must be a string.`);
    ok = false;
  }
  if (!isOptionalString(interviewers)) {
    errors.push(`${path}.interviewers must be a string if present.`);
    ok = false;
  }
  if (durationMins !== undefined && typeof durationMins !== 'number') {
    errors.push(`${path}.durationMins must be a number if present.`);
    ok = false;
  }
  if (!isString(outcome) || !ROUND_OUTCOMES.has(outcome)) {
    errors.push(`${path}.outcome must be one of ${[...ROUND_OUTCOMES].join(', ')}.`);
    ok = false;
  }
  if (!isString(prepNotes)) {
    errors.push(`${path}.prepNotes must be a string.`);
    ok = false;
  }
  if (!isString(reflectionNotes)) {
    errors.push(`${path}.reflectionNotes must be a string.`);
    ok = false;
  }
  if (!isStringArray(qids)) {
    errors.push(`${path}.questionIds must be an array of strings.`);
    ok = false;
  } else {
    qids.forEach((qid, i) => {
      if (!questionIds.has(qid)) {
        errors.push(`${path}.questionIds[${i}] references unknown question id "${qid}".`);
        ok = false;
      }
    });
  }
  if (!ok) return null;
  return {
    id: id as string,
    type: type as Round['type'],
    date: date as string,
    interviewers: interviewers as string | undefined,
    durationMins: durationMins as number | undefined,
    outcome: outcome as Round['outcome'],
    prepNotes: prepNotes as string,
    reflectionNotes: reflectionNotes as string,
    questionIds: qids as string[],
  };
}

function validateApplication(
  raw: unknown,
  path: string,
  stageIds: Set<string>,
  questionIds: Set<string>,
  errors: string[],
): Application | null {
  if (!isPlainObject(raw)) {
    errors.push(`${path} must be an object.`);
    return null;
  }
  const {
    id,
    company,
    role,
    stageId,
    url,
    location,
    remote,
    salaryRange,
    source,
    resumeVersion,
    priority,
    tags,
    contacts,
    notes,
    rounds,
    events,
    createdAt,
    archivedAt,
  } = raw;
  let ok = true;

  if (!isString(id)) {
    errors.push(`${path}.id must be a string.`);
    ok = false;
  }
  if (!isString(company)) {
    errors.push(`${path}.company must be a string.`);
    ok = false;
  }
  if (!isString(role)) {
    errors.push(`${path}.role must be a string.`);
    ok = false;
  }
  if (!isString(stageId)) {
    errors.push(`${path}.stageId must be a string.`);
    ok = false;
  } else if (!stageIds.has(stageId)) {
    errors.push(`${path}.stageId references unknown stage id "${stageId}".`);
    ok = false;
  }
  if (!isOptionalString(url)) {
    errors.push(`${path}.url must be a string if present.`);
    ok = false;
  }
  if (!isOptionalString(location)) {
    errors.push(`${path}.location must be a string if present.`);
    ok = false;
  }
  if (remote !== undefined && (!isString(remote) || !REMOTE_VALUES.has(remote))) {
    errors.push(`${path}.remote must be one of ${[...REMOTE_VALUES].join(', ')} if present.`);
    ok = false;
  }
  if (!isOptionalString(salaryRange)) {
    errors.push(`${path}.salaryRange must be a string if present.`);
    ok = false;
  }
  if (!isOptionalString(source)) {
    errors.push(`${path}.source must be a string if present.`);
    ok = false;
  }
  if (!isOptionalString(resumeVersion)) {
    errors.push(`${path}.resumeVersion must be a string if present.`);
    ok = false;
  }
  if (!isBoolean(priority)) {
    errors.push(`${path}.priority must be a boolean.`);
    ok = false;
  }
  if (!isStringArray(tags)) {
    errors.push(`${path}.tags must be an array of strings.`);
    ok = false;
  }
  if (!isString(notes)) {
    errors.push(`${path}.notes must be a string.`);
    ok = false;
  }
  if (!isString(createdAt)) {
    errors.push(`${path}.createdAt must be a string.`);
    ok = false;
  }
  if (archivedAt !== null && !isString(archivedAt)) {
    errors.push(`${path}.archivedAt must be a string or null.`);
    ok = false;
  }

  const validContacts: Contact[] = [];
  if (!Array.isArray(contacts)) {
    errors.push(`${path}.contacts must be an array.`);
    ok = false;
  } else {
    contacts.forEach((c, i) => {
      const contact = validateContact(c, `${path}.contacts[${i}]`, errors);
      if (contact) validContacts.push(contact);
      else ok = false;
    });
  }

  const validRounds: Round[] = [];
  if (!Array.isArray(rounds)) {
    errors.push(`${path}.rounds must be an array.`);
    ok = false;
  } else {
    rounds.forEach((r, i) => {
      const round = validateRound(r, `${path}.rounds[${i}]`, questionIds, errors);
      if (round) validRounds.push(round);
      else ok = false;
    });
  }

  const validEvents: TimelineEvent[] = [];
  if (!Array.isArray(events)) {
    errors.push(`${path}.events must be an array.`);
    ok = false;
  } else {
    events.forEach((e, i) => {
      const event = validateTimelineEvent(e, `${path}.events[${i}]`, errors);
      if (event) validEvents.push(event);
      else ok = false;
    });
  }

  if (!ok) return null;

  return {
    id: id as string,
    company: company as string,
    role: role as string,
    stageId: stageId as string,
    url: url as string | undefined,
    location: location as string | undefined,
    remote: remote as Application['remote'],
    salaryRange: salaryRange as string | undefined,
    source: source as string | undefined,
    resumeVersion: resumeVersion as string | undefined,
    priority: priority as boolean,
    tags: tags as string[],
    contacts: validContacts,
    notes: notes as string,
    rounds: validRounds,
    events: validEvents,
    createdAt: createdAt as string,
    archivedAt: archivedAt as string | null,
  };
}

export function validateQuestion(raw: unknown, path: string, errors: string[]): Question | null {
  if (!isPlainObject(raw)) {
    errors.push(`${path} must be an object.`);
    return null;
  }
  const {
    id,
    text,
    category,
    difficulty,
    answerNotes,
    confidence,
    companyIds,
    createdAt,
    lastReviewedAt,
  } = raw;
  let ok = true;

  if (!isString(id)) {
    errors.push(`${path}.id must be a string.`);
    ok = false;
  }
  if (!isString(text)) {
    errors.push(`${path}.text must be a string.`);
    ok = false;
  }
  if (!isString(category) || !QUESTION_CATEGORIES.has(category)) {
    errors.push(`${path}.category must be one of ${[...QUESTION_CATEGORIES].join(', ')}.`);
    ok = false;
  }
  if (!isString(difficulty) || !QUESTION_DIFFICULTIES.has(difficulty)) {
    errors.push(`${path}.difficulty must be one of ${[...QUESTION_DIFFICULTIES].join(', ')}.`);
    ok = false;
  }
  if (!isString(answerNotes)) {
    errors.push(`${path}.answerNotes must be a string.`);
    ok = false;
  }
  if (typeof confidence !== 'number' || !CONFIDENCE_RATINGS.has(confidence)) {
    errors.push(`${path}.confidence must be one of 1, 2, 3, 4, 5.`);
    ok = false;
  }
  // companyIds is a soft reference (Frontend spec §6: a deleted application's
  // chip shows "(archived)" rather than the import/app breaking), so we only
  // type-check it here, not check it resolves to a real application.
  if (!isStringArray(companyIds)) {
    errors.push(`${path}.companyIds must be an array of strings.`);
    ok = false;
  }
  if (!isString(createdAt)) {
    errors.push(`${path}.createdAt must be a string.`);
    ok = false;
  }
  if (lastReviewedAt !== null && !isString(lastReviewedAt)) {
    errors.push(`${path}.lastReviewedAt must be a string or null.`);
    ok = false;
  }
  if (!ok) return null;

  return {
    id: id as string,
    text: text as string,
    category: category as Question['category'],
    difficulty: difficulty as Question['difficulty'],
    answerNotes: answerNotes as string,
    confidence: confidence as Question['confidence'],
    companyIds: companyIds as string[],
    createdAt: createdAt as string,
    lastReviewedAt: lastReviewedAt as string | null,
  };
}
