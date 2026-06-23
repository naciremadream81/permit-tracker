---
target: dashboard
total_score: 37
p0_count: 0
p1_count: 0
p2_count: 2
p3_count: 2
timestamp: 2026-06-10T20-45-21Z
slug: src-app-page-tsx
---
# Design Critique: Dashboard — `src/app/page.tsx`

## Design Health Score (37/40 — Excellent)

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 4 | Selection bar, undo toast, debounced live region, stale-in-review hints |
| 2 | Match System / Real World | 4 | Expeditor grouping, forward-only bulk, permit vocabulary |
| 3 | User Control and Freedom | 4 | Bulk undo, Esc ladder, clear filters/selection, collapsible groups |
| 4 | Consistency and Standards | 4 | Meridian tokens; detail + dashboard share `NEXT_STATUSES` |
| 5 | Error Prevention | 4 | Mixed-status bulk blocked with actionable copy |
| 6 | Recognition Rather Than Recall | 4 | Visible kbd hints, Select toggle, blocked-state guidance |
| 7 | Flexibility and Efficiency | 4 | Search, filters, bulk bar, j/k/x shortcuts |
| 8 | Aesthetic and Minimalist Design | 4 | List-led; checkboxes only in selection mode |
| 9 | Error Recovery | 4 | Filter-empty states, bulk undo, invalid-date fallbacks |
| 10 | Help and Documentation | 3 | No first-run hint for Select/bulk; no `?` shortcuts popover |

## Anti-Patterns Verdict

**Not AI slop.** Purpose-built expeditor instrument — action groups, brass urgency strip, status pills with icon+label.

**Detector:** Clean (0 findings on `page.tsx`).

**Browser overlays:** Unavailable in this run (no browser automation); assessment from source + user confirmation that bulk works.

## Overall Impression

The dashboard has crossed from "good portfolio view" to "power-user ready." Bulk status updates closed the biggest efficiency gap. Remaining work is polish at the margins: toolbar density, collapsed-group bulk friction, and first-run discoverability of Select mode.

## What's Working

1. **Bulk workflow is disciplined** — forward-only intersection, blocked mixed-status copy, undo toast, select-all-visible on filtered sets.
2. **Scale without noise** — collapsible Waiting/Done, overdue-first sort, attention strip with filter-hidden recovery.
3. **Keyboard layer is real** — `/` `n` `j`/`k` `x`/`Space` in select mode, Esc clears selection before filters.

## Priority Issues

**[P2] Collapsed groups block bulk selection**
- **Why:** Packages in collapsed Waiting or Done groups are not listed; expeditors must expand before bulk-updating archived or county-held items.
- **Fix:** When entering Select mode with collapsed groups containing items, offer "Include N hidden in {group}" or auto-expand groups that have selections pending.
- **Suggested command:** `/impeccable polish dashboard`

**[P2] Toolbar decision density**
- **Why:** Four filter dropdowns + Clear + Select compete for attention; new users may not find bulk affordance at the far right.
- **Fix:** Group filters under one "Filters" control on smaller breakpoints, or move Select left of filters with a short label tooltip on first visit.
- **Suggested command:** `/impeccable layout dashboard`

**[P3] No range select for power users**
- **Why:** Alex selecting 12 consecutive `submitted` rows must click each checkbox.
- **Fix:** Shift+click range select within a group list.
- **Suggested command:** `/impeccable harden dashboard`

**[P3] Space shortcut undocumented in visible hints**
- **Why:** `x` appears in keyboard-hints when selecting; `Space` works but is only in sr-only copy.
- **Fix:** Add `<kbd>Space</kbd>` beside `x` in selection mode hints.
- **Suggested command:** `/impeccable clarify dashboard`

## Persona Red Flags

**Alex (Power User):** Bulk apply + undo satisfies the morning sweep. Missing shift-click range select and no way to bulk-update collapsed Waiting rows without expanding first.

**Sam (Accessibility):** Checkbox labels include client + status; selection bar is `role="toolbar"`. Undo toast is time-limited (8s) with no extension — low risk but worth noting for motor users.

**Jordan (First-Timer):** Select is a ghost button at the toolbar end; Done vs bar Clear serve different purposes but look similar. No inline "new: batch status updates" hint on first Select.

## Minor Observations

- Apply is immediate (undo is the safety net) — correct per brief; some users may want a one-line confirm for N > 10.
- Selection bar and undo toast share bottom placement — sequential, never overlapping.
- `Select all visible` respects collapsed groups (only expanded rows) — consistent but surprising without copy.

## Questions to Consider

- Should Select mode auto-expand collapsed groups that match the active status filter?
- Would a filter chip row replace four dropdowns with less cognitive load?
- At what portfolio size does a "Today's changes" digest beat scrolling groups?
