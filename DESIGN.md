---
name: Meridian — Permit Package Tracker
description: A precise instrument for tracking Florida permit packages — calm steel-blue, brass attention signals, pure white surface.
colors:
  bg: "oklch(1 0 0)"
  surface: "oklch(0.972 0.004 220)"
  surface-2: "oklch(0.945 0.006 220)"
  ink: "oklch(0.235 0.018 230)"
  muted: "oklch(0.47 0.022 225)"
  faint: "oklch(0.60 0.018 225)"
  border: "oklch(0.885 0.008 220)"
  border-strong: "oklch(0.80 0.012 220)"
  primary: "oklch(0.55 0.091 210)"
  primary-hover: "oklch(0.49 0.095 210)"
  primary-soft: "oklch(0.945 0.022 210)"
  on-primary: "oklch(0.99 0.005 210)"
  accent: "oklch(0.62 0.10 75)"
  accent-strong: "oklch(0.50 0.10 70)"
  accent-soft: "oklch(0.955 0.028 80)"
  danger: "oklch(0.52 0.16 25)"
  danger-bg: "oklch(0.955 0.025 25)"
  status-corrections: "oklch(0.55 0.13 45)"
  status-approved: "oklch(0.52 0.11 155)"
typography:
  title:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "1.375rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.015em"
  headline:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.25
  body:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.3
rounded:
  sm: "6px"
  md: "8px"
  lg: "12px"
  full: "999px"
spacing:
  1: "4px"
  2: "8px"
  3: "12px"
  4: "16px"
  5: "20px"
  6: "24px"
  8: "32px"
  10: "40px"
  12: "48px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.md}"
    padding: "8px 14px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-secondary:
    backgroundColor: "{colors.bg}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "8px 14px"
  status-pill:
    rounded: "{rounded.full}"
    padding: "2px 9px"
  card:
    backgroundColor: "{colors.bg}"
    rounded: "{rounded.lg}"
    padding: "20px"
---

# Design System: Meridian — Permit Package Tracker

## 1. Overview

**Creative North Star: "Ship's Chronometer at Dawn"**

Meridian is a precision instrument for permit expeditors: a tool that always knows exactly where things stand, and never looks anxious saying so. The system reads as cool steel-blue against pure white — the calm of a navigator's bench, not the noise of a SaaS dashboard. Information is dense but breathes; rows and lists carry the work, color carries meaning, and nothing decorates.

The system explicitly rejects the generic SaaS dashboard (interchangeable blue/white, sidebar-and-card-grid boilerplate), heavy enterprise construction-tool aesthetics, the bureaucratic density of municipal portals, and cold sterile minimalism. Warmth comes from the brass accent and human copy, never from a tinted background.

**Key Characteristics:**
- Pure white surface; brand lives in steel-teal primary and brass accent
- List-led layouts, not card grids; density without noise
- Status is always icon + label + color — never color alone
- Fixed rem type scale (~1.125 ratio), one family (Inter), tabular numerals for data
- Motion only conveys state: 140–200ms, ease-out, no choreography

## 2. Colors

A restrained instrument palette: steel-teal speaks for the product, brass speaks for time pressure, and everything else stays quietly neutral.

### Primary
- **Steel Teal** (oklch(0.55 0.091 210)): Primary actions, current selection, active nav, focus rings, progress. The product's voice — used on ≤10% of any screen.
- **Steel Teal Soft** (oklch(0.945 0.022 210)): Selected-state washes, trade chips, informational hints.

### Secondary
- **Brass** (oklch(0.62 0.10 75)): Deadlines and attention signals only — the attention strip, due-soon countdowns. Brass means "time matters here."

### Tertiary
- **Correction Orange** (oklch(0.55 0.13 45)) and **Approval Green** (oklch(0.52 0.11 155)): permit-lifecycle status hues, always inside a pill with icon + label.

### Neutral
- **Pure White** (oklch(1 0 0)): The body background. Exactly white — no hidden warmth.
- **Ink** (oklch(0.235 0.018 230)): Body text; carries a whisper of the brand's cool hue.
- **Muted** (oklch(0.47 0.022 225)): Secondary text, metadata. Passes 4.5:1 on white.
- **Cool Surface** (oklch(0.972 0.004 220)): Hover washes, skeletons, sub-form panels.
- **Hairline** (oklch(0.885 0.008 220)) / **Hairline Strong** (oklch(0.80 0.012 220)): Borders and dividers; structure comes from lines, not shadows.

### Named Rules
**The Brass-Means-Deadline Rule.** The brass accent appears only where time pressure exists — deadlines, overdue states, the attention strip. Brass on anything else is forbidden.

**The Never-Color-Alone Rule.** Status is always carried by icon + label + color together. A color-blind expeditor reads every screen at full fidelity.

## 3. Typography

**Display Font:** Inter (with system-ui fallback)
**Body Font:** Inter — one family carries everything
**Label/Mono treatment:** Inter with `font-variant-numeric: tabular-nums` (`.tnum`) for references, dates, counts

**Character:** A single well-tuned sans at a tight ~1.125 scale ratio. Calm, legible, never shouting; hierarchy comes from weight and spacing, not size jumps.

### Hierarchy
- **Title** (600, 1.375rem, 1.25, -0.015em): Page titles ("Packages", client names on detail pages).
- **Headline** (600, 1rem–1.125rem, 1.25): Section and card headings.
- **Body** (400, 0.875rem, 1.55): Default UI text. Prose capped at 64ch.
- **Label** (500, 0.75–0.8125rem): Pills, chips, metadata, form labels.

### Named Rules
**The Tabular Number Rule.** Every reference number, date, count, and file size uses tabular numerals. Data columns never wiggle.

## 4. Elevation

Flat by default. Depth is conveyed by hairline borders and the two-step neutral surface ramp, not shadows. Shadows exist only at the overlay tier — the slide-in panel earns `--shadow-lg`; resting cards never carry one.

### Shadow Vocabulary
- **Overlay** (`0 12px 32px oklch(0.25 0.02 230 / 0.16)`): Slide-in panels and any future popover/dialog.
- **Ambient** (`0 1px 2px oklch(0.25 0.02 230 / 0.06)`): Available but rarely used; never on resting content.

### Named Rules
**The Hairline-Structure Rule.** If you reach for a shadow to separate two resting surfaces, use a 1px border instead.

## 5. Components

### Buttons
- **Shape:** Gently rounded (8px radius)
- **Primary:** Steel-teal fill, near-white text, 8px × 14px padding, 500 weight
- **Hover / Focus:** Darkened teal fill; 2px teal focus ring offset 2px (`:focus-visible` only)
- **Secondary:** White fill, strong hairline border; border and text shift to teal on hover
- **Ghost:** Text-only muted; ink on surface wash on hover

### Status Pills
- **Style:** Full-radius pill, tinted background + saturated text of the same hue, 12px icon + label
- **Vocabulary:** Preparing (neutral), Submitted (blue), In Review/Resubmitted (teal), Corrections (orange), Approved (green), Closed (gray)

### Cards / Containers
- **Corner Style:** 12px radius
- **Background:** Pure white with 1px hairline border
- **Shadow Strategy:** None at rest (see Elevation)
- **Internal Padding:** 20px

### Inputs / Fields
- **Style:** White fill, 1px strong-hairline border, 8px radius, 8px × 11px padding
- **Focus:** Global 2px teal `:focus-visible` ring; border shifts teal on hover
- **Error:** Danger-red border + small danger-colored message below; `aria-invalid` + `aria-describedby` wired

### Navigation
- **Style:** 56px sticky top bar, brand left, pill-shaped links center-right
- **Active state:** Steel-teal text on teal-soft wash; hover is ink on cool surface

### File Chips (signature)
Attached documents render as full-radius chips: download affordance + filename (ellipsized at 220px) + tabular file size + quiet remove ×. The dashed "Attach" chip is the empty affordance — dashed border signals "add here."

## 6. Do's and Don'ts

### Do:
- **Do** keep the body background exactly `oklch(1 0 0)` in light mode — warmth belongs to brass and copy, never the surface.
- **Do** pair every status color with its icon and label (The Never-Color-Alone Rule).
- **Do** use `.tnum` tabular numerals on every reference, date, count, and size.
- **Do** keep transitions 140–200ms ease-out, state-conveying only, with the `prefers-reduced-motion` kill switch already in globals.
- **Do** use list rows for collections of packages and contractors; cards only for the detail page's distinct work areas.

### Don't:
- **Don't** drift toward the "generic SaaS dashboard" — interchangeable blue/white, sidebar nav, identical card grids (PRODUCT.md anti-reference, verbatim).
- **Don't** import "construction management tool" heaviness — Procore/Autodesk enterprise chrome (PRODUCT.md anti-reference).
- **Don't** go "overly minimal / cold" — sterile whitespace deserts with no warmth (PRODUCT.md anti-reference).
- **Don't** use side-stripe borders (`border-left` > 1px as colored accent), gradient text, or glassmorphism — banned outright.
- **Don't** put brass on anything that isn't a deadline or attention signal.
- **Don't** add shadows to resting surfaces; reach for a hairline border instead.
