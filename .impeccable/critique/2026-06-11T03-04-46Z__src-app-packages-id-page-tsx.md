---
target: package detail
total_score: 33
p0_count: 0
p1_count: 1
timestamp: 2026-06-11T03-04-46Z
slug: src-app-packages-id-page-tsx
---
# Design Critique: Package detail (/packages/[id]) — product register

## Score: 33/40 (Good)
H1 4 · H2 4 · H3 4 · H4 4 · H5 3 · H6 3 · H7 3 · H8 3 · H9 3 · H10 2

## Verdict
Clean (0 CLI findings; browser hits in ignore.md). Distinctive, not slop.

## Priority Issues
- [P1] Horizontal scroll at 360px: checklist card-head (title + meta + nowrap Export button) forces ~362px min-content; stacked grid column can't shrink (min-width:auto). Fix: .detail-grid > * { min-width: 0 } + flex-wrap on .card-head or shorter export label on small screens. (/impeccable adapt)
- [P2] "Change status…" select applies instantly on change; keyboard arrow-browsing can commit accidentally. Add small Apply or menu pattern.
- [P3] Twelve identical dashed Attach chips add repetition; consider hover/focus-within reveal on desktop, always-visible on touch.

## Personas
Sam: ARIA solid. Riley: invalid dates, zip dedupe, storage-full all handled. Casey: the P1 scroll is the one failure; touch targets good.
