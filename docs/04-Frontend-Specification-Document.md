# 04 — Frontend Specification Document
## Interview Prep Tracker (PrepBoard)

**Version:** 1.0
**Date:** July 2026

---

## 1. Design Direction

A job hunt is a long campaign — the UI should feel like a **mission control / campaign HQ**: focused, energetic, quietly encouraging. Not corporate-HR sterile, not gamified-cutesy. The board is the hero; stats reward consistency.

### 1.1 Design Tokens

| Token | Value | Use |
|-------|-------|-----|
| `--ink` | `#17202B` | Primary text |
| `--bg` | `#F5F6F4` | App background, cool paper |
| `--surface` | `#FFFFFF` | Cards, sheets |
| `--line` | `#E2E5E1` | Borders |
| `--muted` | `#66707B` | Secondary text |
| `--action` | `#0F6B54` | Primary actions — a determined evergreen (progress, "go") |
| `--flag` | `#C77D1F` | Priority flag, warnings, stale amber |
| `--danger` | `#B23A2E` | Rejected, delete |
| `--win` | `#0F6B54` | Offer / passed outcomes (shares action green) |

**Stage column accents (defaults, user-editable):**
Wishlist `#8A8F98` · Applied `#3B6EA5` · OA `#7C5CB0` · Interviewing `#C77D1F` · Offer `#0F6B54` · Rejected `#9AA0A6` (muted, not angry red — rejection is data, not shame)

**Typography:**
- UI + headings: **Inter** (self-hosted)
- Numbers/stats/dates: **JetBrains Mono** — gives the dashboard its "mission control" character
- Scale: 12 / 13 / 15 / 18 / 22 / 28

**Spacing/shape:** 4px grid; card radius 10px; column radius 12px; shadows one soft layer; dragged card lifts with stronger shadow + 2° tilt.

**Signature element:** the **streak flame counter** in the header — a small monospace `▲ 7-day streak` chip that fills from grey to green as today's first activity is logged. Subtle, but the daily hook.

---

## 2. Layout & Navigation

### 2.1 App Shell
Top bar (persistent): logo/wordmark left · center nav tabs **Board / Questions / Stats** · right: streak chip, search (board only), Import/Export menu, settings.

### 2.2 Board Page — Desktop (≥ 1024px)

```
┌──────────────────────────────────────────────────────────────┐
│ TOPBAR: PrepBoard | [Board] Questions Stats | ▲5 streak  ⚙  │
├──────────────────────────────────────────────────────────────┤
│ FILTERS: 🔍 search  [Priority ⚑] [tags ▾] [+ Add job]        │
├──────────┬──────────┬──────────┬──────────┬────────┬────────┤
│ WISHLIST │ APPLIED  │    OA    │INTERVIEW │ OFFER  │REJECTED│
│   (4)    │   (12)   │   (3)    │   (2)    │  (1)   │  (8)   │
│ ┌──────┐ │ ┌──────┐ │ ┌──────┐ │ ┌──────┐ │┌──────┐│collapse│
│ │ card │ │ │ card │ │ │ card │ │ │ card │ ││ card ││  by    │
│ └──────┘ │ └──────┘ │ └──────┘ │ └──────┘ │└──────┘│default │
│ + quick  │ + quick  │          │          │        │        │
└──────────┴──────────┴──────────┴──────────┴────────┴────────┘
```

- Columns equal width, horizontal scroll if > 5 visible; column header: name, count, color dot, ⋯ menu (rename, color, delete)
- **Rejected column is collapsed by default** (shows count; expands on click) — keeps the board motivating
- Detail sheet slides from the right (520px), board dims slightly

### 2.3 Mobile (< 768px)
- Nav becomes bottom tab bar: Board / Questions / Stats
- Board: one column visible, swipe or segmented control to switch stages; card long-press → "Move to…" action sheet (drag on mobile is fiddly)
- Detail sheet becomes full-screen page

---

## 3. Component Specifications

### 3.1 Job Card
```
┌────────────────────────────┐
│ Acme Corp            ⚑     │  ← company (600) + priority flag
│ Frontend Engineer          │  ← role, muted
│ 🌐 Remote · ₹18–24L        │  ← badges row (optional fields)
│ ⏱ 6d in stage · 2 rounds   │  ← mono, muted; turns amber ≥14d
└────────────────────────────┘
```
- Click → detail sheet; drag handle = whole card; keyboard: focus card, Space lifts, arrows move, Space drops
- Days-in-stage derives from last stage_change event; ≥ 14 days in non-terminal stage → amber dot + tooltip "Stale — consider following up"

### 3.2 Quick-Add
"+ card" at column bottom → inline mini-form (Company, Role, Enter to save). Esc cancels. Everything else is edited later in the sheet.

### 3.3 Detail Sheet
Header: company + role (inline editable), stage select, priority toggle, archive/delete menu.
Tabs within sheet: **Details / Rounds / Timeline**
- **Details:** form fields per PRD F2 incl. tags (tag input reused from ResumeForge pattern), contacts list (name/role/email rows), notes (markdown-lite editor)
- **Rounds:** list of round cards (type icon, date, outcome chip); "+ Add round" → RoundForm
- **Timeline:** vertical list, newest first — auto events (mono timestamps) + "+ Add note" for manual events

### 3.4 Round Form
Type select (with icons), date picker, interviewers, duration, outcome segmented control (Pending/Passed/Failed/No response), prep notes, reflection notes.
**Questions asked:** repeating rows — question text + category + difficulty; each row has "Save to bank ↗" (one click, becomes linked chip). Already-banked questions searchable via typeahead to link instead of duplicate.

### 3.5 Question Bank Page
- Toolbar: search, filters (category, difficulty, company, confidence ≤ N), "+ Add question", **▶ Practice** button, import/export bank
- Table/list rows: question text (truncated), category chip, difficulty chip, company chips, confidence dots (●●●○○), last reviewed
- Row click → editor sheet: full text, answer notes (markdown-lite), metadata

### 3.6 Practice Mode (flashcards)
- Full-screen focus view: card front = question + category/company chips; **Space/tap flips** to your answer notes
- After flip: "How confident?" 1–5 buttons → records confidence + lastReviewedAt, advances
- Deck order from `lib/practice.ts` (low-confidence prioritized); session length picker (10/25/all filtered)
- Progress bar top; Esc exits; end screen: "12 reviewed · avg confidence 3.4 (+0.6)"

### 3.7 Stats Page
Cards grid (recharts, all colors from tokens):
1. **Funnel** — horizontal bars Applied → OA → Interview → Offer with conversion % between stages
2. **Applications over time** — weekly bars, last 12 weeks
3. **Response breakdown** — donut: Progressed / Rejected / Ghosted (>21d) / Waiting
4. **Pipeline now** — count per stage with column colors
5. **Streak card** — big mono number + calendar heat row of last 30 days
6. **Stale list** — actionable table: company, role, days quiet, "Open" button
Empty state (fresh user): friendly copy + "Load example board"

### 3.8 Stage Editor
Modal: list of stages with drag-reorder, rename, color swatch, terminal toggle; add (max 8) / delete (requires picking destination stage for existing cards). Warning copy explains funnel uses stage order.

### 3.9 Import/Export Menu
Export JSON (full) · Export CSV (applications) · Import JSON (validated, then confirm Replace/Merge) · Delete all data (typed DELETE).

---

## 4. Interaction & Motion
- Card drop: 150 ms settle animation; column count ticks
- Streak chip: fills color on first event of the day with a single 300 ms pulse — once, not looping
- Sheet slide-in 200 ms ease-out; tab switches instant
- Practice flip: 250 ms 3D flip, `prefers-reduced-motion` → instant swap
- No confetti on Offer… okay, ONE tasteful confetti burst when a card enters a terminal Offer stage (respecting reduced-motion). The job hunt is hard; celebrate.

---

## 5. Accessibility (WCAG 2.1 AA)
- Full keyboard kanban via dnd-kit keyboard sensor; move announced via aria-live ("Acme Corp moved to Interviewing, position 2 of 3")
- Sheet/modals: focus trap, Esc closes, focus returns to trigger
- All charts: accompanying data table (visually hidden or toggle) — charts are never the only representation
- Outcome/priority never conveyed by color alone (icons + text labels)
- Contrast ≥ 4.5:1; stage colors used on chips get auto-computed accessible text color
- Streak/emoji chips have text alternatives

---

## 6. States & Edge Cases
- **First visit:** empty board with default stages; one-time "Load example board" banner
- **All-rejected week:** stats copy stays neutral/kind ("3 closed this week — pipeline space for new applications"), never shaming
- **Timezone/midnight:** streak uses local startOfDay; test around midnight
- **Huge boards:** 200+ cards — columns scroll independently; filters debounce 150 ms
- **Question with deleted application:** company chip shows "(archived)" instead of breaking
- **Storage quota:** toast with export action
- **Import conflict:** Replace vs Merge clearly explained; merge de-dupes by id
