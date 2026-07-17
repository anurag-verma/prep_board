import {
  CheckCircle2,
  Clock,
  Code2,
  Handshake,
  MailQuestion,
  MoreHorizontal,
  Network,
  Phone,
  Users,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import type { Round, RoundOutcome, RoundType } from '../../types/models';

export const ROUND_TYPE_LABELS: Record<RoundType, string> = {
  phone_screen: 'Phone Screen',
  oa: 'OA',
  technical: 'Technical',
  system_design: 'System Design',
  behavioral: 'Behavioral',
  hr: 'HR',
  other: 'Other',
};

export const ROUND_TYPE_ICONS: Record<RoundType, LucideIcon> = {
  phone_screen: Phone,
  oa: Clock,
  technical: Code2,
  system_design: Network,
  behavioral: Users,
  hr: Handshake,
  other: MoreHorizontal,
};

export const OUTCOME_LABELS: Record<RoundOutcome, string> = {
  pending: 'Pending',
  passed: 'Passed',
  failed: 'Failed',
  no_response: 'No response',
};

export const OUTCOME_ICONS: Record<RoundOutcome, LucideIcon> = {
  pending: Clock,
  passed: CheckCircle2,
  failed: XCircle,
  no_response: MailQuestion,
};

/** Used as both border and TEXT color for outcome chips, so each must clear
 * the 4.5:1 text-contrast bar — `--flag` itself only clears 3:1 (fine for
 * icons, not text), hence `--flag-text` here specifically. */
export const OUTCOME_COLORS: Record<RoundOutcome, string> = {
  pending: 'var(--muted)',
  passed: 'var(--win)',
  failed: 'var(--danger)',
  no_response: 'var(--flag-text)',
};

export const ROUND_TYPES: RoundType[] = [
  'phone_screen',
  'oa',
  'technical',
  'system_design',
  'behavioral',
  'hr',
  'other',
];

export const ROUND_OUTCOMES: RoundOutcome[] = ['pending', 'passed', 'failed', 'no_response'];

export function emptyRoundDraft(): Omit<Round, 'id'> {
  return {
    type: 'technical',
    date: new Date().toISOString().slice(0, 10),
    interviewers: '',
    durationMins: undefined,
    outcome: 'pending',
    prepNotes: '',
    reflectionNotes: '',
    questionIds: [],
  };
}
