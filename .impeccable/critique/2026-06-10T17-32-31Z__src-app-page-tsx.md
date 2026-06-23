---
target: dashboard
total_score: 32
p0_count: 0
p1_count: 1
p2_count: 4
timestamp: 2026-06-10T17-32-31Z
slug: src-app-page-tsx
---
# Design Critique: Dashboard — `src/app/page.tsx`

## Design Health Score (32/40 — Good)

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 4 | Skeleton list, dynamic subtitle counts, grouped sections with counts, deadline urgency on rows |
| 2 | Match System / Real World | 4 | Expeditor vocabulary (corrections, county, checklist docs); grouping matches mental model |
| 3 | User Control and Freedom | 3 | Clear filters + Clear button; detail page gained status recovery & attachment undo (not on dashboard itself) |
| 4 | Consistency and Standards | 3 | Meridian tokens honored; mobile nav icon-collapse diverges from labeled desktop pattern |
| 5 | Error Prevention | 3 | Search/filter reduce mis-clicks at scale; status mis-clicks still possible on detail (no confirm on forward moves) |
| 6 | Recognition Rather Than Recall | 3 | `/` hinted in placeholder; mobile nav becomes icon-only at ≤480px without visible tooltips |
| 7 | Flexibility and Efficiency | 3 | Search, type/county filters, `/` focus shortcut — no status filter, bulk actions, or `n` for new package |
| 8 | Aesthetic and Minimalist Design | 4 | List-led portfolio, hairline structure, brass attention strip earns its place |
| 9 | Error Recovery | 3 | Strong empty/filter states; package-level mistakes recovered only on detail view |
| 10 | Help and Documentation | 2 | First-run empty state teaches well; no contextual help for shortcuts beyond search placeholder |

## Anti-Patterns Verdict

**LLM assessment:** This does not read as AI slop. The dashboard deliberately avoids the generic SaaS template (no sidebar, no metric-card grid, no gradient hero). Meridian's "ship's chronometer" system shows up in list rows, brass deadline strip, and status pills with icon + label. It feels like a purpose-built expeditor tool, not a boilerplate admin shell.

**Deterministic scan:** Clean — `detect.mjs` over `src/` returned zero findings (prior progress-bar `width` transition issue appears resolved).

**Browser visualization:** Not available — no browser automation in this environment. Live page verified via HTTP on `localhost:3001` (SSR shell + client hydration). No reliable user-visible detect overlay.

## Overall Impression

The dashboard is in solid shape and materially improved since the last critique. It answers "what needs attention?" quickly via the Action needed group, brass attention strip, and deadline-sorted rows. The biggest remaining gap is **scale behavior** — as the portfolio grows, history and filters need sharper affordances so urgency doesn't get buried below the fold.

## What's Working

1. **Action-first information architecture** — Three groups (Action needed / With the county / Approved & closed) with human hints ("The ball is in your court") map directly to expeditor workflow. The subtitle line ("N need your attention") reinforces the primary question without a dashboard cliché metric row.

2. **List rows over card grids** — Package rows pack client, status pill, reference, type, county, deadline, and doc progress into one scannable line. This matches DESIGN.md's list-led mandate and keeps cognitive load low compared to repeated cards.

3. **Brass attention strip** — Urgent deadlines get a dedicated, correctly scoped use of the brass accent (deadline-only rule). It surfaces the same data as rows but gives morning triage a single focal point.

## Priority Issues

### [P1] Icon-only mobile nav forces visual recall
- **What:** Below 480px, `.topnav-label` is visually hidden (sr-only). Users see three icons with no on-screen text or `title` tooltips.
- **Why it matters:** Jordan (first-timer) and infrequent users must memorize which icon is Packages vs Contractors vs Checklists. Screen readers are fine; sighted mobile users are not.
- **Fix:** Keep one-word abbreviated labels ("Pkgs", "Subs", "Lists"), add `title` attributes on links, or move primary nav to a bottom bar with labels.
- **Suggested command:** `/impeccable adapt dashboard nav`

### [P2] No status filter on the portfolio toolbar
- **What:** Toolbar filters permit type and county only. There is no way to see "all packages in corrections" across clients.
- **Why it matters:** Expeditors often triage by status, not geography. Alex at 30+ packages will scroll the Action group or run ambiguous text searches.
- **Fix:** Add a status `<select>` or chip filter (multi-select optional) aligned with `STATUS_LABELS`.
- **Suggested command:** `/impeccable craft portfolio status filter`

### [P2] Attention strip disappears while filtering
- **What:** `{!filtering && urgent.length > 0 && (...)}` hides the brass strip whenever any filter or search is active.
- **Why it matters:** Searching for a client name can hide overdue deadlines for other packages — exactly when cross-referencing, users still need time pressure visible.
- **Fix:** Always show urgent strip for portfolio-wide deadlines, or show a compact "N urgent outside this filter" banner when filtered results omit them.
- **Suggested command:** `/impeccable layout dashboard attention strip`

### [P2] "Approved & closed" group will dominate scroll
- **What:** Completed packages render in a full third section with no collapse, cap, or "show more."
- **Why it matters:** As history accumulates, active work sinks below a growing archive — undermining "status at a glance."
- **Fix:** Collapse `done` by default (show count + expand), or paginate after ~5 rows with "Show all closed."
- **Suggested command:** `/impeccable distill dashboard groups`

### [P2] Power-user gaps remain after search ship
- **What:** `/` focuses search (good), but no keyboard path to New package, no row arrow-key navigation, no bulk status updates.
- **Why it matters:** Alex's core loop (scan → open → update → next) still requires mouse for several steps.
- **Fix:** Add `n` for new package panel, optional `j`/`k` row focus, defer bulk to a later pass.
- **Suggested command:** `/impeccable harden dashboard keyboard`

## Persona Red Flags

**Alex (Power User):** `/` search is a real win. Still no `n` shortcut for New package, no status filter, no multi-select/bulk "mark submitted." Row-to-row navigation requires tabbing through entire link text.

**Sam (Accessibility):** Status pills correctly pair icon + label + color. Coarse-pointer media query bumps icon buttons to 44px — good. Package row links lack a concise `aria-label` summary (screen reader gets full row text, which is long but acceptable). Mobile nav keeps sr-only labels — accessible but easy to miss in visual testing.

**Morgan (Permit Expeditor — project persona):** Morning triage works when Action needed is short. With many "With the county" packages, that middle group becomes a long scroll between urgency and history — consider collapsing waiting or surfacing "stale in review >14 days."

## Minor Observations

- `meta-pair` separator dots can orphan at narrow widths despite `nowrap` — cosmetic.
- Chevron uses `--faint`; hidden on mobile anyway.
- Filter-empty state is well-written; Clear button appears when filtering — good.
- `New package` moves below title on mobile (`page-head` column) — acceptable but not thumb-optimal.

## Questions to Consider

- What does this screen look like with 8 urgent, 12 waiting, and 40 closed — does Morgan still answer "what needs attention today" in under 5 seconds?
- Should overdue packages sort above merely "due soon" within Action needed, not just by date?
- When cloud mode adds multiple expeditors, does the portfolio need an "assigned to me" filter?
