---
target: package detail
total_score: 39
p0_count: 0
p1_count: 0
timestamp: 2026-06-12T20-10-25Z
slug: src-app-packages-id-page-tsx
---
# Design Critique: Package detail (`/packages/[id]`)

## Design Health Score (39/40 — Excellent)

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 4 | Progress bar, export feedback, attachment undo, notes "Saved", skeleton |
| 2 | Match System / Real World | 4 | Checklist, status moves, property roll, activity log fit expeditor workflow |
| 3 | User Control and Freedom | 4 | Back link, status Apply/Cancel, removal undo, parcel remove confirm |
| 4 | Consistency and Standards | 4 | Meridian cards, pills, file chips match dashboard vocabulary |
| 5 | Error Prevention | 4 | Staged status change, export disabled when empty, confirm before parcel/sub remove |
| 6 | Recognition Rather Than Recall | 4 | Sub-actions visible on touch/coarse; quiet attach scoped to fine-pointer hover only |
| 7 | Flexibility and Efficiency of Use | 3 | Forward status buttons are fast; no detail-level keyboard shortcuts like dashboard |
| 8 | Aesthetic and Minimalist Design | 4 | Checklist-led main column; side stack for context; density earned |
| 9 | Error Recovery | 4 | Undo attachment removal; export retry messaging; property lookup errors |
| 10 | Help and Documentation | 4 | Property empty state teaches lookup; activity empty state guides first log |
| **Total** | | **39/40** | **Excellent — ship-ready; polish-only gaps remain** |

## Anti-Patterns Verdict

**LLM assessment:** Not AI slop. Purpose-built permit detail surface — checklist-first main column, contextual side stack, Meridian steel/brass tokens. Prior P2/P3 items from the last critique (sub-actions on touch, notes saved, activity empty state, export label shorten) are implemented in code.

**Deterministic scan:** `detect.mjs` returned **0 findings** on `page.tsx`, `PropertyCard.tsx`, and `ContractorsCard.tsx`.

**Browser visualization:** Dev server at `:3001` returns **500** on `/packages/pkg-001` (stale `.next` chunk `MODULE_NOT_FOUND` after production build — environment, not design). No reliable live overlay this run. Code review + CLI scan carry the assessment.

## Overall Impression

The detail page is in strong shape for daily expeditor work. The polish pass closed the gaps that were keeping recognition and help scores below 4. What remains is optional power-user and mobile-density refinement — nothing that blocks task completion.

## What's Working

1. **Staged status change** — Forward "Mark …" buttons plus Apply/Cancel on the full picker prevent accidental commits while keeping common moves one click.
2. **Checklist + attachments** — Progress bar, fine-pointer-only quiet attach chips, undo on removal, export with missing-doc heads-up, responsive "Export" label.
3. **Feedback loops** — Notes "Saved" status after debounce/blur; activity empty state when the timeline is blank; sub-actions always visible on touch.

## Priority Issues

### [P3] No keyboard shortcuts on detail
- **Why it matters:** Dashboard exposes a rich shortcut vocabulary (`?`, `/`, bulk mode); detail relies on mouse/tab only. Alex loses flow when drilling in and out of packages.
- **Fix:** Add minimal detail shortcuts — e.g. `b` back to portfolio, `e` focus export when enabled — mirroring dashboard patterns.
- **Suggested command:** `/impeccable polish package detail`

### [P3] Status action row stacks on narrow viewports
- **Why it matters:** Packages with multiple forward statuses render 2–3 full-width "Mark …" buttons above the fold on mobile before the checklist.
- **Fix:** At ≤640px collapse forward moves into a single "Update status" control or compact menu; keep Apply/Cancel on the full picker.
- **Suggested command:** `/impeccable adapt package detail`

### [P3] Notes lack in-progress save state
- **Why it matters:** "Saved" appears after flush, but the 600ms debounce window gives no "Saving…" cue — Riley may navigate away mid-debounce thinking nothing happened.
- **Fix:** Show muted "Saving…" in the card head while `notesDraft !== null && notesTimer` is active; swap to "Saved" on commit.
- **Suggested command:** `/impeccable polish package detail`

## Persona Red Flags

**Alex (Power User):** Forward status buttons are efficient, but no `b` / `e` shortcuts on detail breaks parity with the portfolio page rhythm.

**Jordan (First-Timer):** Activity empty state now guides first entry. Property lookup empty state still does the heavy lifting for unfamiliar users — no new red flags.

**Sam (Accessibility):** Solid ARIA on checklist, progressbar, status group, notes/activity status regions. Sub-actions touch visibility fix resolves the prior main gap.

**Riley (Stress Tester):** Export/attach/removal undo paths remain robust. Notes debounce without "Saving…" is the only ambiguous window.

**Casey (Mobile):** Export label shortens correctly; sub-actions visible on touch. Status button sprawl is the main mobile friction.

## Minor Observations

- Main contractor edit icon is always visible; subcontractor edit/delete still fade on desktop-only hover — intentional but slightly inconsistent.
- Dev server 500 after `next build` without restart — delete `.next` or restart dev before visual QA.
- Activity submit remains icon-only Plus with `aria-label` — acceptable for space.

## Questions to Consider

- Should detail inherit the dashboard shortcuts dialog (`?`) with a detail-specific section?
- Is a mobile status menu worth the extra tap vs. visible forward buttons for this audience?
- Does "Saving…" add noise for expeditors who trust blur-to-save, or is it reassurance worth showing?
