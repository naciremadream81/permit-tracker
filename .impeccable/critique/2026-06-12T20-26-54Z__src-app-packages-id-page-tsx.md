---
target: package detail
total_score: 40
p0_count: 0
p1_count: 0
timestamp: 2026-06-12T20-26-54Z
slug: src-app-packages-id-page-tsx
---
# Design Critique: Package detail (`/packages/[id]`)

## Design Health Score (40/40 — Excellent)

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 4 | Progress bar, export feedback, notes Saving/Saved, attachment undo, skeleton |
| 2 | Match System / Real World | 4 | Checklist, status moves, property roll, activity log fit expeditor workflow |
| 3 | User Control and Freedom | 4 | Back link, status Apply/Cancel, removal undo, Esc closes picker/dialog |
| 4 | Consistency and Standards | 4 | Meridian cards, pills, file chips; shortcuts dialog mirrors dashboard |
| 5 | Error Prevention | 4 | Staged status change, export disabled when empty, confirm before parcel/sub remove |
| 6 | Recognition Rather Than Recall | 4 | Sub-actions on touch; quiet attach on fine-pointer only; keyboard hints on desktop |
| 7 | Flexibility and Efficiency of Use | 4 | Forward status buttons on desktop; b/e/? shortcuts; mobile status collapse |
| 8 | Aesthetic and Minimalist Design | 4 | Checklist-led main column; side stack earns density without noise |
| 9 | Error Recovery | 4 | Undo attachment removal; export retry messaging; property lookup errors |
| 10 | Help and Documentation | 4 | Property + activity empty states; shortcuts dialog; sr-only shortcut summary |
| **Total** | | **40/40** | **Ship it — no blocking or recommended fixes remain** |

## Anti-Patterns Verdict

**LLM assessment:** Not AI slop. Purpose-built permit detail — checklist-first layout, contextual side stack, Meridian tokens. All items from the prior critique pass (sub-actions touch, notes feedback, activity empty state, export label, keyboard shortcuts, mobile status collapse) are implemented.

**Deterministic scan:** `detect.mjs` returned **0 findings** on `page.tsx`, `PropertyCard.tsx`, and `ContractorsCard.tsx`.

**Browser visualization:** Dev server returns **200** on `/packages/pkg-001`. Live a11y snapshot was minimal (likely cloud auth gate or loading shell without seeded session data in the browser harness). Code review + CLI scan carry this run; no overlay injection attempted.

## Overall Impression

The detail page is ship-ready. The polish pass closed every gap flagged across the critique arc (33 → 37 → 39 → 40). What remains are optional product enhancements, not UX defects.

## What's Working

1. **Status workflow** — Desktop forward moves stay one-click; mobile collapses to “Update status” with Apply/Cancel on the full picker; Esc cancels cleanly.
2. **Checklist + attachments** — Progress, quiet attach chips (desktop), undo on removal, responsive export label, export error/success feedback.
3. **Power-user parity** — `b` / `e` / `?` shortcuts, shortcuts dialog, Saving/Saved notes loop, activity empty state, touch-visible sub-actions.

## Priority Issues

None. No P0–P3 items warrant action before ship.

## Persona Red Flags

**Alex (Power User):** Detail shortcuts match dashboard rhythm; forward status on desktop preserves speed. No red flags.

**Jordan (First-Timer):** Activity and property empty states guide first actions; status picker uses Apply/Cancel. No red flags.

**Sam (Accessibility):** ARIA on checklist, progressbar, status group, notes/activity status regions; sr-only shortcut summary; dialog for shortcuts. No red flags.

**Riley (Stress Tester):** Export/attach/removal undo paths robust; notes Saving/Saved covers debounce window. No red flags.

**Casey (Mobile):** Status collapse, export short label, sub-actions visible on touch. One-tap forward moves trade an extra tap on mobile — acceptable tradeoff for density.

## Minor Observations

- Mobile users lose one-click forward status in favor of a single “Update status” entry — intentional; monitor if expeditors complain.
- Main contractor edit icon always visible; subcontractor edit/delete still fade on desktop hover — slightly inconsistent but low impact.
- Browser QA without auth may show sign-in shell instead of populated detail — use local seed or signed-in session for visual review.

## Questions to Consider

- Should the dashboard shortcuts dialog link to detail shortcuts (`b`, `e`) for discoverability across routes?
- Would expeditors want `e` to trigger export (not just focus) with a confirm step?
- Is the detail page ready to mark “done” in your release checklist?
