import { subDays } from 'date-fns';
import { createId } from './id';
import type { Application, Question, Round, Stage, TimelineEvent } from '../types/models';
import { DEFAULT_STAGES } from '../types/models';

function daysAgo(now: Date, n: number): string {
  return subDays(now, n).toISOString();
}

function createdEvent(at: string): TimelineEvent {
  return { id: createId(), type: 'created', at, label: 'Application created' };
}

function stageChangeEvent(at: string, fromStageId: string, toStageId: string, toName: string): TimelineEvent {
  return {
    id: createId(),
    type: 'stage_change',
    at,
    label: `Moved to ${toName}`,
    fromStageId,
    toStageId,
  };
}

function roundAddedEvent(at: string, type: Round['type']): TimelineEvent {
  return { id: createId(), type: 'round_added', at, label: `Round added: ${type}` };
}

function noteEvent(at: string, label: string): TimelineEvent {
  return { id: createId(), type: 'custom', at, label };
}

export interface SampleData {
  stages: Stage[];
  applications: Application[];
  questions: Question[];
}

/** A believable, fully-populated example board: 12 applications spread
 * across every stage, staggered over ~10 weeks (so the weekly chart and
 * funnel look real), a few stale/ghosted applications (so the stats page has
 * something to say), a 3-day activity streak ending today, and a 15-question
 * bank with mixed confidence levels and some questions shared across two
 * companies (to show off the "one entry, two chips" behavior). */
export function generateSampleData(now: Date = new Date()): SampleData {
  const stages = DEFAULT_STAGES;
  const stageId = (name: string) => stages.find((s) => s.name === name)!.id;

  const qids: Record<string, string> = {};
  const q = (key: string) => (qids[key] ??= createId());

  const questions: Question[] = [
    {
      id: q('reverse-linked-list'),
      text: 'Reverse a linked list',
      category: 'dsa',
      difficulty: 'medium',
      answerNotes:
        '**Approach:** track `prev`/`curr`/`next` pointers, rewire one node at a time.\n- O(n) time, O(1) space\n- Watch the off-by-one on the final `prev` return',
      confidence: 4,
      companyIds: [],
      createdAt: daysAgo(now, 40),
      lastReviewedAt: daysAgo(now, 2),
    },
    {
      id: q('two-sum'),
      text: 'Two Sum',
      category: 'dsa',
      difficulty: 'easy',
      answerNotes: 'Hash map of value → index, single pass. O(n) time, O(n) space.',
      confidence: 5,
      companyIds: [],
      createdAt: daysAgo(now, 48),
      lastReviewedAt: daysAgo(now, 18),
    },
    {
      id: q('url-shortener'),
      text: 'Design a URL shortener',
      category: 'system_design',
      difficulty: 'hard',
      answerNotes:
        '- Base62 encode an auto-incrementing id, or hash + collision check\n- Read-heavy → cache layer (Redis) in front of the DB\n- Custom aliases need a separate uniqueness check',
      confidence: 2,
      companyIds: [],
      createdAt: daysAgo(now, 60),
      lastReviewedAt: daysAgo(now, 1),
    },
    {
      id: q('rate-limiter'),
      text: 'Design a rate limiter',
      category: 'system_design',
      difficulty: 'hard',
      answerNotes:
        'Token bucket vs sliding window log vs sliding window counter — trade-offs in memory vs accuracy. Token bucket is usually the pragmatic default.',
      confidence: 3,
      companyIds: [],
      createdAt: daysAgo(now, 60),
      lastReviewedAt: daysAgo(now, 16),
    },
    {
      id: q('disagree-teammate'),
      text: 'Tell me about a time you disagreed with a teammate',
      category: 'behavioral',
      difficulty: 'medium',
      answerNotes: 'STAR format: the API contract disagreement on the payments project — led with data, not opinion.',
      confidence: 3,
      companyIds: [],
      createdAt: daysAgo(now, 50),
      lastReviewedAt: daysAgo(now, 2),
    },
    {
      id: q('why-here'),
      text: 'Why do you want to work here?',
      category: 'behavioral',
      difficulty: 'easy',
      answerNotes: 'Tie 2-3 specific things from their engineering blog / product to what I want to grow into next.',
      confidence: 5,
      companyIds: [],
      createdAt: daysAgo(now, 65),
      lastReviewedAt: daysAgo(now, 1),
    },
    {
      id: q('second-highest-salary'),
      text: 'Write a SQL query to find the second highest salary',
      category: 'sql',
      difficulty: 'medium',
      answerNotes: '`SELECT MAX(salary) FROM employees WHERE salary < (SELECT MAX(salary) FROM employees)` — watch for ties/nulls.',
      confidence: 2,
      companyIds: [],
      createdAt: daysAgo(now, 35),
      lastReviewedAt: daysAgo(now, 25),
    },
    {
      id: q('acid'),
      text: 'Explain ACID properties',
      category: 'sql',
      difficulty: 'easy',
      answerNotes: 'Atomicity, Consistency, Isolation, Durability — pair each with a one-line concrete example.',
      confidence: 4,
      companyIds: [],
      createdAt: daysAgo(now, 70),
      lastReviewedAt: null,
    },
    {
      id: q('type-url'),
      text: 'What happens when you type a URL into the browser?',
      category: 'domain',
      difficulty: 'medium',
      answerNotes: 'DNS → TCP handshake → TLS → HTTP request → server processing → render (parse HTML/CSS, layout, paint).',
      confidence: 3,
      companyIds: [],
      createdAt: daysAgo(now, 60),
      lastReviewedAt: daysAgo(now, 16),
    },
    {
      id: q('cap-theorem'),
      text: 'Explain the CAP theorem',
      category: 'system_design',
      difficulty: 'hard',
      answerNotes: 'Pick 2 of Consistency, Availability, Partition tolerance — partition tolerance usually isn\'t optional, so it\'s really C vs A.',
      confidence: 1,
      companyIds: [],
      createdAt: daysAgo(now, 70),
      lastReviewedAt: null,
    },
    {
      id: q('binary-search'),
      text: 'Binary search implementation',
      category: 'dsa',
      difficulty: 'easy',
      answerNotes: 'Watch the `low + (high - low) / 2` overflow-safe midpoint, and the loop condition `low <= high`.',
      confidence: 5,
      companyIds: [],
      createdAt: daysAgo(now, 70),
      lastReviewedAt: daysAgo(now, 30),
    },
    {
      id: q('ideal-team'),
      text: 'Describe your ideal team culture',
      category: 'behavioral',
      difficulty: 'easy',
      answerNotes: 'Psychological safety + high ownership + short feedback loops. Give a concrete example of each.',
      confidence: 4,
      companyIds: [],
      createdAt: daysAgo(now, 70),
      lastReviewedAt: null,
    },
    {
      id: q('scale-chat'),
      text: 'How would you scale a chat application?',
      category: 'system_design',
      difficulty: 'hard',
      answerNotes: 'WebSocket gateway layer + pub/sub (Redis/Kafka) for fan-out, shard by conversation id, separate hot path for delivery receipts.',
      confidence: 2,
      companyIds: [],
      createdAt: daysAgo(now, 40),
      lastReviewedAt: daysAgo(now, 20),
    },
    {
      id: q('normalization'),
      text: 'Explain normalization vs denormalization',
      category: 'sql',
      difficulty: 'medium',
      answerNotes: 'Normalize for write-heavy/consistency, denormalize for read-heavy — usually a per-table decision, not all-or-nothing.',
      confidence: 3,
      companyIds: [],
      createdAt: daysAgo(now, 70),
      lastReviewedAt: null,
    },
    {
      id: q('merge-sorted-lists'),
      text: 'Merge two sorted linked lists',
      category: 'dsa',
      difficulty: 'medium',
      answerNotes: 'Dummy head node + two pointers, splice the smaller each step. O(n+m) time.',
      confidence: 2,
      companyIds: [],
      createdAt: daysAgo(now, 25),
      lastReviewedAt: daysAgo(now, 5),
    },
  ];

  function makeRound(overrides: Partial<Round> & Pick<Round, 'type' | 'date' | 'outcome'>): Round {
    return {
      id: createId(),
      interviewers: '',
      durationMins: 45,
      prepNotes: '',
      reflectionNotes: '',
      questionIds: [],
      ...overrides,
    };
  }

  function linkQuestion(key: string, applicationId: string) {
    const question = questions.find((qq) => qq.id === qids[key])!;
    if (!question.companyIds.includes(applicationId)) question.companyIds.push(applicationId);
    return question.id;
  }

  const applications: Application[] = [];

  function addApplication(input: {
    id: string;
    company: string;
    role: string;
    finalStage: string;
    priority?: boolean;
    tags?: string[];
    location?: string;
    remote?: Application['remote'];
    salaryRange?: string;
    source?: string;
    createdDaysAgo: number;
    events: TimelineEvent[];
    rounds?: Round[];
    notes?: string;
  }): void {
    applications.push({
      id: input.id,
      company: input.company,
      role: input.role,
      stageId: stageId(input.finalStage),
      priority: input.priority ?? false,
      tags: input.tags ?? [],
      contacts: [],
      notes: input.notes ?? '',
      rounds: input.rounds ?? [],
      events: input.events,
      createdAt: daysAgo(now, input.createdDaysAgo),
      archivedAt: null,
    });
  }

  // --- Wishlist (2) ---
  addApplication({
    id: createId(),
    company: 'Wonka Industries',
    role: 'Product Manager',
    finalStage: 'Wishlist',
    tags: ['dream-job'],
    createdDaysAgo: 3,
    events: [createdEvent(daysAgo(now, 3))],
  });
  addApplication({
    id: createId(),
    company: 'Cyberdyne Systems',
    role: 'ML Engineer',
    finalStage: 'Wishlist',
    remote: 'remote',
    createdDaysAgo: 10,
    events: [createdEvent(daysAgo(now, 10))],
  });

  // --- Applied (3) ---
  addApplication({
    id: createId(),
    company: 'Hooli',
    role: 'Backend Engineer',
    finalStage: 'Applied',
    location: 'Remote',
    remote: 'remote',
    source: 'LinkedIn',
    createdDaysAgo: 45,
    events: [
      createdEvent(daysAgo(now, 45)),
      stageChangeEvent(daysAgo(now, 40), stageId('Wishlist'), stageId('Applied'), 'Applied'),
    ],
  });
  addApplication({
    id: createId(),
    company: 'Pied Piper',
    role: 'Full Stack Engineer',
    finalStage: 'Applied',
    source: 'Referral',
    tags: ['startup'],
    createdDaysAgo: 20,
    events: [
      createdEvent(daysAgo(now, 20)),
      stageChangeEvent(daysAgo(now, 18), stageId('Wishlist'), stageId('Applied'), 'Applied'),
    ],
  });
  const massiveDynamicId = createId();
  addApplication({
    id: massiveDynamicId,
    company: 'Massive Dynamic',
    role: 'Data Scientist',
    finalStage: 'Applied',
    salaryRange: '₹22–30L',
    createdDaysAgo: 5,
    events: [
      createdEvent(daysAgo(now, 5)),
      stageChangeEvent(daysAgo(now, 4), stageId('Wishlist'), stageId('Applied'), 'Applied'),
    ],
  });

  // --- OA (2) — one of these is ghosted (25d quiet) ---
  const globexId = createId();
  addApplication({
    id: globexId,
    company: 'Globex',
    role: 'Site Reliability Engineer',
    finalStage: 'OA',
    remote: 'hybrid',
    createdDaysAgo: 35,
    events: [
      createdEvent(daysAgo(now, 35)),
      stageChangeEvent(daysAgo(now, 32), stageId('Wishlist'), stageId('Applied'), 'Applied'),
      stageChangeEvent(daysAgo(now, 25), stageId('Applied'), stageId('OA'), 'OA'),
    ],
    rounds: [
      makeRound({
        type: 'oa',
        date: daysAgo(now, 25).slice(0, 10),
        outcome: 'no_response',
        reflectionNotes: 'Submitted the OA on time, never heard back. Following up next week.',
        questionIds: [linkQuestion('second-highest-salary', globexId)],
      }),
    ],
  });
  addApplication({
    id: createId(),
    company: 'Soylent Corp',
    role: 'Mobile Engineer',
    finalStage: 'OA',
    createdDaysAgo: 15,
    events: [
      createdEvent(daysAgo(now, 15)),
      stageChangeEvent(daysAgo(now, 13), stageId('Wishlist'), stageId('Applied'), 'Applied'),
      stageChangeEvent(daysAgo(now, 8), stageId('Applied'), stageId('OA'), 'OA'),
    ],
  });

  // --- Interviewing (2) — Acme is the "active/recent" story; Initech is stale ---
  const acmeId = createId();
  addApplication({
    id: acmeId,
    company: 'Acme Corp',
    role: 'Frontend Engineer',
    finalStage: 'Interviewing',
    priority: true,
    remote: 'remote',
    salaryRange: '₹18–24L',
    tags: ['remote-ok'],
    source: 'Referral',
    createdDaysAgo: 50,
    events: [
      createdEvent(daysAgo(now, 50)),
      stageChangeEvent(daysAgo(now, 48), stageId('Wishlist'), stageId('Applied'), 'Applied'),
      stageChangeEvent(daysAgo(now, 30), stageId('Applied'), stageId('OA'), 'OA'),
      stageChangeEvent(daysAgo(now, 10), stageId('OA'), stageId('Interviewing'), 'Interviewing'),
      roundAddedEvent(daysAgo(now, 25), 'phone_screen'),
      roundAddedEvent(daysAgo(now, 2), 'technical'),
      noteEvent(daysAgo(now, 0), 'Recruiter confirmed the final round is next week.'),
    ],
    rounds: [
      makeRound({
        type: 'phone_screen',
        date: daysAgo(now, 25).slice(0, 10),
        interviewers: 'Priya (Recruiter)',
        outcome: 'passed',
        prepNotes: 'Reviewed resume talking points, prepped 2-min pitch.',
        reflectionNotes: 'Went well — mostly background and logistics.',
      }),
      makeRound({
        type: 'technical',
        date: daysAgo(now, 2).slice(0, 10),
        interviewers: 'Alex, Sam',
        durationMins: 60,
        outcome: 'pending',
        prepNotes: 'Reviewed linked lists, two-pointer patterns, and Two Sum variants.',
        reflectionNotes: 'Nailed the linked list reversal. Two Sum follow-up (return all pairs) threw me a bit — should\'ve clarified constraints first.',
        questionIds: [linkQuestion('reverse-linked-list', acmeId), linkQuestion('two-sum', acmeId), linkQuestion('disagree-teammate', acmeId)],
      }),
    ],
  });
  const initechId = createId();
  addApplication({
    id: initechId,
    company: 'Initech',
    role: 'DevOps Engineer',
    finalStage: 'Interviewing',
    createdDaysAgo: 60,
    events: [
      createdEvent(daysAgo(now, 60)),
      stageChangeEvent(daysAgo(now, 55), stageId('Wishlist'), stageId('Applied'), 'Applied'),
      stageChangeEvent(daysAgo(now, 16), stageId('Applied'), stageId('Interviewing'), 'Interviewing'),
    ],
    rounds: [
      makeRound({
        type: 'system_design',
        date: daysAgo(now, 16).slice(0, 10),
        outcome: 'pending',
        reflectionNotes: 'Talked through rate limiting for their public API. Felt reasonably solid.',
        questionIds: [linkQuestion('rate-limiter', initechId), linkQuestion('type-url', initechId)],
      }),
    ],
  });

  // --- Offer (1) ---
  const starkId = createId();
  addApplication({
    id: starkId,
    company: 'Stark Industries',
    role: 'Solutions Architect',
    finalStage: 'Offer',
    priority: true,
    salaryRange: '₹35–42L',
    source: 'Referral',
    createdDaysAgo: 65,
    events: [
      createdEvent(daysAgo(now, 65)),
      stageChangeEvent(daysAgo(now, 60), stageId('Wishlist'), stageId('Applied'), 'Applied'),
      stageChangeEvent(daysAgo(now, 40), stageId('Applied'), stageId('OA'), 'OA'),
      stageChangeEvent(daysAgo(now, 30), stageId('OA'), stageId('Interviewing'), 'Interviewing'),
      stageChangeEvent(daysAgo(now, 1), stageId('Interviewing'), stageId('Offer'), 'Offer'),
    ],
    rounds: [
      makeRound({
        type: 'system_design',
        date: daysAgo(now, 32).slice(0, 10),
        outcome: 'passed',
        questionIds: [linkQuestion('url-shortener', starkId), linkQuestion('rate-limiter', starkId)],
      }),
      makeRound({
        type: 'behavioral',
        date: daysAgo(now, 20).slice(0, 10),
        outcome: 'passed',
        questionIds: [linkQuestion('why-here', starkId)],
      }),
      makeRound({
        type: 'hr',
        date: daysAgo(now, 1).slice(0, 10),
        outcome: 'passed',
        reflectionNotes: 'Offer call — negotiating start date.',
      }),
    ],
  });

  // --- Rejected (2) ---
  const umbrellaId = createId();
  addApplication({
    id: umbrellaId,
    company: 'Umbrella Corp',
    role: 'QA Engineer',
    finalStage: 'Rejected',
    createdDaysAgo: 40,
    events: [
      createdEvent(daysAgo(now, 40)),
      stageChangeEvent(daysAgo(now, 38), stageId('Wishlist'), stageId('Applied'), 'Applied'),
      stageChangeEvent(daysAgo(now, 20), stageId('Applied'), stageId('Rejected'), 'Rejected'),
    ],
    rounds: [
      makeRound({
        type: 'phone_screen',
        date: daysAgo(now, 22).slice(0, 10),
        outcome: 'failed',
        reflectionNotes: 'Weak on the system design portion of the screen — need to brush up before the next one.',
        questionIds: [linkQuestion('scale-chat', umbrellaId)],
      }),
    ],
  });
  const wayneId = createId();
  addApplication({
    id: wayneId,
    company: 'Wayne Enterprises',
    role: 'Engineering Manager',
    finalStage: 'Rejected',
    createdDaysAgo: 25,
    events: [
      createdEvent(daysAgo(now, 25)),
      stageChangeEvent(daysAgo(now, 22), stageId('Wishlist'), stageId('Applied'), 'Applied'),
      stageChangeEvent(daysAgo(now, 5), stageId('Applied'), stageId('Rejected'), 'Rejected'),
    ],
    rounds: [
      makeRound({
        type: 'technical',
        date: daysAgo(now, 7).slice(0, 10),
        outcome: 'failed',
        reflectionNotes: 'Rusty on the coding round — went with a less senior candidate.',
        questionIds: [linkQuestion('merge-sorted-lists', wayneId)],
      }),
    ],
  });

  return { stages, applications, questions };
}
