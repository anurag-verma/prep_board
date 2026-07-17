# 02 — Technical Architecture Document
## Interview Prep Tracker (PrepBoard)

**Version:** 1.0
**Date:** July 2026

---

## 1. Architecture Overview

Same proven pattern as ResumeForge: **100% client-side SPA**, static files on a free CDN, all state in the browser.

```
┌──────────────────────────────────────────────────────┐
│                      Browser                          │
│  ┌────────┐ ┌────────────┐ ┌──────────┐ ┌─────────┐ │
│  │ Kanban  │ │ Detail     │ │ Question │ │  Stats  │ │
│  │ Board   │ │ Side Sheet │ │ Bank     │ │ (charts)│ │
│  └────┬───┘ └─────┬──────┘ └────┬─────┘ └────┬────┘ │
│       └───────────┴──────┬──────┴─────────────┘      │
│                    ┌─────▼─────┐                      │
│                    │ App State │  Zustand (persist)   │
│                    └─────┬─────┘                      │
│              ┌──────────┼──────────┐                 │
│        ┌─────▼────┐ ┌───▼────┐ ┌───▼─────┐          │
│        │localStorage│ │JSON I/O│ │CSV export│         │
│        └──────────┘ └────────┘ └─────────┘          │
└──────────────────────────────────────────────────────┘
```

---

## 2. Technology Stack (all free & open source)

| Layer | Choice | Notes |
|-------|--------|-------|
| Framework | **React 18 + Vite + TypeScript** | Same as ResumeForge — reuse your setup knowledge |
| Styling | **Tailwind CSS** | Same tokens approach |
| State | **Zustand + persist** | Same pattern, new stores |
| Drag & drop | **@dnd-kit/core + @dnd-kit/sortable** | You already know it — now for kanban columns/cards |
| Charts | **Recharts** ⭐ NEW | Free, React-native API, tree-shakeable; used only in Stats (code-split) |
| Routing | **react-router-dom v6** ⭐ NEW | 3 routes: Board / Questions / Stats |
| Dates | **date-fns** | Tiny, tree-shakeable ("5 days ago", streaks, stale detection) |
| CSV export | Hand-rolled (~30 lines) | No dependency needed; escape quotes/commas properly |
| IDs | **nanoid** | Same as before |
| Icons | **lucide-react** | Same as before |
| Testing | **Vitest + React Testing Library** | Same as before |
| Hosting | **Vercel** (free) | Same pipeline you already have |

**New skills you'll learn:** client-side routing, charts, derived/computed statistics from event logs.

---

## 3. Project Structure

```
prepboard/
├── public/fonts/
├── src/
│   ├── main.tsx
│   ├── App.tsx                    # router + layout shell
│   ├── types/
│   │   └── models.ts              # all interfaces (single source of truth)
│   ├── store/
│   │   ├── useBoardStore.ts       # applications, stages, events
│   │   ├── useQuestionStore.ts    # question bank
│   │   └── useUiStore.ts          # filters, open panels (not persisted)
│   ├── pages/
│   │   ├── BoardPage.tsx
│   │   ├── QuestionsPage.tsx
│   │   └── StatsPage.tsx          # React.lazy — recharts loads only here
│   ├── components/
│   │   ├── board/
│   │   │   ├── KanbanBoard.tsx
│   │   │   ├── StageColumn.tsx
│   │   │   ├── JobCard.tsx
│   │   │   ├── QuickAddCard.tsx
│   │   │   ├── FilterBar.tsx
│   │   │   └── StageEditor.tsx    # customize columns modal
│   │   ├── detail/
│   │   │   ├── DetailSheet.tsx
│   │   │   ├── ApplicationForm.tsx
│   │   │   ├── Timeline.tsx
│   │   │   ├── RoundList.tsx
│   │   │   ├── RoundForm.tsx
│   │   │   └── QuestionCapture.tsx  # add question → bank in one click
│   │   ├── questions/
│   │   │   ├── QuestionTable.tsx
│   │   │   ├── QuestionForm.tsx
│   │   │   ├── QuestionFilters.tsx
│   │   │   └── PracticeMode.tsx   # flashcards
│   │   ├── stats/
│   │   │   ├── FunnelChart.tsx
│   │   │   ├── ActivityChart.tsx
│   │   │   ├── PipelineSnapshot.tsx
│   │   │   ├── StreakCard.tsx
│   │   │   └── StaleList.tsx
│   │   └── ui/                    # Button, Sheet, Modal, Tag, Select…
│   ├── lib/
│   │   ├── stats.ts               # pure functions: funnel, rates, streaks, stale
│   │   ├── csv.ts                 # CSV export
│   │   ├── storage.ts             # JSON import/export + schema validation
│   │   ├── practice.ts            # confidence-weighted question ordering
│   │   └── sampleData.ts
│   └── styles/index.css
├── vercel.json                    # security headers
└── … (vite/ts/tailwind configs)
```

---

## 4. Data Model

```typescript
// types/models.ts

export interface AppData {
  schemaVersion: number;
  stages: Stage[];               // ordered — defines board columns
  applications: Application[];
  questions: Question[];
}

export interface Stage {
  id: string;
  name: string;                  // "Applied", "Interviewing"…
  color: string;                 // column accent
  isTerminal: boolean;           // Offer / Rejected — excluded from "stale" logic
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
  source?: string;               // referral, LinkedIn, careers page…
  resumeVersion?: string;        // ties into ResumeForge!
  priority: boolean;
  tags: string[];
  contacts: Contact[];
  notes: string;                 // markdown-lite
  rounds: Round[];
  events: TimelineEvent[];       // append-only log
  createdAt: string;
  archivedAt: string | null;
}

export interface Contact {
  id: string; name: string; role?: string; email?: string;
}

export interface TimelineEvent {
  id: string;
  type: 'created' | 'stage_change' | 'round_added' | 'note' | 'custom';
  at: string;                    // ISO datetime
  label: string;                 // "Moved to Interviewing"
  fromStageId?: string;
  toStageId?: string;
}

export type RoundType =
  | 'phone_screen' | 'oa' | 'technical' | 'system_design'
  | 'behavioral' | 'hr' | 'other';

export interface Round {
  id: string;
  type: RoundType;
  date: string;                  // ISO date
  interviewers?: string;
  durationMins?: number;
  outcome: 'pending' | 'passed' | 'failed' | 'no_response';
  prepNotes: string;
  reflectionNotes: string;
  questionIds: string[];         // refs into question bank
}

export type QuestionCategory =
  | 'dsa' | 'system_design' | 'behavioral' | 'sql' | 'domain' | 'other';

export interface Question {
  id: string;
  text: string;
  category: QuestionCategory;
  difficulty: 'easy' | 'medium' | 'hard';
  answerNotes: string;           // markdown-lite
  confidence: 1 | 2 | 3 | 4 | 5;
  companyIds: string[];          // application ids where it appeared
  createdAt: string;
  lastReviewedAt: string | null;
}
```

**Key modeling decisions:**
- `events` is an **append-only log** → the stats page derives everything (funnel, streaks, stale) from it with pure functions in `lib/stats.ts`. No duplicated state.
- Questions are **global** with references to applications (many-to-many) → the same question logged at two companies appears once in the bank with both company chips.
- Stages are data, not code → customizable columns for free.

---

## 5. Key Technical Decisions

### 5.1 Stats as pure derivations
All dashboard numbers computed on the fly from `applications` + `events` via memoized selectors. Never store computed stats. Unit-test these functions heavily — they're pure and easy to test.

**Definitions (encode in `lib/stats.ts`):**
- *Response rate* = applications that ever left "Applied" toward a non-rejected stage ÷ total applied
- *Ghosted* = in a non-terminal stage with no events for 21+ days
- *Stale* = non-terminal, no events for 14+ days
- *Streak* = consecutive calendar days (local timezone) with ≥ 1 event of any type

### 5.2 Kanban drag-and-drop
dnd-kit with column droppables + sortable cards. On drop into a new column: update `stageId` AND append a `stage_change` event atomically in one store action. Keyboard sensor enabled (a11y).

### 5.3 Practice mode ordering
Confidence-weighted shuffle: probability of appearing ∝ (6 − confidence), with `lastReviewedAt` recency penalty. Pure function in `lib/practice.ts` with tests.

### 5.4 Performance
- Recharts + StatsPage lazily loaded (`React.lazy`) — board stays light
- Board virtualization NOT needed for v1 (hundreds of cards is fine); revisit if slow
- Memoize card lists per column; filter/search runs on derived arrays

### 5.5 Persistence
Same pattern as ResumeForge: Zustand persist → localStorage key `prepboard-data`, 500 ms debounce, schemaVersion + migrations, corrupt-data recovery, quota error toast.

---

## 6. Build & Deployment
Identical free pipeline: GitHub → Vercel auto-deploy from `main`, `vercel.json` carries security headers. Optional GitHub Actions: lint + test on PR.

---

## 7. Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Event log grows unbounded | Text-only; even 1000 apps × 20 events ≈ well under quota. Archive feature trims board view |
| Charts bloat bundle | Code-split Stats page; verify with bundle analyzer |
| Stage customization breaks stats | Funnel derives from stage ORDER + terminal flags, not hardcoded names; tests cover custom stages |
| Date/timezone bugs in streaks | Use date-fns `startOfDay` in local tz; test around midnight boundaries |
| localStorage cleared | Prominent JSON backup + CSV export |
