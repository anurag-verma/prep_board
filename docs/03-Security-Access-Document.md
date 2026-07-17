# 03 — Security & Access Document
## Interview Prep Tracker (PrepBoard)

**Version:** 1.0
**Date:** July 2026

---

## 1. Security Model Summary

Same minimal-attack-surface model as ResumeForge: **no backend, no accounts, no transmission**. Data here is arguably MORE sensitive than a resume — it includes salary expectations, recruiter contacts, interview outcomes, and candid self-assessment notes. Treat it accordingly.

**Threat model in one line:** protect job-search data from XSS, hostile imported files, malicious dependencies, and shoulder-surfing on shared machines — there is no server to attack.

---

## 2. Access Control

| Area | Policy |
|------|--------|
| Authentication / authorization | None by design — single user, local-only |
| Repository | GitHub: branch protection on `main`, changes via PR, 2FA on account |
| Deployment | Vercel deploys only from `main`; 2FA on Vercel account |

### Shared-computer & privacy considerations
Job searches are often conducted secretly (from a current employer) and sometimes on shared/office machines:
- Settings notice: "Your data is stored in this browser only. On a shared or work computer, export a backup and use **Delete all data** when done."
- **Delete all data**: typed-confirmation, clears localStorage completely
- **Panic-friendly design:** neutral app title/favicon option is out of scope for v1, but avoid anything that screams the user's private notes in browser-tab titles (tab title stays "PrepBoard", never "Offer from X")

---

## 3. Data Privacy

### 3.1 Data categories stored
- Company names, roles, job URLs, salary ranges
- Recruiter/interviewer names and emails (third-party personal data!)
- Interview questions, outcomes, and self-critical notes
- Behavioral patterns (activity timestamps)

### 3.2 Storage & transmission
- localStorage only; JSON/CSV files only when user explicitly exports
- **Zero network requests after page load** — no analytics, telemetry, error trackers, third-party scripts, or cookies
- Job posting URLs are stored as text and rendered as links; clicking them is the user's action (see 4.5 for link safety)

### 3.3 Compliance posture
- Operator collects/processes nothing → minimal GDPR/CCPA obligations
- Publish plain-language privacy note: "Everything stays on your device."
- Note re: contacts — users store third parties' names/emails locally; this is personal use (household exemption territory), but the privacy note should encourage responsible handling

---

## 4. Client-Side Security Requirements

### 4.1 XSS Prevention (highest priority)
User-controlled text appears everywhere (company names, notes, question text):
- **Never** `dangerouslySetInnerHTML` with user input
- Markdown-lite (notes, answers): whitelist renderer emitting only `<strong> <em> <ul> <li> <br>` — same component you built for ResumeForge; extract it or copy it with its tests
- React's default escaping covers plain-text fields; keep it that way (no `innerHTML` anywhere)

### 4.2 Content Security Policy
Same strict headers via `vercel.json`:
```
default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';
img-src 'self' data:; font-src 'self'; connect-src 'none';
frame-ancestors 'none'; base-uri 'self'; form-action 'none'
```
Plus `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`.

> `Referrer-Policy: no-referrer` matters doubly here: when users click stored job-posting links, the destination site must not learn they came from a job-tracker URL.

### 4.3 Supply-Chain Security
- Minimal deps; recharts and react-router are the only significant additions over ResumeForge — both massively used and maintained
- Lockfile committed; Dependabot on; `npm audit` in CI; licenses MIT/Apache/BSD only
- No CDN scripts — all bundled

### 4.4 Safe File Handling (imports)
- JSON import: ≤ 2 MB, try/catch parse, **full schema validation** — type-check every field, validate enums (RoundType, categories, confidence 1–5), verify referential integrity (stageId exists, questionIds exist), strip unknown keys
- Reject rather than "fix" invalid files; show which check failed
- CSV export: escape formula-injection — prefix cell values starting with `= + - @` with a `'` so exported CSVs are safe to open in Excel/Sheets

### 4.5 Stored URL safety
- Job URLs render as links only if they parse as `http:`/`https:` — anything else (e.g., `javascript:`) renders as inert text
- All external links: `rel="noopener noreferrer" target="_blank"`

---

## 5. Data Integrity & Recovery

| Concern | Control |
|---------|---------|
| Corrupted localStorage | try/catch reads; back up raw string to `-corrupt` key; fresh start; non-blocking notice |
| Schema evolution | schemaVersion + forward migrations, never destructive |
| Referential integrity drift | Deleting a stage requires choosing a target stage for its cards; deleting an application removes its id from questions' companyIds; covered by tests |
| Accidental deletion | Confirm dialogs; archive (soft-delete) preferred over delete for applications |
| Browser data loss | JSON backup prompts; "last saved" indicator |

---

## 6. Security Checklist (Definition of Done)

- [ ] No `dangerouslySetInnerHTML` with unsanitized input anywhere
- [ ] Markdown-lite whitelist renderer + XSS unit tests (script tags, event handlers, `javascript:` URIs render inert)
- [ ] URL fields validated to http/https before rendering as links; `noopener noreferrer` on all external links
- [ ] JSON import schema-validated incl. enums and referential integrity; hostile-file tests pass
- [ ] CSV export escapes formula injection (`= + - @`)
- [ ] CSP + headers configured; securityheaders.com grade A
- [ ] Zero network requests after load (DevTools verified)
- [ ] `npm audit` clean; Dependabot enabled
- [ ] "Delete all my data" verified
- [ ] Privacy note published
- [ ] 2FA on GitHub + Vercel
