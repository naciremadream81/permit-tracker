---
target: dashboard
total_score: 35
p0_count: 0
p1_count: 0
timestamp: 2026-06-11T00-14-46Z
slug: src-app-packages-page-tsx
---
# Design Critique: Dashboard (/packages) — re-run after fixes + feature growth

Surface moved from src/app/page.tsx (now the landing page) to src/app/packages/page.tsx. Prior baseline under slug src-app-page-tsx: 28/40 with 4 P1s — all addressed.

## Design Health Score (35/40 — Good, near Excellent)
H1 4 · H2 4 · H3 4 · H4 3 · H5 4 · H6 3 · H7 4 · H8 3 · H9 3 · H10 3

## Anti-Patterns Verdict
Clean CLI scan (0 findings; prior width-transition fixed). Browser detector: single-font + flat-type-hierarchy — false positives for product register (DESIGN.md doctrine). Consider ignore.md entries.

## Priority Issues
- [P2] Keyboard hint bar renders on touch viewports (360px) and duplicates the ? shortcuts dialog. Fix: hide under pointer:coarse / <640px.
- [P2] Mobile nav vocabulary drift: "Pkgs / Contr. / Lists" — "Lists" ≠ "Checklists", "Contr." ambiguous. Fix: icon-only with accessible labels, or full labels.
- [P3] Hint bar is the noisiest desktop element; consider show-until-first-use.

## Verified working
Bulk select (incl. shift-range), mixed-status guard with explanation, bulk apply + undo (snapshot restore confirmed in browser), Escape ladder, composed aria-labels, debounced live region, collapsed groups with counts.

## Personas
- Alex: keyboard story nearly complete; missing act-on-focused-row key.
- Sam: strong; verify dialog focus return.
- Casey: hint-bar noise; otherwise solid at 360px.

## Questions
- Enter + status key on focused row to finish the keyboard story?
- Surface stale-in-review count more prominently?
