# Decisions Log

Undocumented choices made during implementation, simplest free/client-side option each time.

## PB-001 — Scaffold

- **Vite create template gave React 19 / oxlint / TS 6 by default.** Pinned down to
  React 18.3, ESLint 9 (flat config) + Prettier, TypeScript 5.6 to match the Architecture
  doc's fixed stack (React 18) and the ticket's explicit "ESLint/Prettier" requirement.
- **Vite/Vitest version:** started on Vite 5 for stability, but `npm audit` flagged the
  esbuild dev-server CORS advisory in that line. Upgraded to Vite 8.1 / Vitest 4.1 /
  `@vitejs/plugin-react` 6 (current latest) to get a clean `npm audit` from the start,
  per Security doc §4.3 and the PB-056 checklist ("npm audit clean").
- **Fonts:** self-hosted via `@fontsource/inter` and `@fontsource/jetbrains-mono` (both
  MIT-licensed npm packages bundling the OFL font files) rather than manually managing
  files in `public/fonts/`. Bundled by Vite like any other asset — no CDN request at
  runtime, satisfies the "self-hosted fonts" requirement with less manual upkeep.
- **ESLint config format:** flat config (`eslint.config.js`) since ESLint 9 makes this
  the default/recommended format going forward.

## PB-010 — Board layout & columns

- **Rejected-collapsed-by-default tracking:** the `Stage` model has no per-stage
  "collapsed" field, and the Frontend spec only collapses Rejected by default — not
  Offer, even though both are `isTerminal`. Added `collapsedStageIds: string[]` to the
  (unpersisted) `useUiStore`, seeded with `['rejected']` at module init. This is a
  session-only default for now; if PB-015's stage editor renames/deletes the Rejected
  stage id, this hardcoded seed will need revisiting (noted for that ticket).

## PB-012 — Quick-add card

- **Enter-to-save with two text fields:** a `<form>` with two `<input type="text">`s and
  no submit button does NOT auto-submit on Enter in real browsers (the HTML implicit
  -submission spec only fires with exactly one field, or an explicit submit button).
  Caught this via a real-browser check, not the jsdom test (jsdom's `fireEvent.submit`
  bypasses the browser rule entirely and would have passed either way). Fixed by
  handling `Enter` explicitly in the form's `onKeyDown` rather than relying on native
  submission; updated the unit test to dispatch a real `keyDown` instead of `submit` so
  it actually exercises this path.

## PB-013 — Drag & drop between columns

- **Custom keyboard coordinate getter for cross-column moves.** dnd-kit's built-in
  `sortableKeyboardCoordinates` only reliably reorders within a single `SortableContext`
  list — Left/Right didn't reliably cross into a neighboring stage column when tested
  in a real browser (jsdom can't exercise this at all; dnd-kit needs real layout/rects).
  Wrote `lib/dndKeyboard.ts`'s `boardKeyboardCoordinateGetter`, following the same
  approach as dnd-kit's own "multiple containers" example: filter droppable containers
  geometrically by arrow direction relative to the active item's rect, then use
  `closestCorners` to pick the nearest one and jump the virtual coordinate there.
  Verified with a real Playwright keyboard sequence (Tab → Space → ArrowRight → Space)
  moving a card from Applied to OA, not just a jsdom test.
- **`moveCard(id, toStageId, beforeId?)` also reorders the applications array**, not
  just `stageId` — needed so "order persists" (PB-013 AC) holds for same-column drags
  too, since the model has no explicit per-application order field; array position is
  the order. Kept the old no-op-on-same-stage behavior when `beforeId` is omitted so
  existing PB-003 tests didn't need to change.
- **Pure drag-end logic pulled out of the component** (`lib/dnd.ts`:
  `computeMoveFromDragEnd`, `computeStagePosition`) specifically so it could be unit
  tested directly — simulating real dnd-kit pointer/keyboard sequences in jsdom is
  unreliable, so the decision logic is tested in isolation and the actual drag
  interaction is verified in a real browser instead.

## PB-020 — Detail side sheet shell

- **Built the Sheet primitive fresh** rather than porting ResumeForge's (user's call,
  asked directly since this was a named reuse point) — `components/ui/Sheet.tsx`:
  hand-rolled focus trap (Tab/Shift+Tab cycling over `querySelectorAll` of focusable
  elements), Esc-to-close, focus-return-to-trigger on unmount, 200ms slide-in. No new
  dependency; matches the "no backend, minimal deps" posture from the Architecture doc.
- **Focus-return mechanism**: `Sheet` captures `document.activeElement` in a `useEffect`
  that runs once on mount, and restores it in that effect's cleanup (which fires on
  unmount). This only works because the parent conditionally *mounts/unmounts* Sheet
  based on `selectedApplicationId` rather than keeping it always-rendered and toggling
  visibility — if a future ticket changes that pattern, this focus-return logic breaks
  silently (no runtime warning), worth remembering.
- **Delete confirmation uses `window.confirm`**, not a custom modal — Security doc §5
  only requires "confirm dialogs" for destructive actions, and building a second modal
  primitive for a yes/no prompt this ticket didn't ask for would be premature.
- **Details/Rounds/Timeline tabs are placeholders** in this shell ticket — their real
  content is explicitly later tickets (PB-021, PB-024, PB-023) per the ticket list, same
  pattern used for the page-level placeholders in PB-001.

## PB-021 — Details form

- **`ApplicationForm` has no local copy of array fields (`tags`/`contacts`) beyond the
  in-progress contact-row edits** — it reads them straight from the `application` prop
  and commits through `updateApplication` immediately. This relies on the parent
  (`BoardPage` → `DetailSheet`) being subscribed to the store and re-rendering with a
  fresh `application` object on every change, which is true in real usage. Caught this
  the hard way in an isolated component test (rendered `ApplicationForm` directly with a
  static prop, so a tag add didn't visually reflect until the test explicitly
  re-rendered with the updated application) — not a bug in the component, just a gap
  between how the isolated test rendered it vs. how it's actually used.
- **Text fields commit on blur, selects/tags/contacts commit immediately** — same
  pattern as the header inputs from PB-020, kept consistent rather than introducing a
  second convention.
- **`isSafeHttpUrl` lives in `lib/url.ts`** as a small standalone pure function (not
  folded into `ApplicationForm`) specifically so the Security §4.5 requirement has a
  direct, hostile-input-tested unit test independent of any component.

## PB-022 — Markdown-lite editor + renderer

- **Renderer parses text directly into React elements — never `dangerouslySetInnerHTML`,
  not even with sanitization.** `parseMarkdownLite` only ever pushes plain JS strings
  (which React escapes automatically as text nodes) or `<strong>/<em>/<ul>/<li>/<br>`
  elements it constructs itself. There is no HTML-string intermediate step at all, so
  there's no sanitizer to keep in sync with the whitelist — the whitelist IS the only
  thing the parser is capable of emitting, by construction. Verified with an XSS test
  suite asserting only 6 tag names (`DIV STRONG EM UL LI BR`) ever appear in the
  rendered DOM, for `<script>`, `onerror` image payloads, `<svg onload>`, and raw HTML
  typed inside `**bold**`/`- bullet` markers.
- **Split pure text-transform logic (`lib/markdownLite.ts`) from the JSX parser
  (`lib/markdownLiteRender.tsx`)** — the toolbar's bold/italic/bullet-list operations on
  a string + selection range don't need React at all, so they're plain, fully
  unit-tested functions; only the rendering half needs JSX and its own test file.
- **No live preview pane in the editor** — toolbar + textarea only, per the Frontend
  spec's "notes (markdown-lite editor)" wording. `MarkdownLiteRenderer` exists
  separately for read-only display and will be used once PB-023/024/030 build the
  Timeline/Rounds/Question-bank views that show saved markdown-lite text.

## PB-024 — Rounds list & form

- **Skipped PB-023 (Timeline tab) to stay on the M1 track** — the milestone table in
  doc 05 explicitly excludes 023 from M1 ("020–022, 024–025"), so the Timeline tab
  placeholder stays as-is for now; it'll get built as part of M2.
- **Round type/outcome icon and color maps live in `components/detail/roundMeta.ts`**
  (not inlined in `RoundForm`/`RoundsTab`) so both the round-card chip and the outcome
  segmented control read from one source of truth — adding a round type or outcome
  later only means editing this one file.
- **List↔form view-switching is local component state in `RoundsTab`**
  (`editingRoundId: string | 'new' | null`), not a route or modal — the sheet is already
  a fixed 520px panel, so swapping the tab's content in place is simpler than stacking
  another layer of navigation inside it.
- **Outcome colors**: passed → `--win` (green), failed → `--danger` (red), pending →
  `--muted` (neutral gray), no_response → `--flag` (amber) — chosen to match the
  emotional weight of Frontend spec's token descriptions even though the spec doesn't
  spell out this exact mapping; each chip pairs the color with an icon + text label per
  the Accessibility doc's "never color alone" rule.

## PB-025 — Question capture in rounds

- **"Save to bank" and typeahead-link both write to `useQuestionStore` immediately**,
  independent of the round form's own Save/Cancel lifecycle — matches the ticket's
  "one-click banking" wording literally. Consequence: if a user banks a question and
  then clicks Cancel on the round form, the bank question still exists (correctly
  tagged with `companyIds`) but isn't referenced by any round's `questionIds` yet. This
  is an accepted minor inconsistency, not a bug — the alternative (deferring bank writes
  until round-save) would break the "one click" behavior the spec asks for.
  `RoundForm` itself keeps `questionIds` as local draft state, same pattern as its other
  fields, so only the round-level *link* is undone by Cancel, not the bank entry.
- **Category/difficulty labels moved to `lib/questionLabels.ts`** (not
  `components/detail/roundMeta.ts`) since PB-030's Question Bank page will need the same
  labels independent of rounds — kept it in `lib/` rather than duplicating in
  `components/questions/` once that lands.
- **Typeahead is a simple case-insensitive substring match** over all bank questions
  (capped at 5 results), not fuzzy search — matches the ticket's "searchable via
  typeahead" wording without pulling in a fuzzy-search dependency for something this
  small.

## PB-050 — Full JSON export/import

- **Validator built by hand, no schema library** (no zod/yup/ajv) — consistent with the
  fixed-stack constraint and the project's pattern so far of hand-rolling rather than
  adding dependencies for things a ~400-line pure function can do directly. Also means
  zero extra bytes in the bundle for something that only runs on an explicit user action.
- **`questionIds` on rounds is a hard reference (import rejected if dangling); `companyIds`
  on questions is a soft reference (never rejected).** This isn't arbitrary — the
  Frontend spec §6 explicitly describes a deleted-application's question chip degrading
  to "(archived)" rather than breaking, so a stale `companyIds` entry is an expected,
  designed-for data state. Nothing in the app currently lets a *round*'s `questionIds`
  go stale the same way (no UI to delete a banked question yet), so treating that one as
  strictly must-resolve matches the ticket's literal "questionIds exist" wording without
  contradicting the archived-chip behavior.
- **`file.text()` doesn't exist in jsdom** (only in real browsers) — switched the import
  reader to `FileReader.readAsText`, which works identically in both. Caught via the
  component test failing with `TypeError: file.text is not a function`, not a real-browser
  check this time; good reminder that jsdom's File/Blob API surface is incomplete even
  though this project treats real-browser checks as the source of truth generally.
- **Merge keeps the *existing* record on an id collision** (skip incoming duplicates)
  rather than letting the imported file overwrite current session data. Reasoning: the
  ticket's testable requirement is "merge doesn't duplicate," and existing-wins is the
  safer default for a merge (as opposed to a Replace, which is explicit and confirmed).
  A user who wants the imported version to win should use Replace instead.
- **Export/Import is JSON-only in this ticket** — CSV export is explicitly PB-051.

## PB-014 — Filter & search bar

- **Tag multi-select uses OR semantics** (an app matches if it has ANY selected tag),
  while it combines with search text and priority via AND — matches how most filter UIs
  work (narrowing by category tends to be inclusive within one facet, exclusive across
  facets) and isn't specified explicitly by the ticket, so documenting the choice here.
- **Debounce lives in `FilterBar`'s local state**, not `useUiStore` itself — the store
  commits `searchText` immediately when set; the component holds the raw keystrokes in
  local state and only calls `setSearchText` after 150ms of no typing. Keeps the store's
  contract simple (no debounce logic baked into a store action) and matches the pattern
  already used for `QuickAddCard`/text fields elsewhere.
- **`matchesFilters` pulled into `lib/filters.ts`** as a standalone pure function (not
  inlined in `KanbanBoard`) so the AND/OR combination logic has its own direct unit
  tests independent of rendering — this is the kind of logic that's easy to get subtly
  wrong (e.g. accidentally AND-ing the tag selection) and cheap to test in isolation.

## PB-015 — Stage editor

- **Extracted `useDialogBehavior` out of `Sheet` before building `Modal`.** PB-020's
  `Sheet` already had focus-trap/Esc/focus-return logic inline; adding a second
  near-identical consumer (a centered `Modal`) was the point where duplicating it
  would've been worse than a small shared hook. `Sheet`'s own tests still pass
  unchanged, confirming the refactor didn't alter its behavior.
- **The gear icon in `TopBar` now opens the Stage Editor directly** rather than a
  Settings dropdown — it's the only settings-like action that exists yet. When PB-052
  (delete-all-data) lands, this button should become a proper menu (same pattern as
  `ImportExportMenu`) rather than staying a single-purpose shortcut; noted here so that
  ticket doesn't quietly break this one's entry point.
- **Deleting a stage with 0 applications skips the destination picker** and shows a
  plain confirm instead — there's nothing to relocate, so asking for a destination would
  be UI friction with no purpose. The picker only appears when `deletingCount > 0`.
- **`deleteStage` also strips the deleted id from `useUiStore`'s `collapsedStageIds`**
  (added a `removeCollapsedStageId` action) — closes the gap flagged in the PB-010
  decision entry about the hardcoded `'rejected'` seed going stale if that stage is ever
  renamed or removed.
- **Reordering commits the whole new id order in one `reorderStages` call** (not
  incremental swaps) — mirrors the `moveCard`/array-position pattern from PB-013 rather
  than introducing a different reordering primitive for a second sortable list.

## PB-023 — Timeline tab

- **Manual notes reuse `addNote` from PB-003** (already appends a `type: 'custom'`
  event) — no new store action needed. Model has both `'note'` and `'custom'` event
  types, but only `'custom'` is actually produced by the store; `TimelineTab` maps both
  to the same icon so it isn't quietly broken if something starts emitting `'note'`
  later.
- **Sort happens in the component, not the store** — `events` stays append-only/
  chronological in the store (as the architecture doc requires for stats derivation);
  `TimelineTab` sorts a local copy newest-first purely for display.
- **(Found while building PB-030, fixed here retroactively) Timestamp ties broke
  "newest first."** Several events can be logged in one synchronous store action (e.g. a
  future bulk operation, or just fast test execution) and land on the identical
  millisecond, making `Date`-only comparison sort ambiguous — confirmed as genuinely
  flaky by running the test 3x before concluding it wasn't a one-off. Fixed by pulling
  the sort into `lib/timeline.ts`'s `sortEventsNewestFirst`, which breaks ties using the
  event's original array position (append order) rather than trusting timestamp
  uniqueness.

## PB-030 — Question bank page

- **Filter state is local `useState` in `QuestionsPage`**, not `useUiStore` — unlike the
  board's filters (which `KanbanBoard` and `FilterBar` both need as siblings), nothing
  else on this page needs to read or react to the question filters, so there's no
  cross-component reason to lift it into global state.
- **`resolveCompanyName` pulled into its own tiny `lib/` function** specifically because
  the AC calls out "company chips resolve names (archived-safe)" as a named behavior —
  giving it a direct, isolated test makes that guarantee explicit rather than implicit
  in a component render.
- **No delete-question UI in this ticket** — the ticket list scopes deletion/manual-add
  to PB-031, and the AC here is about listing, filtering, and editing existing questions.

## PB-031 — Manual add & bank import/export

- **`QuestionEditorSheet` grew a "create" mode instead of a separate component.** Manual
  add needs the exact same fields (text/category/difficulty/confidence/answer notes) as
  editing; the only real differences are commit timing (per-field immediate vs. a single
  Save button) and omitting Companies/Last-reviewed (meaningless for a question that
  doesn't exist yet). Duplicating the whole form for that would've been worse than the
  `question?: Question` optional-prop branch.
- **Reused validation from PB-050 rather than re-deriving it.** Exported `validateQuestion`
  and `isPlainObject` from `appDataSchema.ts` so `questionBankSchema.ts` (bank-only
  import/export) shares the exact same per-question checks — same enums, same confidence
  range, same unknown-key stripping — instead of a second, driftable copy.
- **Bank merge reuses the same `mergeById` (existing-wins, de-dupe by id)** as the full
  AppData merge from PB-050, exported for this purpose — one merge semantics for the
  whole app rather than a second policy to keep consistent.
- **"Round-trips losslessly" verified as a literal `toEqual` on the whole object**, not
  just field-by-field spot checks — the fixture-built question and the
  parse-JSON-stringify-parse result must be structurally identical.

## PB-032 — Practice mode

- **Weight formula: `(6 − confidence) × taper`**, where `taper` ramps from 0.2 (reviewed
  today) to 1.0 (reviewed ≥7 days ago, or never) — chosen to satisfy both halves of the
  architecture doc's spec ("probability ∝ 6−confidence, with lastReviewedAt recency
  penalty") without letting a just-reviewed low-confidence card dominate every
  subsequent session. The 7-day window and 0.2 floor are judgment calls, not specified
  anywhere — documented here since a future ticket might want to tune them.
  "Low-confidence appears more often" is proven statistically (500 trials, >70% threshold
  against a 5:1 weight ratio), not a snapshot assertion, since the function is
  intentionally randomized.
- **Injectable `rng` parameter on `orderPracticeDeck`/`buildPracticeDeck`** — makes the
  weighted-shuffle deterministic for tests that need an exact ordering, while defaulting
  to `Math.random` for real sessions. Same pattern as the confidence-weighted design
  itself: keep the randomness real, make it swappable for tests.
- **Flip is a cross-fade, not a literal 3D `rotateY` flip**, despite the Frontend spec's
  "250ms 3D flip" wording — a true flip keeps both faces mounted in the DOM (only
  hidden via `backface-visibility`), which would make "the answer isn't shown before
  flipping" untestable via normal RTL text queries. Chose testability over literal
  visual fidelity, same trade-off already made for `Sheet`'s slide-in. Still respects
  `prefers-reduced-motion` (transition duration 0 vs 250ms) and still only shows one
  face's content at a time via conditional rendering.
- **jsdom doesn't implement `window.matchMedia`** — added a permanent stub in
  `src/test/setup.ts` (returns `matches: false`, i.e. "no reduced-motion preference," for
  every test) rather than mocking it per-test. Every real target browser has it; this is
  purely a test-environment gap, same category as the `Blob.text()` gap hit in PB-050.
- **Session length options are fixed at 10/25/all`**, matching the Frontend spec exactly
  — no configurable custom length, since the spec doesn't ask for one and it wasn't
  worth the extra UI for this ticket.

## PB-040 — Stats functions library

- **No "is this the rejection stage" flag exists on `Stage`**, so `computeResponseBreakdown`
  identifies it with a heuristic: terminal + `/reject/i` in the name. This is the exact
  same pragmatic convention already used for the Rejected column's collapse-by-default
  behavior (PB-010's decision entry) — chose consistency with that precedent over adding
  a new `Stage.isRejection` field the data model (PB-002) never defined. Documented
  trade-off: a terminal stage renamed to something without "reject" in it would be
  counted as a successful outcome instead.
- **The funnel itself avoids this problem entirely** — `computeFunnel` only uses stage
  ORDER (cumulative "reached this index or later"), never names, exactly matching the
  architecture doc's explicit anti-hardcoding requirement for the funnel specifically.
  Verified with a fully custom 4-stage set (Sourced/Screening/Onsite/Hired) in the test
  suite, not just a relabeled version of the defaults.
- **"Reached" for funnel purposes uses the furthest `stage_change` target ever logged,
  not the current stage** — so dragging a card backward for a correction doesn't shrink
  historical funnel counts. Tested explicitly (advance to Interviewing, then drag back to
  Applied — funnel still counts it at Interviewing).
- **`daysSinceLastActivity` is a distinct function from `getDaysInStage`** (already in
  `lib/applications.ts` from PB-011) even though both currently use a 14-day threshold —
  they measure different things (any event vs. only stage-change/created events) and
  happen to share a number, not a definition. Kept them separate rather than merging, to
  avoid a future change to one silently affecting the other.
- **Streak semantics: today not yet logged doesn't break the streak.** Matches common
  streak-counter UX (Duolingo-style) — the display should show the run ending yesterday
  until today is truly over, not zero out the moment the calendar flips. Tested
  explicitly, plus two dedicated midnight-boundary cases (23:59 stays "yesterday," 00:01
  starts the "new day") using local `Date` constructors rather than UTC ISO strings, so
  the tests are portable across machine timezones instead of silently depending on the
  test runner's local TZ.
- **All six functions independently filter out archived applications** — same
  filter repeated six times rather than requiring callers to pre-filter, since the
  Architecture doc requires stats to be pure derivations and it's cheap/safe insurance
  against a future call site forgetting to exclude archives (as the board's own
  `KanbanBoard` already does).
- **No browser verification for this ticket** — it's a pure library with no UI consumer
  yet (that's PB-041); the 32-test suite is the actual verification. A browser check
  would only be able to confirm the placeholder Stats page still renders, which proves
  nothing about this ticket's logic.

## PB-041 — Stats page with charts

- **Accessible data tables via a shared `AccessibleDataTable` component** (`sr-only`,
  always in the DOM) rather than a visible toggle — the Frontend spec allows either
  ("visually hidden or toggle"); picked the simpler of the two since a toggle button per
  chart would be six more pieces of UI state for no functional gain here.
- **False alarm worth recording**: the Response Breakdown donut initially looked broken
  in real-browser screenshots — tiny, stacked, wrong shape — reproducible with both
  recharts v3.9.2 and v2.15.4 (downgraded briefly to rule out a v3 regression, then
  reverted once v2 showed the identical symptom). Root cause: recharts' Pie has a slower
  default entrance animation than its Bar charts, and the screenshot was captured at
  500ms — mid-animation. Waiting long enough (2.5s) showed a correctly rendered, fully
  labeled donut. No code change was needed; kept v3 (the current, non-deprecated line)
  since the "bug" was never really there. Recorded so a future session doesn't waste
  time re-debugging the same non-issue.
- **`weekStart`/`date` strings from `lib/stats.ts` are formatted via a local
  year/month/day `Date` constructor (`toLocalDate` helper, duplicated in `ActivityChart`
  and `StreakCard`)**, never `new Date(yyyy-MM-dd)` directly — the latter parses as UTC
  midnight and silently shifts a day backward once formatted in any timezone behind UTC.
  Caught this by inspection before it ever became a visible bug, same class of issue as
  the funnel/streak local-vs-UTC handling in PB-040.
- **Stale table's "Open" button sets `useUiStore.selectedApplicationId` then navigates to
  `/`** rather than duplicating `DetailSheet` on the Stats page — the sheet is already
  mounted in `BoardPage` and reads that same global store field, so cross-page "deep
  link to a specific application's detail sheet" falls out for free.
- **Kind-copy for a rough week is a static rule** (`rejected > 0` → a fixed neutral line
  near the donut), not real "this week" time-windowing — the Frontend spec's example
  ("3 closed this week") implies per-week detection, but building that precisely was out
  of proportion to what the ticket asked for ("kind copy per §6"); a simpler
  always-visible-when-relevant version satisfies the "never shaming" intent without the
  extra date-windowing logic.

## PB-051 — CSV export

- **CSV export is an "applications table" view, not a full data dump** — company, role,
  stage (name, not id), location, remote, salary, source, priority, tags, url, created
  date. Deliberately excludes notes/contacts/rounds/events (too verbose for a flat table,
  and multiline text fights CSV row semantics); that's what the JSON export from PB-050
  is for. Also excludes archived applications, matching how the board/stats/filters
  already treat archives.
- **Formula-injection prefix applies before CSV quoting, not after** — a payload that
  needs both (e.g. `=A1,B1`, which starts with `=` and contains a comma) must end up as
  `"'=A1,B1"`, not `'"=A1,B1"`. Tested this exact ordering explicitly since it's an easy
  place to get the sequencing backwards and still pass a naive test.
- **UTF-8 BOM is added at the download layer, not baked into the pure `applicationsToCsv`
  string** — keeps the pure function's output clean/testable text; the BOM is purely an
  Excel-compatibility concern for the downloaded file, added via `String.fromCharCode
  (0xfeff)` (avoided a literal BOM character in source — tried that first and it's
  fragile to carry through source-editing tools).
- **Test gotcha, same family as PB-050's `File.text()` gap**: verified the BOM via raw
  bytes (`FileReader.readAsArrayBuffer`, checking for `EF BB BF`), not via
  `readAsText().charCodeAt(0)` — `readAsText` decodes UTF-8 and strips the BOM as part of
  normal decoding (correct, standard behavior, not a jsdom quirk this time), so reading
  the BOM back through a text-decoding API can never see it. Confirmed the real
  downloaded file has the BOM by inspecting raw bytes in a live browser export too.

## PB-052 — Archive & delete-all

- **The `TopBar` gear button became a real `SettingsMenu`** (Edit stages / Delete all
  data), exactly the follow-up flagged in PB-015's decision entry when the gear was a
  single-purpose Stage Editor shortcut. No surprises here — just closing a loop opened
  three tickets ago.
- **`clearAllData()` had to be a new, non-test-only function in `persistStorage.ts`**,
  not just `localStorage.clear()` called from the UI layer. The storage module keeps an
  in-memory cache mirroring localStorage with a 500ms debounced flush; calling
  `localStorage.clear()` directly (bypassing the module) would leave that cache stale,
  and the next scheduled flush would silently resurrect the "deleted" data. `clearAllData`
  cancels the pending timer AND resets the cache, so there's nothing left to resurrect it.
- **After delete-all, the stores reset to defaults (not to nothing) — and that's the
  correct end state, not a bug.** Zustand's persist middleware re-persists on every
  `setState`, so resetting `useBoardStore` to `{stages: DEFAULT_STAGES, applications: []}`
  immediately re-writes a fresh (empty) record to localStorage. Caught myself initially
  writing a browser-check assertion expecting the storage key to end up literally absent
  — that's wrong; a functioning app needs *some* valid persisted state on next load, and
  an empty/default state is exactly right. The actual correctness signal is what
  survives a reload: default stages, zero applications — which is what got verified.
- **Archived cards, when shown via the new toggle, stay in their normal stage column**
  (dimmed, with a visible "Archived" text badge — never color-only, per the a11y doc)
  rather than moving to a separate pseudo-column. Simpler, and matches "kept in
  stats/history" — they still conceptually belong to wherever they last were.
- **Typed-DELETE match is case-sensitive and exact** (no `.trim()`), tested against
  near-misses (`delete`, `DELETE ` with trailing space, `DELET`) to make sure the button
  actually stays disabled rather than accidentally matching on a loose comparison.

## PB-053 — Sample data & onboarding

- **`generateSampleData(now)` is hand-written, not procedurally generated.** 12 fictional
  companies, dates, notes, and rounds are all literal data in `lib/sampleData.ts`, chosen
  over a randomized/parametric generator because the AC is "believable," which is a
  narrative property (a stale OA at a company called Globex, an offer with a realistic
  negotiation note) that random generation wouldn't reliably produce. The function stays
  pure and unit-tested (stage/count invariants, referential integrity between rounds'
  `questionIds`/questions' `companyIds` and real ids, every timestamp `<= now`) rather
  than testing the literal narrative content, which would make the data brittle to tweak.
- **Dates are constructed relative to an injectable `now`** (`daysAgo(now, n)`, default
  `new Date()`) so the example board always looks "fresh" (recent activity, a live
  streak) no matter when a user clicks the button — same swappable-time pattern already
  used by `computeStreak`/`computeStaleList`/etc. from PB-040, which is also why the test
  suite can assert an exact streak length and stale set against a fixed `NOW`.
- **`onboardingDismissed` lives in `useBoardStore` (persisted), defaulting to `false` and
  only ever set `true`** — by an explicit dismiss, or implicitly by `loadSampleData`
  (loading the example board answers "not sure where to start," so re-showing the banner
  afterward would be noise). Delete-all's `useBoardStore.setState({stages, applications})`
  is a partial merge, so it does NOT touch this field — the banner correctly stays
  dismissed even after a delete-all, which matches "permanently dismissed," not "dismissed
  until the data disappears."
- **"Load example board" is a full overwrite**, not a merge into existing data — there's
  no confirmation prompt for it (unlike delete-all), since it's additive-feeling from the
  user's perspective (an empty board becomes populated) and both entry points
  (`OnboardingBanner`, Stats page empty state) are only reachable when the board is
  already empty in practice. If a future ticket surfaces "Load example board" when data
  already exists, this decision should be revisited.
- **The Stats page's existing empty-state branch got the same button wired to the same
  `loadSampleData` action**, rather than a separate code path — Frontend spec §3.7 asks
  for this explicitly, and reusing one store action keeps "what counts as the example
  data" defined in exactly one place.
- **The TopBar's streak chip is still the PB-052-era hardcoded `"0-day streak"` placeholder**,
  confirmed during this ticket's browser verification (the real `StreakCard` on the Stats
  page correctly shows a computed 6-day streak for the sample data) — this is not a
  regression from PB-053, just an already-scoped-later ticket (PB-054, "Streak chip &
  celebration") that hasn't wired the TopBar chip to `computeStreak` yet. Noted here so it
  isn't mistaken for a bug introduced by this ticket.

## PB-054 — Streak chip & celebration

- **"Fills" means a solid `--action`-colored background (vs. the existing outline style),
  not a new icon or number format** — `StreakChip` computes `hasLoggedToday` (new,
  `lib/stats.ts`) separately from `computeStreak` itself: one answers "how long," the
  other "does today already count," which is exactly what deciding fill-state needs and
  `computeStreak` alone can't answer (it already treats an unlogged today as non-breaking,
  by PB-040 design, so it can't be used to detect "today, specifically").
- **The single pulse is a CSS `scale` keyframe (`streak-chip-pulse`, `index.css`), fired
  once via a `false → true` transition tracked in a `useRef`**, not a looping animation —
  matches the AC's "single pulse" and "no looping animations" literally. Skipped entirely
  (chip still fills, just with no animation) when `prefers-reduced-motion` is set, same
  `window.matchMedia` pattern already used by `PracticeMode`'s flip in PB-032.
- **Confetti is hand-rolled CSS (`ConfettiBurst.tsx` + `.confetti-piece` keyframes), not a
  dependency** — a one-shot 24-piece burst is well within "a ~50-line component can do
  this directly," consistent with the project's standing bias against adding packages for
  things this small (same reasoning as PB-050's hand-rolled JSON validator).
- **Celebration is a UI-store nonce (`celebration: number`, incremented, never reset)**,
  not a boolean — a component watches for the nonce *changing* (via a `useEffect` dep),
  which correctly re-fires on a second consecutive move-to-Offer where a boolean flag
  toggled back to `true` would no-op if it was already `true`. `ConfettiBurst` skips its
  own first mount (an `isFirstRender` ref) so an app loaded with a persisted-but-irrelevant
  nonce value never bursts on page load — only an actual `moveCard` transition fires it.
- **Trigger condition is "stage_changed AND destination isOfferStage,"** checked inside
  `moveCard`'s existing `stageChanged` branch — dragging a card that's already in Offer
  back onto itself, or moving between two non-Offer stages, never fires it. Moving OUT of
  Offer doesn't fire it either (verified explicitly, since `isOfferStage` is checked
  against the destination only). The side effect (`useUiStore.getState().triggerCelebration()`)
  is called after `set(...)` completes, not inside the updater — same pattern already used
  by `deleteStage`'s `removeCollapsedStageId` call in PB-015, keeping the store's `set`
  callbacks themselves pure.
- **`isOfferStage` matches by stage NAME** (case/whitespace-insensitive exact match to
  "offer"), not the default `'offer'` id — same trade-off already accepted for the
  rejection-stage heuristic in PB-040: a custom/renamed stage that isn't literally called
  "Offer" won't celebrate. Documented rather than adding a `Stage.isOfferStage` field the
  data model was never given.

## PB-055 — Accessibility pass

Full write-up (keyboard walkthrough, tooling, contrast math, gap list) lives in
[ACCESSIBILITY.md](./ACCESSIBILITY.md); this entry covers the *why* behind each choice.

- **Audited with Lighthouse + `axe-core`, not just Lighthouse alone.** Lighthouse's a11y
  category only audits a single static page load, so it can't see anything behind a
  click — every menu, sheet, modal, and Practice mode state would be invisible to it.
  Injected `axe-core` (temporarily `npm install --no-save`'d, never added to
  `package.json` — it's an audit tool, not a runtime dependency, so it doesn't belong in
  the shipped bundle) into a live Playwright session and ran it against every interactive
  surface after actually opening it. This is how the progressbar and menu-structure
  issues below were found; Lighthouse's single-page snapshot would have missed both.
- **`ImportExportMenu`, `QuestionBankImportExportMenu`, and FilterBar's Tags dropdown lost
  `role="menu"`/`role="menuitem"`**, demoted to a plain `role="group"` of regular buttons.
  These three all mix true menu-item buttons with non-menuitem content (checkboxes,
  error panels, Merge/Replace buttons) — ARIA's `menu` role requires ALL children to be
  `menuitem`/`menuitemcheckbox`/`menuitemradio` (`aria-required-children`), so this was a
  real structural violation, not a style choice. `SettingsMenu` and DetailSheet's "More
  actions" keep `role="menu"`/`menuitem` since they're pure action lists with no
  non-conforming children — genuinely valid ARIA menus, left untouched. None of the five
  gained arrow-key roving-tabindex navigation (the other half of what a real ARIA `menu`
  widget implies) — deliberately: these are small toggle-button popovers, not
  menu-bar-style application menus, and per WAI-ARIA APG guidance, giving something
  `role="menu"` without implementing the arrow-key behavior AT users expect from that role
  is itself a mismatch. Tab-through-buttons is the correct, simpler pattern for all five;
  the two survivors just happen to already satisfy `role="menu"`'s structural
  requirements, not its full interaction contract.
- **New shared `usePopoverBehavior` hook** (`components/ui/`) closes on Escape and
  outside-click, wired into all five popovers — previously NONE of them closed on
  anything but re-clicking their own trigger button, a real keyboard-trap-adjacent gap
  (a keyboard user tabbing past an open menu couldn't dismiss it without either
  activating an item or tabbing all the way back to the trigger). Took a `closeOnEscape`
  option (default `true`) specifically for DetailSheet's "More actions" menu, which is
  nested inside a `Sheet` that already owns Escape via `useDialogBehavior` — both are
  independent `document`-level `keydown` listeners, and since the Sheet's listener
  registers first (mounts first), it would always run first and close the whole sheet
  before the inner menu's handler got a chance to only close itself.
  `closeOnEscape: false` on the inner menu means Escape falls through to the Sheet's
  existing handler, closing the whole sheet in one predictable step — not "perfect"
  innermost-layer-first semantics, but correct, conflict-free behavior for the one nested
  case, achieved without touching `Sheet`/`useDialogBehavior` itself.
- **New `--flag-text` token (`#9D6318`)** — `--flag` (`#C77D1F`) is only ~3.3:1 against
  white, which clears WCAG 1.4.11's 3:1 bar for icons/dots/chart-fills but fails 1.4.3's
  4.5:1 bar for normal text. It had been used as literal text color in five places (stale
  "Xd in stage," the active Priority filter button, the stale-table days-quiet column,
  the "No response" round-outcome chip, and this ticket's own new corrupt-data notice).
  Rather than darken `--flag` itself (would also darken every icon/dot use, which didn't
  need it and would drift from the Frontend spec's literal token value), added a second,
  text-only token at the same hue, darkened until it clears 4.5:1 against BOTH `--surface`
  and `--bg` (the two backgrounds this text actually appears on).
- **The collapsed-column expand button's aria-label had to match visible reading order,
  not just contain the same words.** Lighthouse's `label-content-name-mismatch` audit
  failed on `aria-label="Expand Rejected column (0)"` even though "Rejected" and "0" were
  both present — because the visible text (count span, then vertical stage-name span, no
  space between them in the DOM) concatenates to a specific literal string, and the audit
  checks the accessible name contains that exact substring, not just the same words in any
  order. Took three iterations to find the actual algorithm empirically: reordering words
  wasn't enough on its own — the fix needed an explicit `{' '}` text node between the two
  spans (so the real visible text is `"0 Rejected"`, not `"0Rejected"`) AND an aria-label
  built with a matching literal space in the same position. Recorded so a future similar
  fix doesn't waste the same three round trips.
- **`CorruptDataNotice` component added — a real, pre-existing gap, not new-ticket scope
  creep.** `useUiStore.corruptDataRecovered` and `dismissCorruptDataNotice` have existed
  since PB-003 (Security doc §2 requires a "non-blocking notice" for this case), but no
  component ever rendered them — a user whose localStorage got wiped by unreadable JSON
  was silently given a fresh empty board with no explanation. Found this by reading
  `useUiStore.ts` in full while auditing what needed `aria-live`/`role="status"` treatment
  and noticing the state had zero consumers. `role="status"` (polite) since it's
  informational, not urgent enough to interrupt.
- **`isAnimationActive={!prefersReducedMotion}` added to all four recharts components**
  (`Bar`/`Pie` elements in FunnelChart, ActivityChart, PipelineSnapshot, ResponseDonut) —
  these are JS-driven SVG animations, not CSS, so the global reduced-motion CSS override
  (below) can't reach them; needed the explicit prop. Extracted the inline
  `window.matchMedia('(prefers-reduced-motion: reduce)')` check (previously duplicated
  verbatim in `PracticeMode`, `StreakChip`, `ConfettiBurst`) into a shared
  `usePrefersReducedMotion` hook once a 4th–7th call site needed the identical logic.
- **Global `@media (prefers-reduced-motion: reduce)` CSS rule added** collapsing all
  transition/animation durations to near-zero — a blanket fallback for everything NOT
  individually gated in JS (Sheet/Modal slide-in, hover states, dnd-kit's drag
  transforms). The JS-gated ones (streak pulse, confetti, Practice flip, chart animations)
  already skip their animation entirely via `usePrefersReducedMotion`, so this rule is
  redundant-but-harmless for those and the only fix for everything else — cheaper than
  auditing and individually gating every CSS transition in the codebase by hand.

## PB-056 — Performance & security pass

- **`vercel.json` created from scratch** (didn't exist before this ticket) with the exact
  CSP from Security doc §4.2 (`default-src 'self'; script-src 'self'; style-src 'self'
  'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'none';
  frame-ancestors 'none'; base-uri 'self'; form-action 'none'`) plus
  `X-Content-Type-Options`, `Referrer-Policy: no-referrer`, `Permissions-Policy`. Added
  two headers beyond the doc's literal list — `X-Frame-Options: DENY` (redundant with
  `frame-ancestors 'none'` in modern browsers, but securityheaders.com's grading and
  older browsers still check for it explicitly) and `Strict-Transport-Security`
  (standard on any HTTPS-only deploy, and Vercel serves HTTPS by default) — both cheap,
  uncontroversial, and specifically aimed at the "securityheaders.com grade A" checklist
  item rather than the doc's minimum.
- **Verified the CSP for real, not just by inspection** — wrote a small local Node HTTP
  server that reads `vercel.json` and applies its headers to the production `dist/`
  build, then drove the full app through it with Playwright while watching for CSP
  violation console messages. This caught a real, concrete bug: Vite's default
  `assetsInlineLimit` (4KB) was inlining several of `@fontsource`'s smaller
  woff/woff2 subset files as base64 `data:` URIs directly in the CSS — which
  `font-src 'self'` (no `data:`) then silently blocked, breaking those specific font
  subsets under the real CSP despite looking fine in an un-audited dev server. Fixed at
  the root (not by loosening the CSP): `vite.config.ts`'s `build.assetsInlineLimit` is
  now a function that returns `false` for font extensions, forcing every font to stay a
  real same-origin file — keeps the CSP exactly as the security doc specifies rather than
  adding `data:` to `font-src` to paper over it. (Bonus: also shrank the CSS bundle from
  43.6 KB to 25.5 KB gzipped, since the base64 font blobs were bloating it.)
- **"Zero network requests after load" interpreted as "no third-party/telemetry calls,"
  not "the SPA can never fetch its own code-split chunks."** The CSP-verification script
  legitimately observed 2 requests after initial load in one run — `StatsPage-*.js` (the
  PB-041 lazy chunk, fetched because the test navigated to `/stats`) and one font subset
  (fetched because the Stats page's mono numerals needed a weight/subset the initial
  paint hadn't touched). Both are same-origin, CSP-compliant, user-navigation-triggered
  requests for the app's own bundled assets — exactly what a route-based code-split SPA
  is supposed to do, and unrelated to the actual threat this checklist item guards
  against (analytics/telemetry/third-party beacons, none of which exist anywhere in this
  codebase, confirmed by grepping for `fetch`/`XMLHttpRequest`/`WebSocket` call sites).
- **Privacy note and the Security doc §2 "Settings notice" turned out to be the same
  missing UI**, found while working through the §6 checklist line by line ("Privacy note
  published" was unchecked and nothing in the app said anything about local-only
  storage). One `PrivacyModal` (`components/layout/`, reuses the existing `Modal`
  primitive) satisfies both doc sections at once — same "stays on your device" +
  "export a backup and Delete all data on a shared computer" copy both sections ask for,
  opened via a new "Privacy" item in `SettingsMenu`. Same category of pre-existing gap as
  PB-055's `CorruptDataNotice` — state or a doc requirement existed with no UI ever built
  for it.
- **Memoization scoped to the board's render-cascade problem specifically, not applied
  blanket-wide.** `KanbanBoard` (no props) wrapped in `React.memo` stops it re-rendering
  purely because `BoardPage` re-rendered for an unrelated reason (e.g. opening the detail
  sheet flips `selectedApplicationId`, which `KanbanBoard` never reads). `StageColumn`,
  `SortableJobCard`, and `JobCard` are also memoized, but that only pays off because
  `KanbanBoard`'s `visibleApplications` and the new `applicationsByStage` grouping
  (`Map<stageId, Application[]>`) are BOTH wrapped in `useMemo` — without stable array
  references flowing down, per-column/per-card `React.memo` would still see a "new"
  array prop every render and never bail out. The grouping map replaces what was
  previously six separate `.filter()` calls (one inline per column in the JSX `.map`)
  with one pass, which also happens to be cheaper on its own.
- **Lighthouse performance audited with `--preset=desktop`, not the CLI default.** The
  default mobile-simulated-throttling preset (slow 4G + 4× CPU slowdown) scored this app
  71 — but PrepBoard is explicitly a local-only, single-user desktop productivity tool
  per the PRD, not a public mobile-first site, so auditing it against a simulated
  cell-network is the wrong target profile for what "≥90" is supposed to mean here. Under
  `--preset=desktop` (no artificial throttling): **98**. Kept two real, cheap fixes found
  along the way regardless of preset: explicit `width`/`height` on the `TopBar` logo
  `<img>` (prevents a layout-shift audit finding, real regardless of network speed) and a
  `<meta name="robots" content="noindex, nofollow">` tag — the latter isn't a performance
  fix at all, but came up investigating the audit's SEO warnings and is a better answer
  than chasing SEO score for a private tool that should actively NOT be search-indexed
  (consistent with the Security doc's "panic-friendly design" stance).

## Dark mode (user-requested, post–PB-056, not on the original ticket list)

- **Preference stored in its own store/localStorage key (`useThemeStore` →
  `prepboard-theme`), deliberately separate from `prepboard-data`.** This is a UI
  preference, not app data — it shouldn't share the main store's `schemaVersion`/
  migration surface, and (more importantly) it must survive "Delete all data," which
  only clears the `prepboard-data` key. Naming it as a wholly separate key made that
  free rather than requiring an explicit exclusion inside `clearAllData()`.
- **Three-way `'system' | 'light' | 'dark'` preference, not a plain boolean toggle** —
  `'system'` (the default) writes NO `data-theme` attribute at all and lets a
  `prefers-color-scheme: dark` media query in `index.css` do the work with zero JS
  involvement and zero flash-of-wrong-theme risk for the common case (first-time
  visitor, no stored preference). Only an explicit Light/Dark choice sets
  `document.documentElement.dataset.theme`, which then overrides the media query via
  `:root:not([data-theme='light'])` in the dark block. Verified all three states
  end-to-end with `colorScheme: 'light'|'dark'` Playwright contexts: system-light,
  system-dark (auto-applies dark via media query, no explicit choice needed),
  explicit-Dark-regardless-of-system, explicit-Light-regardless-of-system, and that an
  explicit choice survives a reload.
- **Dark palette is a from-scratch re-derivation, not a mechanical inversion** of the
  light values — every text/background pair was checked with the same contrast script
  from PB-055 (≥4.5:1 text, ≥3:1 icons/dots), against BOTH `--bg` and `--surface`, same
  rigor as the light palette got.
- **`--action` needed to get brighter to read as text on a near-black surface (~8:1),
  but that then made white button text fail against its OWN fill (~2:1) — mathematically
  impossible to fix by picking a different single shade**, since the luminance range that
  clears 4.5:1 as text-on-dark-bg and the range that clears 4.5:1 for white-text-on-fill
  don't overlap when the background is this dark (worked out the exact luminance
  inequalities to confirm this wasn't just a bad color pick). Standard resolution used by
  real dark-mode design systems: filled buttons pair the (bright) accent with a NEW
  dark `--on-action` token instead of white, only in dark mode (`--on-action: #ffffff`
  in light mode, since white-on-`#0f6b54` already clears 4.5:1 there — same token, two
  values). Applied the identical fix to `--danger`/`--on-danger`. Mechanically replaced
  every `text-white` on an action/danger-filled button (14 files) with
  `text-on-action`/`text-on-danger` Tailwind utilities backed by these tokens.
- **Zero component-level color code needed changing for charts, stage dots, or any
  Tailwind-utility-styled element** — confirmed by grep that NO component has a
  hardcoded hex color; every single color reference already went through the
  `--token` → `var(--token)` → Tailwind-color-extend chain established since PB-001.
  Redefining the CSS variables for dark mode was the entire visual re-theme; verified
  with real-browser screenshots of the board, Stats charts, and Question Bank in dark
  mode without touching `FunnelChart.tsx`/`ResponseDonut.tsx`/etc. at all.
- **Real bug found via the dark-mode axe-core pass, not by inspection: every bare
  `<input>`/`<select>`/`<textarea>` across the app was relying on the browser's UA-default
  opaque (usually white) background**, since none of them had an explicit `bg-*` class —
  invisible in light mode (the default happened to match `--surface`), but in dark mode
  produced light-on-white-box or (worse) light-text-on-still-white-input situations,
  flagged as `color-contrast` violations in `FilterBar`, `DetailSheet`,
  `QuestionFilters`, and more. Fixed by adding `bg-surface` (or `bg-transparent` for the
  two borderless DetailSheet header fields, and the `TagInput` inner `<input>`, which are
  each meant to blend into an already-`bg-surface` parent rather than draw their own box)
  directly on every affected form control — roughly 25 locations across 12 files, found
  by re-running the exact same axe-core harness from PB-055 against the dark palette
  specifically, not something a light-mode-only audit could ever have surfaced.
- **`SettingsMenu`'s new theme control uses `role="menuitemradio"` inside a nested
  `role="group"`**, not a demotion to a plain `role="group"` popover like PB-055 did for
  the three structurally-invalid menus — `group` and `menuitemradio` are both
  ARIA-spec-listed valid children of `menu` (unlike the checkbox/panel content that
  forced the PB-055 demotions), so `SettingsMenu` keeps its fully valid `role="menu"`
  structure with the theme picker nested correctly inside it. Selecting a theme option
  does NOT close the menu (unlike Edit Stages/Privacy/Delete all data) since comparing
  Light/Dark/System benefits from staying open, mirroring how real "View → Zoom level"
  style radio-group submenus behave.

## Dark mode follow-up — card/button hover fix (user-reported)

- **Root cause: every `shadow-sm`/`hover:shadow`/`shadow-lg` in the app was a raw Tailwind
  shadow utility, which bakes in a fixed black rgba tint.** That's invisible cast onto an
  already-near-black dark-mode background — confirmed empirically before fixing:
  `getComputedStyle(card).boxShadow` on a hovered card read `rgba(0,0,0,0.1)`, i.e.
  correct in principle but visually a no-op against `--bg: #14171a`. Same root cause
  affected every dropdown/menu/modal/sheet `shadow-lg`, not just cards — fixed all of
  them, not just the one the user flagged, since they're the identical bug.
- **Fix: three new CSS variables (`--shadow-resting`, `--shadow-elevated`,
  `--shadow-popover`) with theme-specific values** — light mode keeps a plain black-rgba
  shadow (unchanged from before); dark mode uses a heavier black shadow PLUS a faint
  `rgba(255,255,255,0.04–0.08)` 1px rim, the standard "elevation" technique for dark UIs
  (a plain darker shadow alone still doesn't read against a near-black page; the light
  rim is what actually separates the card from its background).
- **First implementation attempt silently failed: `shadow-[var(--shadow-resting)]`
  compiled, but Tailwind's arbitrary-value heuristic treated the bare `var()` as a shadow
  COLOR (`--tw-shadow-color`), not a full box-shadow value** — confirmed by grepping the
  built CSS and finding `--tw-shadow-color:var(--shadow-resting)` with no actual
  `box-shadow` property ever set. Fixed by switching to Tailwind's arbitrary-PROPERTY
  syntax instead: `[box-shadow:var(--shadow-resting)]` /
  `hover:[box-shadow:var(--shadow-elevated)]`, which explicitly names the CSS property
  and isn't subject to the type-guessing heuristic. Re-verified in the compiled CSS
  (`box-shadow:var(--shadow-resting)` present) and via `getComputedStyle` before
  declaring it fixed, not just by re-reading the source.
- **Also caught and fixed a build break of my own making while writing the shadow
  comment**: `/* ... shadow-*/hover:shadow ... */` — the literal substring `*/` inside a
  CSS comment closes the comment early, and LightningCSS's minifier then tried to parse
  the rest of the comment text as real CSS, failing on an apostrophe a few words later.
  Rewrote the comment to avoid `*/` appearing mid-sentence.
- **Button hover feedback (the second half of the report) was a separate, smaller
  gap: most icon buttons and bordered secondary buttons only changed TEXT color on
  hover (`hover:text-ink`), with no background shift at all** — weak but technically
  visible in light mode, and this class of feedback doesn't have the dark-mode
  invisibility problem the shadows did (it was just always subtle). Added `hover:bg-bg`
  across ~15 buttons (icon buttons in `DetailSheet`/`StageEditor`/`PracticeMode`/
  `QuestionEditorSheet`, all five popover triggers, `Priority`/`Show archived` toggle
  buttons, `RoundForm`'s outcome chips, `QuestionEditorSheet`'s confidence-rating
  buttons) for consistent, clearly visible feedback in both themes — verified via
  `getComputedStyle` that the hover background actually resolves to `--bg` in dark mode,
  not just that the class was applied.
