---
target: dashboard
total_score: 37
p0_count: 0
p1_count: 0
timestamp: 2026-06-12T19-27-59Z
slug: src-app-packages-page-tsx
---
# Design Critique: Dashboard (`/packages`)

## Design Health Score (37/40 — Excellent)

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 4 | Live region announces filter counts; skeleton rows; bulk undo toast with timer pause |
| 2 | Match System / Real World | 4 | "Action needed / With the county" grouping matches expeditor mental model |
| 3 | User Control and Freedom | 4 | Esc clears selection then filters; bulk undo; collapsible done/waiting groups |
| 4 | Consistency and Standards | 4 | Meridian tokens, status pills, list rows applied uniformly |
| 5 | Error Prevention | 4 | Bulk apply blocked on mixed statuses; search maxlength; forward-only status options |
| 6 | Recognition Rather Than Recall | 3 | Keyboard hint bar retires after first shortcut; `?` shortcuts not visually prominent |
| 7 | Flexibility and Efficiency of Use | 4 | `/` search, `j`/`k` nav, shift-click range select, bulk status bar |
| 8 | Aesthetic and Minimalist Design | 3 | Purposeful but chrome-heavy: toolbar + hints row + attention strip before lists |
| 9 | Error Recovery | 3 | Bulk undo strong; cloud error banner (Shell) still message-only, no retry |
| 10 | Help and Documentation | 3 | First-run select hint + shortcuts dialog; no contextual help beyond that |
| **Total** | | **37/40** | **Excellent — minor polish only** |

## Anti-Patterns Verdict

**LLM assessment:** Does not read as AI slop. The dashboard deliberately rejects the generic SaaS card grid in favor of grouped list rows, brass attention strip, and steel-teal restraint. It aligns with PRODUCT.md anti-references and DESIGN.md "Ship's Chronometer" north star. Inter + tight rem scale are register doctrine, not laziness.

**Deterministic scan:** `detect.mjs` on `src/app/packages/page.tsx` returned **0 findings**.

**Visual overlays:** Browser session hit the **cloud sign-in gate** (Firebase env present, user unauthenticated), so the portfolio UI was not rendered and reliable overlay injection on the dashboard could not complete. Preflight DOM mutation succeeded; detect script load was attempted after live-server start but the dashboard surface was unavailable for decoration.

## Overall Impression

This is a mature, task-first portfolio dashboard that earns trust for permit expeditors. The morning-sweep IA (urgent strip → action needed → waiting → done) is the right architecture. The biggest remaining gap is bulk-select ergonomics (row click still navigates) and discoverability of power features after the first-run hint bar retires.

## What's Working

1. **Status-at-a-glance grouping** — Action / waiting / done with deadline-sorted rows inside each group directly answers "what needs attention today" without a metrics hero row.
2. **Brass attention strip** — Urgent deadlines use accent correctly (time pressure only), with a filter-aware "hidden by filters" note.
3. **Power-user bulk workflow** — Select mode, shift-range, forward-only status guardrails, undo toast, and collapsed-group warnings in the selection bar show real domain thinking.

## Priority Issues

### [P2] Row navigation conflicts with select mode
- **Why it matters:** In select mode, clicking a package row still follows the `Link` to detail. Expeditors batch-updating after a county portal sweep will mis-click into detail and lose selection context.
- **Fix:** In selection mode, make row click toggle selection (or use a single `<button>` row with separate "Open" affordance). Keep checkbox for shift-range semantics.
- **Suggested command:** `/impeccable polish dashboard`

### [P2] Cloud error banner has no recovery action
- **Why it matters:** When sync fails, expeditors see `cloud-banner` text in Shell but no retry — they must refresh or guess.
- **Fix:** Add a "Retry sync" button wired to the store's resubscribe/refetch path; keep `role="alert"`.
- **Suggested command:** `/impeccable harden dashboard`

### [P3] Focused row cannot be opened from keyboard
- **Why it matters:** `j`/`k` moves focus but Enter doesn't open the focused package — breaks keyboard-only flow for Alex.
- **Fix:** On Enter with a focused `[data-pkg-id]`, navigate to detail (unless in select mode, then toggle).
- **Suggested command:** `/impeccable polish dashboard`

### [P3] Attention strip doesn't scale
- **Why it matters:** Many overdue packages stack vertically in the strip with no collapse — reintroduces noise the minimalist layout avoids elsewhere.
- **Fix:** Cap visible items (e.g. 3) with "Show all N urgent" expander.
- **Suggested command:** `/impeccable distill dashboard`

### [P3] Shortcut discoverability fades
- **Why it matters:** Keyboard hints hide permanently after first shortcut use; Jordan never sees `j`/`k` or `?` unless they find the Shortcuts button.
- **Fix:** Keep a muted persistent "Shortcuts" entry in the toolbar; hints bar can still retire.
- **Suggested command:** `/impeccable clarify dashboard`

## Persona Red Flags

**Alex (Power User):** Enter doesn't open focused row. Select mode + row link navigation causes accidental detail jumps during bulk work. No inline status change from the list.

**Jordan (First-Timer):** "Select" button label doesn't explain bulk status until the first-run hint. Mobile filters live behind a "Filters" disclosure — fine, but no inline explanation of status group meanings on first visit.

**Sam (Accessibility):** Strong overall (row `aria-label`, icon+label pills, dialog shortcuts, focus rings). Checkbox uses `onChange={() => {}}` with click-only toggle — works but is non-idiomatic for assistive tech; prefer `onChange` handler.

**Morgan (Permit Expeditor):** Satisfied for morning sweep. Stale-in-review count surfaces in waiting group hint when >14 days — good nudge, easy to miss when waiting group is collapsed.

## Minor Observations

- Waiting group auto-collapses at 5+ items — smart default; stale review hint only shows when expanded or in toggle label.
- `docs` checklist fraction is `aria-hidden` on rows — acceptable since full label is in `aria-label`, but visible text might help sighted scanning.
- Selection bar competes with undo toast at same bottom position if both appear — rare but possible overlap.

## Questions to Consider

- What if select mode turned the entire row into a selection surface, with chevron-only navigation to detail?
- Does the attention strip need to exist when "Action needed" already surfaces the same packages with deadlines?
- What would a signed-out preview of the dashboard look like for trust-building without exposing client data?
