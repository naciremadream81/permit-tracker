---
target: dashboard
total_score: 38
p0_count: 0
p1_count: 0
timestamp: 2026-06-12T19-43-15Z
slug: src-app-packages-page-tsx
---
# Design Critique: Dashboard (`/packages`) — post-polish run

## Design Health Score (38/40 — Excellent)

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 4 | Live region, skeletons, bulk undo, filter counts |
| 2 | Match System / Real World | 4 | Action / county / done grouping fits expeditor workflow |
| 3 | User Control and Freedom | 4 | Bulk row toggles selection; chevron opens; Esc + undo |
| 4 | Consistency and Standards | 4 | Meridian tokens and list-row vocabulary throughout |
| 5 | Error Prevention | 4 | Mixed-status bulk blocked; forward-only status options |
| 6 | Recognition Rather Than Recall | 3 | First-run keyboard hint bar still retires after one shortcut |
| 7 | Flexibility and Efficiency of Use | 4 | `/`, `j`/`k`, Enter open/toggle, shift-range, bulk bar |
| 8 | Aesthetic and Minimalist Design | 4 | Attention strip capped at 3; list-led density holds |
| 9 | Error Recovery | 4 | Bulk undo + cloud banner "Retry sync" |
| 10 | Help and Documentation | 4 | "Bulk update" label, shortcuts dialog, first-run select hint |
| **Total** | | **38/40** | **Excellent — ship-quality with minor a11y polish** |

## Anti-Patterns Verdict

**LLM assessment:** Not AI slop. Bespoke Meridian instrument UI — grouped lists, brass attention strip, steel-teal restraint. Prior P2 issues (bulk row navigation, cloud retry, attention overflow) are resolved in code.

**Deterministic scan:** `detect.mjs` on dashboard sources returned **0 findings**.

**Browser visualization:** Dashboard chrome rendered at `localhost:3001/packages` (shell + page head). Portfolio data remained in loading state (cloud subscription). Detect script injected successfully; **0 anti-patterns** after applying `ignore.md` (single-font, flat-type-hierarchy). No reliable full-data overlay on populated lists this run.

## Overall Impression

The dashboard crossed from "excellent with known friction" to "production-ready for expeditor morning sweeps." Bulk select, keyboard Enter, attention-strip cap, and cloud retry directly address the last critique. What remains is fine-grained a11y and power-user depth, not structural UX debt.

## What's Working

1. **Bulk mode row model** — Row toggles selection; chevron opens detail; undo toast defers while selection bar is open.
2. **Scaled urgency** — Attention strip shows 3 items with "Show all N urgent" — brass accent stays meaningful.
3. **Recovery paths** — Cloud `retryCloudSync()` + banner button; bulk undo toast with timer pause.

## Priority Issues

### [P2] Nested interactive elements in bulk mode rows
- **Why it matters:** Select-mode row is `role="button"` wrapping a chevron `Link` — nested focusables confuse keyboard and screen-reader users (Sam).
- **Fix:** Make row a single focus target; chevron as `onClick` navigation on a separate sibling, or use roving tabindex pattern without nesting `<a>` inside `role="button"`.
- **Suggested command:** `/impeccable audit dashboard`

### [P3] Possible Space key double-toggle on focused row
- **Why it matters:** Row `onKeyDown` and document-level Space handler both toggle selection — may cancel out or feel flaky.
- **Fix:** Stop propagation on row Space, or remove duplicate handler when focus is inside `.pkg-row--selectable`.
- **Suggested command:** `/impeccable polish dashboard`

### [P3] No inline status change from list
- **Why it matters:** Alex still must open detail or bulk-select to move status on one package.
- **Fix:** Optional quick-action on row hover/focus (status dropdown or forward button) for action-needed group only.
- **Suggested command:** `/impeccable shape dashboard`

### [P3] Stale-in-review nudge easy to miss
- **Why it matters:** >14 day in-review count only appears in waiting-group hint when that group is visible/expanded.
- **Fix:** Surface as a one-line banner when count > 0, similar to attention strip but muted (not brass).
- **Suggested command:** `/impeccable delight dashboard`

## Persona Red Flags

**Alex (Power User):** Satisfied for bulk workflow. Still wants single-package status change without navigation.

**Jordan (First-Timer):** "Bulk update" label is clearer than "Select." Group meanings still unexplained on first visit.

**Sam (Accessibility):** Nested button+link in bulk rows is the main remaining failure. Checkbox `onChange` pattern is improved.

**Morgan (Expeditor):** Morning sweep IA is solid. Stale review signal remains subtle.

## Minor Observations

- Cloud mode can leave dashboard on skeleton indefinitely if workspace never hydrates — consider timeout + error state (hardening, not visual).
- Keyboard hint bar still retires; Shortcuts button compensates adequately.

## Questions to Consider

- Can bulk-mode rows be one focus stop with "Open" as a secondary action, not a nested link?
- Is inline status on rows worth the density cost, or is bulk mode enough for Alex?
- Should stale-in-review get its own muted strip, or a badge on the waiting group header?
