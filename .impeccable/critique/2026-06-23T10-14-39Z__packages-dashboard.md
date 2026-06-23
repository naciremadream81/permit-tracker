---
target: dashboard
total_score: 29
p0_count: 0
p1_count: 2
timestamp: 2026-06-23T10-14-39Z
slug: packages-dashboard
---
## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Status transitions commit instantly with no undo toast or acknowledgement signal |
| 2 | Match System / Real World | 4 | Domain language is accurate throughout — "In County Review," "Day 47," corrections RFI alert |
| 3 | User Control and Freedom | 3 | File removal has undo; status changes do not — asymmetric recovery for unequal-risk actions |
| 4 | Consistency and Standards | 3 | packages.css defines a parallel component vocabulary (pkg-list-icon-btn, pkg-detail-primary-btn) that diverges from ui.css tokens |
| 5 | Error Prevention | 2 | No confirmation before terminal state ("Closed"); file-attach fires immediately with no preview/cancel step |
| 6 | Recognition Rather Than Recall | 2 | Icon-only sidebar requires recall; title attributes invisible on touch; quiet attach affordance hidden until hover |
| 7 | Flexibility and Efficiency | 3 | Keyboard shortcuts exist (?/b/e/Escape); no arrow-key traversal of list panel items; 'n' shortcut undocumented |
| 8 | Aesthetic and Minimalist Design | 3 | Detail meta line is 7+ attributes in a flat dot-separated run with no visual hierarchy |
| 9 | Error Recovery | 3 | Notes save failure not surfaced; otherwise cloud/export/sign-in errors handled well |
| 10 | Help and Documentation | 3 | No filter AND-logic hint; shortcuts dialog missing 'n' for new package; attach affordance undiscoverable on touch |
| **Total** | | **29/40** | **Good — address weak areas before shipping** |

---

## Anti-Patterns Verdict

**Does this look AI-generated?**

**LLM assessment**: No hard fails. Two marginal cases:

1. **Active card accent bar** — `.pkg-card-accent` (packages.css:213) is a 3px `border-left`-equivalent positioned stripe marking the selected list item. It's functionally justified (selection indicator, not decoration) but the pattern itself is the single most AI-reflexive choice in the file. A tab-style highlight, a full left-edge background tint, or a stronger overall card bg swap would read less generic.

2. **Uppercase eyebrow reflex in 3 separate contexts** — `.contractor-role` (ui.css:1232), `.pkg-list-group-band` (packages.css:166), and `.property-facts dt` (ui.css:2205) all reach for `text-transform: uppercase; letter-spacing: 0.04em`. The contexts are legitimately different (section bands vs. data labels vs. role headers) so it doesn't trigger the "eyebrow above every section" ban, but the design reflex is showing. One of these should break the pattern.

Everything else passes: no gradient text, no card grids, no cream background, no hero metrics, no numbered section scaffolding, no glass cards.

**Deterministic scan (Assessment B)**: Exit code 0, empty array — clean across all six markup files. The detector found zero antipatterns: no bounce easing in markup, no gradient text, no absolute-ban patterns. Assessment A found two that require judgment; the detector confirmed no hard mechanical violations.

Note: The `--ease-spring: cubic-bezier(0.175, 0.885, 0.32, 1.275)` overshoot token (globals.css:91) is defined but never referenced in any CSS rule. Zero runtime impact.

**Browser visualization**: Skipped — app requires Firebase auth; the preview preview server serves a sign-in wall at the workspace routes. CLI scan is the primary B signal; it ran clean.

---

## Overall Impression

This is a well-considered product UI that is genuinely close to shipping. The domain language is excellent, the information architecture is correct for the workflow, and the corrections-status alert is the kind of specific, professional copy that separates deliberate product work from scaffolded output. The two weaknesses that matter before pushing: **status changes are a one-way door with no undo** (the same thoughtfulness applied to file deletion was not applied here), and **`--faint` fails WCAG AA in dark mode** (a concrete contrast defect, not a judgment call). Fix those two and this is ready.

---

## What's Working

**1. The group band architecture is domain-correct.**
"Action Required / In County Review / Approved & Closed" maps to how expeditors actually hold their portfolio in their head — not by status name, but by whose court the ball is in. Sorting within Action Required by deadline urgency (overdue → soon → dated → undated) is exactly right. This isn't a generic status list; it's an opinionated read of the work.

**2. The corrections alert is production-quality.**
`pkg-detail-rfi-alert` with specific instruction text ("review the checklist below and resubmit with updated documents"), correct semantic role, direct call to action. Calm but unmistakable. Most apps at this stage ship a generic "please review" banner.

**3. The file undo pattern is more considered than most production apps.**
8-second window, toast names the specific file, `keepBlob: true` for instant restore without re-fetch. This level of thought about destructive action recovery — applied consistently — would make the whole app feel professional. It isn't consistent yet (see P1 below).

---

## Priority Issues

**[P1] Status transitions are irreversible with no acknowledgement**
- **What**: Clicking "Mark Submitted" or "Mark In Review" commits immediately — no undo toast, no confirming pulse, no 5-second recovery window. File removal has undo; status changes (higher stakes) do not.
- **Why it matters**: An expeditor who mis-clicks "Mark Approved" on the wrong package has to deliberately open the "Change…" picker to recover. Careful users will hesitate before every status click, which defeats the "act on it without digging" goal. The asymmetry between file undo (8 seconds) and status change (zero) creates distrust.
- **Fix**: Add a status-change undo toast identical in structure to the file removal toast. "Status updated to Submitted — Undo" with a 5-second window. The undo handler calls the previous status value from a captured `prevStatus` ref.
- **Suggested command**: `/impeccable harden`

**[P1] `--faint` fails WCAG AA contrast in dark mode**
- **What**: `--faint: #71717a` (zinc-500) is not overridden in `[data-theme="dark"]`. Against `--bg: #18181b` (zinc-950), the computed contrast ratio is ~4.3:1 — below the 4.5:1 WCAG AA threshold for normal text. Affects `.pkg-card-city`, `.pkg-detail-meta-sep`, group band text, and several other contexts in dark mode.
- **Why it matters**: Dark mode is a real usage context, not a vanity toggle. Failing WCAG AA for a text color that appears on every card in the portfolio view is a concrete accessibility defect.
- **Fix**: In the `[data-theme="dark"]` block in globals.css, add `--faint: #9ca3af` (or `#a1a1aa` — which already passes at ~6.4:1 against `#18181b`). The current dark mode `--muted: #a1a1aa` already achieves this; consider whether `--faint` and `--muted` should be collapsed in dark mode.
- **Suggested command**: `/impeccable audit`

**[P2] Hardcoded `rgba(228, 228, 231, 0.6)` in packages.css bypasses the token system**
- **What**: packages.css line ~282 (`.pkg-card-bottom` border-top) uses a hardcoded RGBA that matches `--border` in light mode but does not update in dark mode. The card-bottom separator will appear much lighter than intended in dark mode.
- **Why it matters**: Dark mode consistency. This slipped through the CSS variable conversion pass; it's isolated but visible on every card.
- **Fix**: Replace with `border-top: 1px solid var(--border)`. The transparency adds nothing when the card background is always `var(--bg)`.
- **Suggested command**: `/impeccable polish`

**[P2] Detail meta line is a flat wall — urgency is buried**
- **What**: The metadata paragraph at packages/[id]/page.tsx concatenates county, permit type, reference number, client name, opened date, and deadline all at equal visual weight in a single dot-separated run. On any package with a real deadline, the overdue/soon signal is the most important fact in the header — but it sits at the end of a wrapping paragraph styled identically to "Lee County."
- **Why it matters**: "Status at a glance" is the #1 design principle. The most urgent piece of data is the hardest to find in the component responsible for it.
- **Fix**: Pull deadline out of the meta run and place it in the header actions row next to the status pill when it's overdue or soon (reuse the `.deadline-overdue`/`.deadline-soon` classes that already exist in ui.css). The remaining meta line (county · type · reference · client · opened) is stable enough to stay flat.
- **Suggested command**: `/impeccable layout`

**[P3] Sidebar icon-only — no labeled state, no touch tooltip fallback**
- **What**: The 64px sidebar has four unlabeled icons. `title` attributes provide hover tooltips on desktop but are invisible on touch devices. The Compass icon (brand/home) requires the most recall — it is not a standard "home" icon in product UI contexts.
- **Why it matters**: Daily-use muscle memory covers this for returning users. The gap is onboarding: a new expeditor's first session has zero label affordance. On iPad (a realistic field-use device), no tooltips render.
- **Fix**: CSS tooltip via `data-label` + `::after` on `.sidebar-link` triggered by `:hover` and `:focus-visible`. Stays within the 64px constraint; no DOM changes; works on keyboard focus; does not help touch (but that's acceptable for a sidebar at this size).
- **Suggested command**: `/impeccable onboard`

---

## Persona Red Flags

**Alex (Power User — the primary Meridian persona):**
Daily-use permit expeditor managing 40+ packages. Opens app, sweeps the list, clicks through corrections, marks statuses.
- No arrow-key traversal of the list panel. Moving between packages requires clicking — on a portfolio of 40, this adds up. Expected: `↓/↑` to navigate cards, `Enter` to open.
- The `'n'` shortcut for new package is discoverable only via the button's `title` attribute, not the shortcuts dialog (the `?` help panel). Alex will use `n` once they know it, but there's no path to discover it.
- Status-change recovery requires deliberate action (open Change… picker) rather than the 5-second undo window Alex would use reflexively.

**Sam (Accessibility-Dependent User):**
Screen reader + keyboard-only navigation.
- `--faint` fails WCAG AA in dark mode (concrete contrast defect, see P1).
- The `role="navigation"` on `.pkg-list-body` (PackagesListPanel.tsx) is incorrect — this is a scrollable list of links inside `<main>`, not a navigation landmark. Using `<nav>` or `role="navigation"` here creates a redundant navigation landmark that will be announced by VoiceOver as a second nav region alongside the sidebar.
- The "Share" button in the detail header has no implementation. For a keyboard user who focuses it expecting an action, receiving no feedback is an H1 violation.
- The search input in the list panel changes `border-color` on focus instead of using the global `outline: 2px solid var(--ink)` pattern — inconsistent focus indicator for keyboard users.

**Marco (Professional Permit Expeditor — project-specific):**
*Profile*: Works 8–12 active packages simultaneously across Lee, Collier, and Charlotte counties. Uses the app every morning for ~20 minutes, then dips back in throughout the day when portals send email updates. Fast but methodical; no patience for ambiguity but reads carefully.
- The meta line's buried deadline means Marco has to stop and scan to find what's time-sensitive about a package instead of seeing it immediately.
- A resubmitted package ("In County Review" band) looks identical to an initially submitted one. Marco needs to distinguish "waiting after corrections" from "waiting after first submission" — they have different urgency and different likely timelines.
- Notes and checklist share a tab, creating a mode switch that doesn't match Marco's workflow (checklist is a task-completion surface; notes are a running log of calls and portal updates — different mental modes).

---

## Minor Observations

- `pkg-list-search:focus` sets `border-color: var(--border-strong)` instead of the global `:focus-visible` outline pattern. Inconsistent focus affordance between the search input and all other inputs in the app.
- Two skeleton animation patterns: `pkg-skeleton-pulse` (opacity pulse) in packages.css and `shimmer` (gradient scan) in ui.css. Both exist in the same session of loading; pick one and standardize.
- The "Share" button in the detail header (`pkg-detail-share-btn`) has no implementation and fires no action. Placeholder UI with no feedback is worse than hiding the button until the feature exists.
- `pkg-list-icon-btn`, `sidebar-icon-btn`, and `icon-btn` are three implementations of the same 32–40px icon button pattern. A single `IconButton` component with a `size` prop would eliminate this.
- The Cabinet Grotesk fallback in packages.css line 38 is `sans-serif` instead of the full stack defined in globals.css (`'Cabinet Grotesk', 'Plus Jakarta Sans', system-ui, sans-serif`).

---

## Questions to Consider

1. **Does the status change need to feel reversible, or does it need to feel confirmed?** A toast with undo is one solution; an "Are you sure?" confirmation before terminal states ("Closed," "Approved") is another. The two approaches communicate different things about the app's confidence in the user. Which fits the product's "calm confidence" character better?

2. **Why do checklist items and notes share a tab?** Notes are a running log (temporal, additive); checklist items are tasks with binary completion states. Putting them on the same tab forces a mode switch where a separate "Notes" area in the sidebar detail — always visible — might serve the workflow better. Does the tab separation earn its cost in cognitive switching?

3. **Has the 380px list panel been tested at 13" laptop width?** At 1366px usable (minus 64px sidebar), the split is 380px list + 922px detail. That 922px for the detail is fine for most content, but the property card's `.property-facts` grid and the `.detail-grid` (3fr/2fr) nested inside it may compete for horizontal space uncomfortably. What's the minimum viewport width where this layout still works?

---

**Trend for `packages-dashboard` (last 5 runs): first run for this target.**
