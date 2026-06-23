---
target: dashboard
total_score: 39
p0_count: 0
p1_count: 0
timestamp: 2026-06-12T19-50-42Z
slug: src-app-packages-page-tsx
---
# Design Critique: Dashboard (`/packages`) — post-a11y audit

## Design Health Score (39/40 — Excellent)

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 4 | Live region, skeletons, bulk undo, filter counts |
| 2 | Match System / Real World | 4 | Action / county / done grouping |
| 3 | User Control and Freedom | 4 | Sibling button+link bulk rows; Esc; undo; retry sync |
| 4 | Consistency and Standards | 4 | Meridian tokens and list vocabulary throughout |
| 5 | Error Prevention | 4 | Mixed-status bulk blocked; forward-only options |
| 6 | Recognition Rather Than Recall | 3 | First-run keyboard hint bar still retires after one shortcut |
| 7 | Flexibility and Efficiency of Use | 4 | `/`, `j`/`k`, Enter, shift-range, bulk bar, guarded shortcuts |
| 8 | Aesthetic and Minimalist Design | 4 | Attention strip capped; list-led density |
| 9 | Error Recovery | 4 | Bulk undo + cloud Retry sync |
| 10 | Help and Documentation | 4 | Bulk update label, shortcuts dialog, select hint |
| **Total** | | **39/40** | **Excellent — ship it; optional P3 growth only** |

## Anti-Patterns Verdict

**LLM assessment:** Not AI slop. Distinctive Meridian instrument UI. Bulk-mode rows now use sibling `<button>` + `<Link>` — prior nested-interactive failure resolved.

**Deterministic scan:** `detect.mjs` returned **0 findings** on dashboard sources.

**Browser visualization:** Dashboard shell rendered (loading skeleton in cloud mode). Detect injected; **0 anti-patterns** after `ignore.md` filters. Populated list overlay not available during loading state.

## Overall Impression

The dashboard is production-ready. The audit pass closed the last meaningful UX/a11y gap. Remaining items are optional power-user and onboarding enhancements, not blockers.

## What's Working

1. **Accessible bulk rows** — Native toggle button + separate open link; no nested interactives; document shortcuts defer to focused controls.
2. **Morning-sweep IA** — Urgent strip (capped) → action needed → waiting → done, deadline-sorted within groups.
3. **Full recovery model** — Bulk undo, cloud retry, filter-aware urgency messaging.

## Priority Issues

### [P3] No inline status change from list
- **Why it matters:** Alex still opens detail or enters bulk mode for a single status move.
- **Fix:** Optional forward action on action-needed rows only.
- **Suggested command:** `/impeccable shape dashboard`

### [P3] Stale-in-review nudge is subtle
- **Why it matters:** >14 day in-review count hides when waiting group is collapsed.
- **Fix:** Muted banner or header badge when count > 0.
- **Suggested command:** `/impeccable delight dashboard`

### [P3] Keyboard hint bar retires permanently
- **Why it matters:** Jordan may never see `j`/`k` unless they find Shortcuts — mitigated but not eliminated by persistent Shortcuts button.
- **Fix:** Optional — leave as-is or show muted one-line hint on Packages page only.
- **Suggested command:** `/impeccable clarify dashboard`

## Persona Red Flags

**Alex:** Satisfied for bulk and keyboard flow. Wants inline status (optional).

**Jordan:** Bulk update label helps. Group semantics still implicit on first visit.

**Sam:** Bulk row a11y issue **resolved**. Checkbox shift-range pattern acceptable.

**Morgan:** Morning sweep works. Stale review signal remains low-key.

## Minor Observations

- Cloud mode can linger on skeleton if workspace never hydrates — `/impeccable harden dashboard` if seen in production.
- No P0/P1/P2 issues remain on this surface.

## Questions to Consider

- Is inline status worth the row density, now that bulk mode is solid?
- Should stale-in-review earn its own strip, or a count badge on "With the county"?
