---
target: permit details
total_score: 32
p0_count: 0
p1_count: 2
timestamp: 2026-06-23T10-40-31Z
slug: src-app-packages-id-page-tsx
---
## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Undo toast + progress bar are excellent; notes "Saving…" feedback is tiny gray text that reads as decorative |
| 2 | Match System / Real World | 4 | "Mark in review", county names, permit types — fluent domain language throughout |
| 3 | User Control and Freedom | 3 | 8-second undo for both status and file removal; breadcrumb back; no dedicated ← button |
| 4 | Consistency and Standards | 3 | Button styles coherent; tab underline focus ring diverges slightly from global :focus-visible outline |
| 5 | Error Prevention | 3 | Undo is reactive, not preventive — no confirmation before marking Approved or Closed |
| 6 | Recognition Rather Than Recall | 3 | Most actions labeled; keyboard shortcuts discoverable only through the ? dialog |
| 7 | Flexibility and Efficiency | 4 | b/e/?/n shortcuts, quick-action status buttons, "Change…" picker, checklist keyboard — strong for power users |
| 8 | Aesthetic and Minimalist Design | 3 | Clean overall; header row crowds at split-panel effective widths (~640px right column) |
| 9 | Error Recovery | 3 | Undo toast is excellent; export error only reports count of missing items, not names |
| 10 | Help and Documentation | 3 | Shortcuts dialog discoverable; no inline contextual hints for status transitions or deadline semantics |
| **Total** | | **32/40** | **Good — solid foundation, focused improvements needed** |

## Anti-Patterns Verdict

**LLM assessment:** No meaningful AI tells. The permit detail page sidesteps the common slop patterns — no side-stripe borders on the RFI alert (full border + background tint instead), no gradient text, no hero-metric template, no numbered section markers. The status action affordance (show 2 most-likely next moves, hide the rest behind "Change…") is a genuine design decision, not a reflex. Cabinet Grotesk + Inter + JetBrains Mono gives the page a distinct instrument quality. The document checklist table leans somewhat generic (three-column SaaS table), but it's the correct information shape for this content.

**Deterministic scan:** Zero findings across all three scanned files. No gradient text, no layout-thrashing transitions (background/color only), no bounce easing, no bad border accents. Pre-excluded rules (single-font, flat-type-hierarchy) correctly ignored per ignore.md.

## Overall Impression

Well-composed, task-focused interface that earns its complexity. The tabbed structure is right. The new status change undo toast materially reduces fear of mis-clicks. Biggest opportunities: header reflows badly at split-panel widths, and notes are buried where they'll be ignored by every user until they've already lost context.

## What's Working

1. **Status quick-action intelligence.** Showing the 2 most-likely next transitions as primary buttons, then "Change…" for everything else. Users rarely need the full state graph; the two-button shortcut covers 90% of cases.

2. **Undo toast pattern, both surfaces.** File removal AND status changes surface the 8-second undo. Fixed position, high contrast, disappears silently if ignored. Removes the cognitive cost of hesitation.

3. **Tabbed progressive disclosure.** Defaulting to Document Checklist, with Timeline & Contractors one click away, keeps first-scroll density low. Domain knowledge maps naturally to the tab structure.

## Priority Issues

**[P1] Header row reflows badly at split-panel effective widths**
- What: The detail panel is flex: 1. At 1024-1150px total viewport, the right column is ~640-720px. The header-row flex layout combines an H1 address with a header-actions group (deadline + 2 status buttons + "Change…"). Without flex-wrap, elements squish or clip the H1.
- Why: Laptop users at 1024-1280px see a truncated property address — which is the package's primary identity. A clipped "1234 Gulf Coast..." is a P1 failure for an address-centric tracking tool.
- Fix: Add flex-wrap: wrap to .pkg-detail-header-row. Give .pkg-detail-h1 min-width: 0 and overflow-wrap: break-word. Add @media for <720px effective panel width that stacks actions below title.
- Suggested command: /impeccable adapt

**[P1] Notes section is below the fold, saving feedback is invisible**
- What: Notes textarea sits after the progress bar and full document table. On packages with 8+ checklist items, requires scrolling. "Saving…" / "Saved" renders as 12px gray text — visually indistinguishable from section label.
- Why: Notes are institutional memory — reviewer names, portal quirks, resubmission instructions. If invisible, they don't get filled in. Knowledge stays in email, not the tool.
- Fix: Make Notes a collapsible sticky footer within the checklist tab, or move it to a dedicated Notes tab. Replace "Saving…" feedback with undo-toast-level visual language.
- Suggested command: /impeccable layout

**[P2] No pre-action confirmation for terminal status states (Approved, Closed)**
- What: "Mark approved" immediately calls requestStatusChange with an 8-second undo window. In a 30-package morning sweep, a mis-click on package #14 may not be noticed until package #22.
- Why: Approved and Closed are terminal states that affect billing and audit trails. Accidental approval is a real workflow hazard.
- Fix: For approved and closed transitions specifically, show a native <dialog> confirm: "Mark this package approved? This moves it to the Approved & Closed group." Adds ~300ms friction on a rare, high-cost path.
- Suggested command: /impeccable harden

**[P2] Status pills convey meaning partly via color without backup semantic label**
- What: Validated / Done / Attached / Missing pills use background tint + color. Screen readers hear "Validated" but the green tint encoding is visual-only. WCAG 1.4.1 violation.
- Why: Color not sole means of conveying information is a compliance requirement.
- Fix: Add aria-label to each pill encoding the full state meaning. Or add a small icon inside each pill.
- Suggested command: /impeccable audit

**[P3] Export error names count but not specific missing items**
- What: "2 items have no documents attached" without naming them. User must re-scan a 15-row checklist.
- Fix: Render item names inline: "Proof of Insurance, Structural Calculations have no documents attached." The result.missing array from exportSubmittalZip already contains this data.
- Suggested command: /impeccable clarify

## Persona Red Flags

**Alex (Power User):** `e` focuses export but doesn't fire it — mouse required to click. No keyboard shortcut for status picker (no `s`), no `1/2/3` for tab switching, no "skip to first missing item" shortcut. Every mouse gap in the keyboard path costs time across 30+ packages.

**Sam (Accessibility-dependent):** File removal buttons are 18×18px, below the WCAG 2.5.5 target size floor. Progress bar aria-label says "Checklist completion" but not "X of Y items" — requires calculation. shortcuts dialog missing aria-modal="true" for VoiceOver focus trapping.

**Morgan (Domain Expert — permit expeditor):** Checklist has no "county-flagged" item state — RFI corrections must be cross-referenced from email. No click-to-call tel: link on contractor phone numbers. Notes section is single freeform textarea; 6-month permit history becomes unstructured wall of text.

## Minor Observations

- Progress bar scaleX fires on each checkbox toggle; rapid checking produces 5-6 small jumps instead of one smooth fill.
- Contractors tab has no preview in header/meta line — assigned contractor is invisible unless user clicks away from Checklist tab.
- Activity timeline has no "jump to today" affordance for packages with 6+ months of history.
- pkg-detail-h1 letter-spacing: -0.035em at 800 weight — within spec but worth a browser check at actual Cabinet Grotesk rendering.
- shortcuts dialog lacks aria-modal="true" needed for VoiceOver + Safari focus trapping.
