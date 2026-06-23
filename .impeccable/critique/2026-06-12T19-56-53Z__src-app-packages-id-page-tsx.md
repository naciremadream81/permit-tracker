---
target: package detail
total_score: 37
p0_count: 0
p1_count: 0
timestamp: 2026-06-12T19-56-53Z
slug: src-app-packages-id-page-tsx
---
# Design Critique: Package detail (`/packages/[id]`)

## Design Health Score (37/40 — Excellent)

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 4 | Progress bar, export status/errors, attachment undo toast, skeleton |
| 2 | Match System / Real World | 4 | Checklist, county status moves, property roll, activity log fit expeditor workflow |
| 3 | User Control and Freedom | 4 | Back link, status Apply/Cancel, removal undo, parcel remove confirm |
| 4 | Consistency and Standards | 4 | Meridian cards, pills, file chips match dashboard vocabulary |
| 5 | Error Prevention | 4 | Staged status change, export disabled when empty, confirm before parcel/sub remove |
| 6 | Recognition Rather Than Recall | 3 | Subcontractor edit/delete actions fade in on hover only (desktop) |
| 7 | Flexibility and Efficiency of Use | 4 | Forward status buttons; full status picker with Apply; quiet attach chips |
| 8 | Aesthetic and Minimalist Design | 4 | Two-column detail grid; checklist earns density; cards on side for context |
| 9 | Error Recovery | 4 | Undo attachment removal; export retry messaging; property lookup errors |
| 10 | Help and Documentation | 3 | Property empty state teaches lookup; no empty activity state or save indicator on notes |
| **Total** | | **37/40** | **Excellent — prior P1/P2 fixes landed; minor polish left** |

## Anti-Patterns Verdict

**LLM assessment:** Not AI slop. Purpose-built permit detail — checklist-led main column, side stack for property/contractors/activity/notes. Matches DESIGN.md card-on-detail pattern. Prior critique issues (horizontal scroll min-width, instant status select, attach chip noise) are addressed in code.

**Deterministic scan:** `detect.mjs` returned **0 findings** on detail page and related components.

**Browser visualization:** Dev server returned **500** on `/packages/pkg-001` (stale `.next` module — environment, not design). Preflight mutation attempted; full detail UI not rendered for overlay inspection. CLI + code review carry this run.

## Overall Impression

Strong detail surface for daily expeditor work. The checklist + export + attachment flow is the product core and it's well executed. Up from 33/40 on the prior critique because mobile overflow and status-picker accidents are fixed. Remaining gaps are touch discoverability on contractor actions and small feedback loops (notes saved, empty activity).

## What's Working

1. **Staged status change** — Forward "Mark …" buttons plus Apply/Cancel on full status picker prevents accidental commits.
2. **Checklist + attachments** — Progress bar, quiet attach on rows with files, undo on removal, export with missing-doc heads-up.
3. **Property card flow** — Empty state explains roll lookup; address/parcel disambiguation; refresh and confirmed remove.

## Priority Issues

### [P2] Subcontractor actions hidden on touch
- **Why it matters:** `.sub-actions` uses opacity 0 until hover/focus-within — on touch devices edit/remove are invisible until tap (Casey/Sam).
- **Fix:** Mirror `template-actions` pattern: `opacity: 1` on `(pointer: coarse)` or `max-width: 640px`.
- **Suggested command:** `/impeccable adapt package detail`

### [P3] Notes autosave has no confirmation
- **Why it matters:** 600ms debounced save with no "Saved" indicator — expeditors may doubt persistence after blur.
- **Fix:** Brief `role="status"` "Notes saved" after flush, or subtle saved timestamp in card head.
- **Suggested command:** `/impeccable polish package detail`

### [P3] Empty activity timeline
- **Why it matters:** When `activity` is empty, the timeline is a blank `<ol>` — no guidance to log first entry.
- **Fix:** One-line empty state under the form: "No activity logged yet."
- **Suggested command:** `/impeccable onboard package detail`

### [P3] Export label on narrow viewports
- **Why it matters:** "Export submittal (.zip)" is long; card-head wraps but still dense at 360px.
- **Fix:** `@media (max-width: 480px)` shorten to "Export" with full label in `title`.
- **Suggested command:** `/impeccable adapt package detail`

## Persona Red Flags

**Alex (Power User):** Forward status buttons are fast. No keyboard shortcut back to portfolio (dashboard has rich shortcuts; detail doesn't).

**Jordan (First-Timer):** Property lookup empty state helps. Activity section gives no hint when empty.

**Sam (Accessibility):** Solid ARIA on checklist, progressbar, status group. Sub-actions opacity on touch is the main gap.

**Riley (Stress Tester):** Export/attach/removal undo paths well handled. Status Apply pattern prevents arrow-key accidents.

**Casey (Mobile):** `detail-grid` min-width fix addresses prior horizontal scroll. Sub-actions visibility on touch still weak.

## Minor Observations

- `detail-head` status button row can wrap heavily on small screens — acceptable given forward-only actions.
- Activity submit uses icon-only Plus with `aria-label` — fine.
- Dev server 500 on detail route blocked live browser critique; run `next build` + fresh dev if validating visually.

## Questions to Consider

- Should detail inherit one keyboard shortcut (e.g. `b` for back) from the dashboard shortcut vocabulary?
- Is notes "saved" feedback worth the visual noise, or is blur-to-save enough for this audience?
- Would a single "Actions" menu replace multiple forward status buttons on mobile?
