---
target: dashboard
total_score: 28
p0_count: 0
p1_count: 4
timestamp: 2026-06-10T16-44-21Z
slug: src-app-page-tsx
---
# Design Critique: Dashboard (Portfolio view) — src/app/page.tsx

## Design Health Score (28/40 — Good)

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 4 | Skeletons, doc counts, deadline countdowns, export confirmations |
| 2 | Match System / Real World | 4 | Speaks expeditor language |
| 3 | User Control and Freedom | 2 | Attachment/sub deletes instant and irreversible; status moves can't be undone |
| 4 | Consistency and Standards | 3 | Directory remove confirms; attachment and sub removes don't |
| 5 | Error Prevention | 2 | No confirm on file deletion; mis-clicked "Mark approved" is one-way |
| 6 | Recognition Rather Than Recall | 3 | Everything labeled |
| 7 | Flexibility and Efficiency | 1 | No search, no filters, no shortcuts, no bulk actions |
| 8 | Aesthetic and Minimalist Design | 4 | List-led, calm density |
| 9 | Error Recovery | 3 | Plain-language errors with next steps |
| 10 | Help and Documentation | 2 | Teaching empty state; no contextual help beyond |

## Anti-Patterns Verdict
Not AI-slop. Detector: 1 finding — transition: width on progress bar (ui.css:747); use transform: scaleX. Browser detector flagged single-font + flat-type-hierarchy — false positives for product register.

## Priority Issues
- [P1] No search/filter on portfolio — fails at 30+ packages. Fix: search (client/ref/address) + county/type quick filters, `/` shortcut.
- [P1] Top nav overflows below ~420px (measured 477px right edge at 360px viewport). Fix: icon-collapse under 480px or bottom nav.
- [P1] Destructive actions without protection: attachment delete (permanent blob delete, no confirm/undo), sub remove instant; directory remove confirms (inconsistent). Fix: undo-toast on attachment delete; align sub removal.
- [P1] Status one-way ratchet: NEXT_STATUSES only forward; mis-click unrecoverable. Fix: "change status" affordance with full list or activity undo.
- [P2] --faint (oklch 0.60 0.018 225) text at 12–13px under 4.5:1 (group hints, file sizes, optional labels). Fix: use --muted for small text.

## Persona Red Flags
- Alex: no search/shortcuts/bulk status updates.
- Sam: faint contrast; 32px icon buttons < 44px; package row accessible name = whole row text.
- Casey: nav overflow at 360px; New package out of thumb zone.

## Minor Observations
- Progress bar width animation → scaleX.
- Separator dots orphan at mobile line wraps.
- Notes textarea writes per keystroke (Firestore cost in cloud mode) — debounce.
- Consider collapsing Approved & closed group as it grows.

## Questions
- What does this look like at 60 packages — does it need a "Today" digest?
- Should overdue escalate visually over time?
- Fastest path when a county batch-approves five permits?
