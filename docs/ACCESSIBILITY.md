# Accessibility

Written for PB-055 (Accessibility pass). Covers the keyboard walkthrough required by
that ticket's AC, plus a summary of what was audited and fixed. See
[DECISIONS.md](./DECISIONS.md) under "PB-055" for the reasoning behind each choice.

**Audit tooling:** Lighthouse (`npx lighthouse … --only-categories=accessibility`) against
the production build, and `axe-core` injected into a live Playwright session for every
interactive surface (menus, sheets, modals, Practice mode) that a static page load can't
reach. Both were run against a populated board (12 applications, 15 questions) so charts,
stale-application rows, and populated menus were actually exercised — not just empty
states. Current results: **Lighthouse a11y = 100** on Board/Questions/Stats; **0 axe-core
violations** (wcag2a/wcag2aa/wcag21a/wcag21aa) across every state listed below.

## Keyboard walkthrough

Everything below is reachable and operable with keyboard only (Tab / Shift+Tab / Enter /
Space / Arrow keys / Escape) — no mouse required at any point.

### Board

- Tab through the top bar (nav links → streak chip → Import/Export → Settings), then the
  filter bar (search → Priority toggle → Tags → Show archived → Clear all when present),
  then each stage column's cards in order, then each column's "+ card" quick-add.
- A job card is a `<button>`; Enter/Space opens its Detail Sheet.
- **Drag & drop by keyboard**: Tab to a card, press Space to pick it up, Arrow keys move
  it — Left/Right cross into the neighboring column, Up/Down reorder within a column
  (custom coordinate getter, since dnd-kit's default only reorders one list — see
  PB-013's decision entry). Space drops it, Escape cancels and returns it to its original
  position. Every pickup/move/drop/cancel is announced via `DndContext`'s
  `accessibility.announcements` (a live region), not just visually.
- A collapsed column (Rejected, by default) is a single button; Enter/Space expands it.
  Its accessible name reads the count and stage name in the same order they're visually
  stacked (e.g. "2 Rejected, expand column") so a screen-reader-plus-voice-control user's
  visible label and spoken name agree (WCAG 2.5.3).
- Quick-add: Tab into Company, Tab to Role, Enter submits from either field (handled
  explicitly in `onKeyDown`, since a 2-field form has no native implicit submission — see
  PB-012's decision entry), Escape cancels.

### Menus and popovers (Settings, Import/Export, Tags filter, "More actions")

All four close on **Escape** and on a **click outside** the popover, and are simple
Tab-navigable button lists (no arrow-key roving-tabindex — see PB-055's decision entry
for why that's the deliberate choice here, not an oversight). The one nested case
(DetailSheet's "More actions" menu, opened from inside the sheet) closes on outside-click
but intentionally *not* on its own Escape handler, so Escape falls through to the sheet's
handler and closes the whole sheet in one predictable step rather than requiring two
separate Escapes to back out.

### Sheets and modals (Detail Sheet, Stage Editor, Delete-all confirmation)

- Focus moves into the dialog on open and is trapped there (Tab wraps at both ends).
- Escape closes it; focus returns to whatever element triggered it.
- The Delete-all modal's destructive button stays disabled until the exact confirm word
  is typed (case-sensitive, no trimming), so it can never be triggered by an accidental
  Enter/Space.

### Practice mode (flashcards)

- Session-length picker: Tab between length options, Enter/Space starts.
- Flashcard: Enter/Space or Up/Down flips the card. Number keys 1–5 rate confidence
  (only active once flipped, so a rating can't be logged before the answer is seen).
  Left/Right (or the on-screen Prev/Next) move between cards. Escape exits back to the
  Question Bank at any point.
- The session progress indicator (`role="progressbar"`) has an accessible name
  ("Practice session progress: question N of M") — found missing during this audit
  (axe: `aria-progressbar-name`) and fixed.

### Stats page

- Every chart (Funnel, Applications over time, Response breakdown, Pipeline now) has a
  paired `sr-only` `<table>` with the same data (`AccessibleDataTable`, from PB-041) so a
  screen reader user gets the same information a sighted user reads off the chart,
  without needing a toggle to reveal it.
- The Stale table's "Open" button moves focus to the Board and opens that application's
  Detail Sheet directly — no separate keyboard path needed.

## Motion

- `prefers-reduced-motion: reduce` is respected everywhere: the streak chip's pulse, the
  confetti burst, Practice mode's flip cross-fade, and all four chart entrance animations
  (`isAnimationActive` gated per-chart) are skipped outright rather than just shortened.
  A global CSS rule (`index.css`) additionally collapses every *other* CSS
  transition/animation (Sheet/Modal slide-in, hover states) to near-zero duration as a
  blanket fallback for anything not individually gated in JS.
- Nothing loops: the confetti burst and streak pulse are both one-shot, self-clearing
  animations (verified in PB-054), not continuous.

## Contrast

All text/background pairs in `index.css`'s design tokens were checked against WCAG 1.4.3
(4.5:1 for normal text). One token, `--flag` (`#C77D1F`), was only ~3.3:1 on white —
fine for its icon/dot/chart-fill uses (WCAG 1.4.11 non-text contrast only needs 3:1) but
failing where it had also been used as literal text color (stale "Xd in stage" text, the
active Priority filter button, the stale-table "days quiet" column, the "No response"
round-outcome chip, and this ticket's new corrupt-data notice). Added `--flag-text`
(`#9D6318`, same hue, darkened to clear 4.5:1 against both `--surface` and `--bg`) and
repointed every TEXT usage to it, leaving `--flag` itself untouched for icons/dots/chips.

## Gaps found and fixed during this pass

- **Corrupt-data recovery notice was silently swallowed.** The store already tracked
  `corruptDataRecovered` (Security doc §2's "non-blocking notice" requirement) but no
  component ever rendered it — a user whose localStorage got wiped by unreadable JSON was
  never told. Added `CorruptDataNotice` (`role="status"`, dismissible).
- **`ImportExportMenu`, `QuestionBankImportExportMenu`, and the FilterBar's Tags dropdown
  used `role="menu"`/`role="menuitem"` while containing non-menuitem children** (checkboxes,
  error panels, Merge/Replace buttons) — an ARIA `aria-required-children` violation.
  Demoted to plain labelled `role="group"` popovers of regular buttons; `SettingsMenu` and
  DetailSheet's "More actions" kept `role="menu"`/`menuitem` since those really are pure
  action lists with no non-conforming children.
- **None of the five popovers closed on Escape or outside-click.** Added a shared
  `usePopoverBehavior` hook (`components/ui/`) and wired it into all five.
- **The collapsed-column expand button's visible text and accessible name disagreed in
  order** (WCAG 2.5.3, caught by Lighthouse's `label-content-name-mismatch`, not axe) —
  fixed by reordering the `aria-label` to match the visual top-to-bottom reading order.
