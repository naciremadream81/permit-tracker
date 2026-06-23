---
target: landing
total_score: 30
p0_count: 0
p1_count: 1
timestamp: 2026-06-11T03-04-45Z
slug: src-app-page-tsx
---
# Design Critique: Landing page (/) — brand register
NOTE: this slug previously held the dashboard (28/40) before the dashboard moved to /packages; this entry begins the landing page's own series.

## Score: 30/40 (Good)
H1 3 · H2 4 · H3 3 · H4 4 · H5 3 · H6 3 · H7 3 · H8 3 · H9 2 · H10 2

## Verdict
Bans clean (0 CLI findings; single-font in ignore.md). Brand-register tension: defensibly calm/on-voice but fails the inverse test — the committed version would drench the hero and use real product imagery.

## Priority Issues
- [P1] Mobile hero order: CSS preview panel renders above the headline at 360px; copy must lead. Fix: order swap. (/impeccable adapt)
- [P2] Header/close CTAs call signIn() without catch — blocked popup fails silently. Reuse hero CTA error handling. (/impeccable harden)
- [P2] Only imagery is a CSS mock panel; a real screenshot or committed hero scene would carry more trust. (/impeccable bolder)
- [P3] "Florida counties" section is filler-thin; give it weight or merge.

## Personas
Jordan passes; Casey hits the hero-order issue; Riley: dark mode + CTA auth-adaptation work.
