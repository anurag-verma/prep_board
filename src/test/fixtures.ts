import { createId } from '../lib/id';
import type {
  AppData,
  Application,
  Contact,
  Question,
  Round,
  Stage,
  TimelineEvent,
} from '../types/models';
import { DEFAULT_STAGES } from '../types/models';

export function makeStage(overrides: Partial<Stage> = {}): Stage {
  return {
    id: createId(),
    name: 'Applied',
    color: '#3B6EA5',
    isTerminal: false,
    ...overrides,
  };
}

export function makeContact(overrides: Partial<Contact> = {}): Contact {
  return {
    id: createId(),
    name: 'Jane Recruiter',
    role: 'Recruiter',
    email: 'jane@example.com',
    ...overrides,
  };
}

export function makeTimelineEvent(overrides: Partial<TimelineEvent> = {}): TimelineEvent {
  return {
    id: createId(),
    type: 'created',
    at: new Date().toISOString(),
    label: 'Application created',
    ...overrides,
  };
}

export function makeRound(overrides: Partial<Round> = {}): Round {
  return {
    id: createId(),
    type: 'technical',
    date: new Date().toISOString().slice(0, 10),
    interviewers: 'Alex, Priya',
    durationMins: 45,
    outcome: 'pending',
    prepNotes: '',
    reflectionNotes: '',
    questionIds: [],
    ...overrides,
  };
}

export function makeQuestion(overrides: Partial<Question> = {}): Question {
  return {
    id: createId(),
    text: 'Reverse a linked list',
    category: 'dsa',
    difficulty: 'medium',
    answerNotes: '',
    confidence: 3,
    companyIds: [],
    createdAt: new Date().toISOString(),
    lastReviewedAt: null,
    ...overrides,
  };
}

export function makeApplication(overrides: Partial<Application> = {}): Application {
  return {
    id: createId(),
    company: 'Acme Corp',
    role: 'Frontend Engineer',
    stageId: DEFAULT_STAGES[0].id,
    priority: false,
    tags: [],
    contacts: [],
    notes: '',
    rounds: [],
    events: [],
    createdAt: new Date().toISOString(),
    archivedAt: null,
    ...overrides,
  };
}

export function makeAppData(overrides: Partial<AppData> = {}): AppData {
  return {
    schemaVersion: 1,
    stages: DEFAULT_STAGES,
    applications: [],
    questions: [],
    ...overrides,
  };
}
