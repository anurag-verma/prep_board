export interface AppData {
  schemaVersion: number;
  stages: Stage[]; // ordered — defines board columns
  applications: Application[];
  questions: Question[];
}

export interface Stage {
  id: string;
  name: string; // "Applied", "Interviewing"…
  color: string; // column accent
  isTerminal: boolean; // Offer / Rejected — excluded from "stale" logic
}

export interface Application {
  id: string;
  company: string;
  role: string;
  stageId: string;
  url?: string;
  location?: string;
  remote?: 'onsite' | 'hybrid' | 'remote';
  salaryRange?: string;
  source?: string; // referral, LinkedIn, careers page…
  resumeVersion?: string; // ties into ResumeForge!
  priority: boolean;
  tags: string[];
  contacts: Contact[];
  notes: string; // markdown-lite
  rounds: Round[];
  events: TimelineEvent[]; // append-only log
  createdAt: string;
  archivedAt: string | null;
}

export interface Contact {
  id: string;
  name: string;
  role?: string;
  email?: string;
}

export type TimelineEventType = 'created' | 'stage_change' | 'round_added' | 'note' | 'custom';

export interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  at: string; // ISO datetime
  label: string; // "Moved to Interviewing"
  fromStageId?: string;
  toStageId?: string;
}

export type RoundType =
  | 'phone_screen'
  | 'oa'
  | 'technical'
  | 'system_design'
  | 'behavioral'
  | 'hr'
  | 'other';

export type RoundOutcome = 'pending' | 'passed' | 'failed' | 'no_response';

export interface Round {
  id: string;
  type: RoundType;
  date: string; // ISO date
  interviewers?: string;
  durationMins?: number;
  outcome: RoundOutcome;
  prepNotes: string;
  reflectionNotes: string;
  questionIds: string[]; // refs into question bank
}

export type QuestionCategory = 'dsa' | 'system_design' | 'behavioral' | 'sql' | 'domain' | 'other';

export type QuestionDifficulty = 'easy' | 'medium' | 'hard';

export type ConfidenceRating = 1 | 2 | 3 | 4 | 5;

export interface Question {
  id: string;
  text: string;
  category: QuestionCategory;
  difficulty: QuestionDifficulty;
  answerNotes: string; // markdown-lite
  confidence: ConfidenceRating;
  companyIds: string[]; // application ids where it appeared
  createdAt: string;
  lastReviewedAt: string | null;
}

// Fixed ids (not nanoid) so a fresh app load is deterministic; user-added
// stages get real nanoid ids via the store.
export const DEFAULT_STAGES: Stage[] = [
  { id: 'wishlist', name: 'Wishlist', color: '#8A8F98', isTerminal: false },
  { id: 'applied', name: 'Applied', color: '#3B6EA5', isTerminal: false },
  { id: 'oa', name: 'OA', color: '#7C5CB0', isTerminal: false },
  { id: 'interviewing', name: 'Interviewing', color: '#C77D1F', isTerminal: false },
  { id: 'offer', name: 'Offer', color: '#0F6B54', isTerminal: true },
  { id: 'rejected', name: 'Rejected', color: '#9AA0A6', isTerminal: true },
];
