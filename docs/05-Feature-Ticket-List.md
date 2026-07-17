# 05 — Feature Ticket List
## Interview Prep Tracker (PrepBoard)

**Version:** 1.0 · Ordered for sequential implementation. One ticket ≈ one focused Claude Code session.
**Legend:** P0 MVP · P1 launch · P2 polish · Sizes: S ≤1h · M 1–3h · L 3–6h

---

## Epic 0 — Foundation

### PB-001 · Scaffold project ⚙️ P0 · S
Vite + React 18 + TS + Tailwind + ESLint/Prettier + Vitest. react-router with 3 routes (Board/Questions/Stats) and app shell topbar per Frontend spec §2.1. Design tokens as CSS vars + Tailwind config.
**AC:** All 3 routes render placeholder pages; build/test/lint pass.

### PB-002 · Data model & types ⚙️ P0 · S
All interfaces from Architecture §4 in `types/models.ts` incl. default stages constant.
**AC:** Compiles; sample fixtures for each type; nanoid helper.

### PB-003 · Stores with persistence ⚙️ P0 · M
`useBoardStore` (stages, applications, atomic actions incl. moveCard which also appends stage_change event), `useQuestionStore`, `useUiStore` (not persisted). Persist middleware, 500 ms debounce, schemaVersion + migration scaffold, corrupt-recovery.
**AC:** Survives refresh; moveCard adds event atomically (test); corrupt data doesn't crash.

---

## Epic 1 — Kanban Board (M1 core)

### PB-010 · Board layout & columns 🗂 P0 · M
StageColumn components from stages data: header (name, count, color dot), scrollable card area, Rejected collapsed by default. Horizontal board scroll.
**AC:** Default 6 stages render; counts accurate; terminal collapse works.

### PB-011 · Job card component 🗂 P0 · M
Card per Frontend spec §3.1: company, role, badges (remote/salary), priority flag, days-in-stage (derived from events, amber ≥14d), rounds count.
**AC:** All fields render conditionally; days-in-stage computed correctly (unit test the derivation).

### PB-012 · Quick-add card 🗂 P0 · S
Inline mini-form per column: company + role, Enter saves (with created event), Esc cancels.
**AC:** ≤ 20 s add flow; card appears instantly; persisted.

### PB-013 · Drag & drop between columns 🗂 P0 · L
dnd-kit: sortable within column + droppable columns. Drop → moveCard action (stageId + event). Keyboard sensor + aria-live announcements.
**AC:** Mouse and keyboard moves work; event logged with from/to; order persists.

### PB-014 · Filter & search bar 🗂 P1 · M
Text search (company/role/tags), priority toggle, tag multi-select; 150 ms debounce; filters live in useUiStore.
**AC:** Filters combine (AND); column counts reflect filtered view; clear-all.

### PB-015 · Stage editor 🗂 P1 · M
Modal: reorder (dnd), rename, color, terminal toggle, add (max 8), delete with card-destination picker. Referential integrity per Security doc §5.
**AC:** Custom stages persist; deleting a stage relocates its cards; funnel order = stage order.

---

## Epic 2 — Application Detail (M1 core)

### PB-020 · Detail side sheet shell 📋 P0 · M
Right sheet (mobile: full-screen) with header (inline edit company/role, stage select, priority, archive/delete) + Details/Rounds/Timeline tabs. Focus trap, Esc, focus return.
**AC:** Open from card click; all header actions work; a11y verified.

### PB-021 · Details form 📋 P0 · M
URL (http/https validation per Security §4.5), location, remote, salary, source, resumeVersion, tags input, contacts rows, notes textarea.
**AC:** All fields persist; `javascript:` URL renders as text not link.

### PB-022 · Markdown-lite editor + renderer 📋 P0 · M
Port from ResumeForge (or rebuild): B/I/bullets toolbar, whitelist renderer (`strong em ul li br` only), XSS unit tests.
**AC:** Hostile strings render inert; tests green. Used for notes, answers, reflections.

### PB-023 · Timeline tab 📋 P1 · S
Auto events + manual "+ Add note" custom events; newest first; mono timestamps.
**AC:** Stage moves from PB-013 appear here automatically.

### PB-024 · Rounds list & form 📋 P0 · M
Round cards + RoundForm per Frontend spec §3.4 (type, date, interviewers, duration, outcome, prep/reflection notes). Adding a round logs a round_added event.
**AC:** Full CRUD; outcome chips styled per tokens.

### PB-025 · Question capture in rounds 📋 P0 · M
Repeating question rows in RoundForm; "Save to bank" creates Question linked to this application (companyIds) and stores questionId on round; typeahead links existing bank questions instead of duplicating.
**AC:** One-click banking; same question at 2 companies = one bank entry, two chips.

---

## Epic 3 — Question Bank & Practice (M2)

### PB-030 · Question bank page 🧠 P0 · M
Table/list with search + filters (category, difficulty, company, confidence); row → editor sheet (text, answer notes markdown-lite, metadata, confidence dots).
**AC:** Filters combine; edits persist; company chips resolve names (archived-safe).

### PB-031 · Manual add & bank import/export 🧠 P1 · S
"+ Add question" standalone; export/import bank-only JSON (validated).
**AC:** Round-trips losslessly; invalid file rejected with reason.

### PB-032 · Practice mode 🧠 P1 · L
Flashcard flow per Frontend spec §3.6: confidence-weighted deck (`lib/practice.ts` pure + tested), flip, 1–5 rating updates confidence + lastReviewedAt, session summary. Reduced-motion respected.
**AC:** Low-confidence questions appear more often (test the ordering fn); keyboard-only session possible.

---

## Epic 4 — Stats Dashboard (M2)

### PB-040 · Stats functions library 📊 P0 · M
`lib/stats.ts` pure functions: funnel counts/conversions (from stage order + events), weekly activity, response breakdown (progressed/rejected/ghosted>21d/waiting), pipeline snapshot, streak (local-tz), stale list (≥14d non-terminal). Heavy unit tests incl. midnight/timezone cases.
**AC:** All functions tested against fixture data; custom stages handled.

### PB-041 · Stats page with charts 📊 P1 · L
React.lazy page; recharts: funnel bars, weekly bars, donut, pipeline, streak card + 30-day heat row, stale table with "Open" linking to detail sheet. Each chart has accessible data-table alternative. Kind empty/rough-week copy per Frontend spec §6.
**AC:** Renders from live store; board bundle unchanged (verify chunk split); charts match token colors.

---

## Epic 5 — Data & Polish (M3)

### PB-050 · Full JSON export/import 💾 P0 · M
Whole AppData export; import with full schema + enum + referential-integrity validation (Security §4.4), Replace/Merge (de-dupe by id).
**AC:** Hostile-file test suite passes; merge doesn't duplicate.

### PB-051 · CSV export 💾 P1 · S
Applications table CSV; formula-injection escaping (`= + - @` → prefixed).
**AC:** Opens clean in Excel/Sheets; injection strings neutralized (test).

### PB-052 · Archive & delete-all 💾 P1 · S
Archive toggle (hidden from board, kept in stats/history + "Show archived" filter); Delete-all with typed DELETE.
**AC:** Archived cards excluded from board & stale list; delete-all verified empty.

### PB-053 · Sample data & onboarding ✨ P2 · S
Realistic example board (12 apps across stages, rounds, 15 banked questions); first-visit banner; empty states everywhere.
**AC:** One click → believable populated app; stats immediately meaningful.

### PB-054 · Streak chip & celebration ✨ P2 · S
Header streak chip (fills on first daily event, single pulse); one confetti burst on move-to-Offer (reduced-motion safe).
**AC:** Streak matches stats fn; no looping animations.

### PB-055 · Accessibility pass ♿ P1 · M
Keyboard audit (board dnd, sheets, practice), aria-live announcements, chart table alternatives, contrast incl. stage-color chips, reduced motion.
**AC:** Lighthouse a11y ≥ 95; keyboard walkthrough documented.

### PB-056 · Performance & security pass ⚡🔒 P1 · M
Bundle analysis (≤600 KB gz initial, stats chunk separate), font self-host, memoized column lists; `vercel.json` headers; Security doc §6 checklist top-to-bottom.
**AC:** Lighthouse perf ≥ 90; securityheaders.com A; zero post-load network requests.

### PB-057 · Deploy 🚀 P0 · S
GitHub repo, Vercel hookup, README (screenshots, privacy note, "part of the same suite as ResumeForge" cross-link).
**AC:** Live URL; PRD §6 metrics spot-checked.

---

## Milestones

| Milestone | Tickets | Outcome |
|-----------|---------|---------|
| **M1 — Daily-usable board** | 001–003, 010–013, 020–022, 024–025, 050, 057 | Track real applications & rounds today |
| **M2 — Bank + Stats** | 014–015, 023, 030–032, 040–041 | The features no free competitor has |
| **M3 — Launch quality** | 051–056 | Polish, a11y, perf, security |

**Total: 26 tickets.** Reuse from ResumeForge: markdown-lite renderer, tag input, storage/migration pattern, modal/sheet primitives, vercel.json — expect M1 to go noticeably faster than last time.
