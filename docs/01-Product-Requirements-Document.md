# 01 — Product Requirements Document (PRD)
## Interview Prep Tracker

**Version:** 1.0
**Date:** July 2026
**Status:** Draft — Ready for Development

---

## 1. Product Overview

### 1.1 Product Name
**PrepBoard** (working title — free, local-first job application & interview prep tracker)

### 1.2 Problem Statement
Job seekers juggle dozens of applications across spreadsheets, notes apps, and memory. Existing trackers (Huntr, Teal, Notion templates) either charge for core features, require accounts, limit the number of tracked jobs, or are clunky general-purpose tools. Interview prep (questions asked, round notes, learnings) ends up scattered and lost between applications.

### 1.3 Solution
A 100% free, client-side web app combining:
1. A **kanban board** for tracking applications through stages
2. **Per-application interview logs** — rounds, questions asked, notes, outcomes
3. A **personal question bank** built from real interview experiences
4. A **stats dashboard** — response rates, pipeline health, activity streaks

All data in localStorage. No accounts, no limits, no data leaves the device.

### 1.4 Target Users
- **Primary:** Students & professionals actively job hunting (especially tech roles)
- **Secondary:** Career switchers running long, multi-month searches
- **Natural cross-audience:** ResumeForge users (link the two apps as a suite)

---

## 2. Goals & Non-Goals

### 2.1 Goals
1. Add a new job application in under 20 seconds
2. Never lose an interview question or learning again — everything searchable
3. Give honest pipeline insight ("you have 12 applications stalled > 2 weeks")
4. Zero cost to build, host, operate; no accounts; fully private
5. Feel satisfying to use daily (drag cards, streaks, quick-add)

### 2.2 Non-Goals (v1)
- No auto-import from LinkedIn/job boards (no APIs, no scraping)
- No email integration or reminders via notifications server
- No AI features
- No collaboration/sharing of boards
- No mobile native app (responsive web only)
- No cloud sync

---

## 3. Core Features (v1)

### F1 — Kanban Application Board
- Default columns (stages): **Wishlist → Applied → Online Assessment → Interviewing → Offer → Rejected**
- Columns are customizable: rename, add, remove, reorder (min 2, max 8)
- Job cards show: company, role, location/remote badge, days-in-stage, salary (optional), priority flag
- Drag cards between columns (mouse + keyboard); moving a card auto-logs a timestamped stage-change event
- Quick-add card (company + role only) from any column; details fill in later
- Card actions: edit, archive, delete
- Filter/search bar: by text, priority, tag; sort within column by date or priority

### F2 — Application Detail Panel
Opens as a side sheet when a card is clicked:
- Full details: company, role, link to job posting, location, salary range, source (referral/LinkedIn/etc.), tags, resume version used (nice tie-in: "ResumeForge — Classic v2"), contacts (name/role/email), notes
- **Timeline:** auto-logged stage changes + manual events (e.g., "sent follow-up email")
- **Interview Rounds** (F3) live here

### F3 — Interview Round Logs
Per application, add rounds:
- Round fields: type (Phone Screen / OA / Technical / System Design / Behavioral / HR / Other), date, interviewer(s), duration, outcome (Pending / Passed / Failed / No response)
- **Questions asked:** add multiple questions per round; each question can be sent to the Question Bank with one click
- Prep notes (before) and reflection notes (after): "what went well / what to improve"

### F4 — Question Bank
- Central searchable library of every question ever logged (+ manually added ones)
- Question fields: text, category (DSA / System Design / Behavioral / SQL / Domain / Other), difficulty (Easy/Med/Hard), companies where it appeared (auto-linked), your answer/notes (markdown-lite), confidence rating (1–5)
- Filter by category, difficulty, company, confidence
- **Practice mode:** flashcard-style review — question front, your notes on back, self-rate confidence after each; prioritizes low-confidence questions
- Import/export question bank separately as JSON

### F5 — Stats Dashboard
- Funnel chart: Wishlist → Applied → OA → Interview → Offer conversion counts & rates
- Applications over time (weekly bar chart)
- Response rate: % of Applied that moved forward vs. rejected vs. silent (> 21 days = "ghosted")
- Current pipeline snapshot: cards per stage
- Activity streak: consecutive days with any logged activity
- Stale alerts: applications with no activity for 14+ days

### F6 — Local Persistence & Data Portability
- Auto-save to localStorage (debounced), schemaVersion for migrations
- Full JSON export/import (whole app data) + CSV export of applications table
- "Delete all my data" with typed confirmation

### F7 — Onboarding
- "Load example board" with realistic sample data
- Empty-state hints per column and per feature

---

## 4. Future Features (v2+)
- Calendar view of upcoming interviews
- Browser-notification reminders (client-side only)
- Shareable read-only stats image ("my job hunt in numbers")
- Company research notes section
- Dark mode
- PWA/offline install

---

## 5. User Stories

| ID | As a… | I want to… | So that… | Priority |
|----|-------|-----------|----------|----------|
| US-01 | job seeker | add an application in seconds | tracking doesn't feel like a chore | P0 |
| US-02 | job seeker | drag applications between stages | my pipeline reflects reality | P0 |
| US-03 | job seeker | log questions asked in each round | I can prep better for the next company | P0 |
| US-04 | job seeker | search my question bank by company | I can prep for a repeat interview | P0 |
| US-05 | job seeker | see my funnel conversion rates | I know where I'm losing (resume? OA? finals?) | P1 |
| US-06 | job seeker | review questions flashcard-style | I actively practice, not just collect | P1 |
| US-07 | returning user | have all data persist locally | my search history is never lost | P0 |
| US-08 | job seeker | see which applications went stale | I know when to follow up | P1 |
| US-09 | privacy-conscious user | export everything as JSON/CSV | I own my data | P1 |
| US-10 | new user | load an example board | I get the idea in 10 seconds | P2 |

---

## 6. Success Metrics (qualitative, no analytics)
- Quick-add flow ≤ 20 seconds from click to card on board
- Question logged during a detail-view session in ≤ 3 clicks
- Lighthouse: Performance ≥ 90, Accessibility ≥ 95
- Bundle ≤ 600 KB gzipped (charts add weight; code-split the dashboard)
- Works in latest Chrome, Firefox, Safari, Edge

---

## 7. Constraints & Assumptions
- **Budget:** ₹0 — free OSS libraries and free static hosting only
- **No backend, no APIs, no accounts** — browser-only
- localStorage (~5 MB) is ample for text data (hundreds of applications)
- Single user per browser profile

---

## 8. Release Plan
- **M1 (MVP):** Board + cards + detail panel + rounds + persistence + JSON export — usable daily
- **M2:** Question Bank + practice mode + stats dashboard
- **M3:** Onboarding, CSV export, stale alerts, a11y/perf/security pass, deploy
