---
name: Maternal Care System
colors:
  surface: '#fafaee'
  surface-dim: '#dadbcf'
  surface-bright: '#fafaee'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f4f4e8'
  surface-container: '#efefe3'
  surface-container-high: '#e9e9dd'
  surface-container-highest: '#e3e3d7'
  on-surface: '#1a1c15'
  on-surface-variant: '#574147'
  inverse-surface: '#2f3129'
  inverse-on-surface: '#f1f1e5'
  outline: '#8a7177'
  outline-variant: '#ddbfc6'
  surface-tint: '#ad2863'
  primary: '#600032'
  on-primary: '#ffffff'
  primary-container: '#890149'
  on-primary-container: '#ff8fb6'
  inverse-primary: '#ffb0c9'
  secondary: '#7e5162'
  on-secondary: '#ffffff'
  secondary-container: '#ffc5d8'
  on-secondary-container: '#7b4e5f'
  tertiary: '#382a31'
  on-tertiary: '#ffffff'
  tertiary-container: '#4f4048'
  on-tertiary-container: '#c1acb5'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffd9e2'
  primary-fixed-dim: '#ffb0c9'
  on-primary-fixed: '#3e001e'
  on-primary-fixed-variant: '#8c054b'
  secondary-fixed: '#ffd9e4'
  secondary-fixed-dim: '#f0b7ca'
  on-secondary-fixed: '#32101f'
  on-secondary-fixed-variant: '#643a4a'
  tertiary-fixed: '#f3dde6'
  tertiary-fixed-dim: '#d6c1ca'
  on-tertiary-fixed: '#24181f'
  on-tertiary-fixed-variant: '#52434a'
  background: '#fafaee'
  on-background: '#1a1c15'
  surface-variant: '#e3e3d7'
typography:
  display:
    fontFamily: Noto Serif
    fontSize: 3rem
    fontWeight: '400'
    lineHeight: 3.5rem
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Noto Serif
    fontSize: 2.25rem
    fontWeight: '400'
    lineHeight: 2.75rem
    letterSpacing: -0.015em
  headline-lg-mobile:
    fontFamily: Noto Serif
    fontSize: 1.75rem
    fontWeight: '400'
    lineHeight: 2.25rem
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Noto Serif
    fontSize: 1.5rem
    fontWeight: '400'
    lineHeight: 2rem
  headline-sm:
    fontFamily: Noto Serif
    fontSize: 1.25rem
    fontWeight: '400'
    lineHeight: 1.75rem
  title-lg:
    fontFamily: DM Sans
    fontSize: 1.125rem
    fontWeight: '600'
    lineHeight: 1.625rem
  title-md:
    fontFamily: DM Sans
    fontSize: 1rem
    fontWeight: '600'
    lineHeight: 1.5rem
  body-lg:
    fontFamily: DM Sans
    fontSize: 1.125rem
    fontWeight: '400'
    lineHeight: 1.75rem
  body-md:
    fontFamily: DM Sans
    fontSize: 1rem
    fontWeight: '400'
    lineHeight: 1.5rem
  body-sm:
    fontFamily: DM Sans
    fontSize: 0.875rem
    fontWeight: '400'
    lineHeight: 1.375rem
  label-lg:
    fontFamily: DM Sans
    fontSize: 0.875rem
    fontWeight: '600'
    lineHeight: 1.25rem
    letterSpacing: 0.01em
  label-md:
    fontFamily: DM Sans
    fontSize: 0.75rem
    fontWeight: '600'
    lineHeight: 1rem
    letterSpacing: 0.02em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-desktop: 2.5rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
  space-2xl: 2rem
  space-3xl: 3rem
---

## Brand & Style

This design system establishes an empathetic, dignified, and clinical-grade atmosphere designed for frontline health workers (such as ASHA workers), expectant mothers, and medical supervisors. The aesthetic pairs editorial grace with utilitarian reliability, completely rejecting juvenile tropes, superficial wellness pastels, and stark hospital administration clutter.

The visual direction synthesizes **Editorial Warmth** with **Structured Utility**:
- **Tone:** Calm, trustworthy, respectful, unhurried, and precise.
- **Visual Stance:** Generous whitespace, tactile organic warmth from soft alabaster backdrops, and deliberate typographic contrast. It deliberately avoids clinical coldness, glowing tech tropes, or gamified wellness clichés.
- **Core Audience Demands:** Frontline operations on mid-to-low-tier mobile hardware in varied lighting conditions, demanding high legibility, robust touch targets, and unmistakable visual hierarchy without sensory overload.

## Colors

The system uses an intentionally strict four-color palette. No auxiliary brand accents, synthetic blues, or generic neon indicators are permitted. Status, progress, and danger indicators are communicated through explicit typography, structured iconography, and contrasting weight rather than relying solely on arbitrary color shifts.

- **Cherry (`#890149`):** Primary brand anchor. Used for primary call-to-action buttons, active navigation indicators, key structural emphasis, and crucial links. Applied with intentional restraint; never flooded across broad surfaces.
- **Alabaster (`#F3F3E7`):** The foundational canvas and card surface. Replaces sterile, glaring white with an earthy, calming surface that reduces screen glare during fieldwork.
- **Dusty Rose (`#D9A2B5`):** Structural dividing lines, muted pill badge containers, and delicate card borders. Never used for body copy, fine microcopy, or crucial navigational icons due to strict contrast standards against Alabaster.
- **Warm Ink (`#30232A`):** Primary reading color for all headings, descriptive body text, measurements, and dark iconography. Delivers deep, clear contrast with high readability while remaining significantly softer than harsh `#000000`.

### Accessibility & Contrast Rules
- **Text on Alabaster:** Warm Ink for all standard and secondary body reading; Cherry for interactive links.
- **Text on Cherry:** Strictly Alabaster.
- **Text on Dusty Rose:** Strictly Warm Ink.
- **State Semantics:** Never rely on color alone to indicate clinical urgency, missing data, or syncing statuses. Always pair visual accents with explicit descriptive copy (e.g., "Urgent Referral Required") and high-contrast iconography.

## Typography

The typography unites warm literary authority with pragmatic clinical readability.

- **Headlines & Editorial Titles:** Driven by an authoritative serif to introduce humanity and calm confidence without decorative distraction. Headings remain concise and uncrowded.
- **Functional Interface & Body Copy:** Standardized on `DM Sans` for optimal legibility across forms, clinical readings, numeric data points, and navigational chrome.
- **Numerical Alignment:** Vitals, gestational age metrics, blood pressure readings, and dates must be rendered in medium or semibold weights of `DM Sans`, accompanied by distinct unit indicators in `label-md` or `label-lg`.
- **Text Rules:** Sentence case is mandatory across all headers, prompts, and buttons to preserve an unhurried, respectful tone. Avoid uppercase tracking or tight line-heights that impede fast recognition under outdoor field conditions.

## Layout & Spacing

A mobile-first layout strategy tailored for handheld, one-handed operation by health workers during home visits, which reflows gracefully into focused, balanced compositions on larger screens.

- **Mobile Rhythm (320px – 767px):** Single-column stacked hierarchy. Margins sit firmly at `1rem` (16px) with vertical element rhythms stepped across 4px, 8px, 12px, 16px, 24px, and 32px increments. Interactive targets enforce a minimum clearance of 44 × 44px to prevent input errors.
- **Tablet & Desktop (768px+):** Fluid, centered layouts restricted to a maximum container width of 720px for form inputs and clinical timelines to preserve line length comfort. Analytical dashboards and supervisor case lists expand to a maximum width of 1140px with a 12-column grid and 24px gutters.
- **Whitespace Philosophy:** Whitespace serves as the primary separator. Heavy visual dividers or deeply nested boxes are replaced by generous vertical stepping (`space-xl` and `space-2xl`) between logical case sections.

## Elevation & Depth

Visual hierarchy is communicated through tonal containment and crisp hairline perimeters rather than atmospheric drops or floating skeuomorphism.

- **Surface Tiers:** Depth is flat and honest. The canvas rests on base Alabaster (`#F3F3E7`), while active working sections and cards are constructed using identical or subtly accented Alabaster surfaces framed with a 1px solid Dusty Rose (`#D9A2B5`) stroke.
- **Shadow Elimination:** No blurred shadows, neomorphic bevels, or colorful ambient drop shadows are utilized for primary or static cards.
- **Overlays & Dialogs:** Flyouts, pickers, and modal clinical warnings rely on high-contrast Warm Ink scrims (`rgba(48, 35, 42, 0.4)`) coupled with a sharp, low-deflection boundary shadow: `0 4px 12px rgba(48, 35, 42, 0.08)`.

## Shapes

The shape system is disciplined, quiet, and grounded:

- **Form Fields & Action Buttons:** Configured with a restrained 4px to 8px corner radius (`rounded` to `rounded-md`), establishing an intentional, dependable tool-like feel.
- **Cards & Data Groups:** Set strictly to 12px (`rounded-lg`), delivering a soft, non-intrusive container edge.
- **Badges & Micro-tags:** Configured as true pills (`9999px`) to create clear differentiation between actionable inputs and passive metadata.
- **Decorative Elements:** No irregular asymmetrical cutouts, bubbly organic blobs, or decorative shapes. Every boundary conforms to purposeful modular clarity.

## Components

### Buttons
- **Primary:** Solid Cherry (`#890149`) fill, Alabaster (`#F3F3E7`) text, 6px radius, minimum height 48px. Explicit action verbs only (e.g., "Record Observation", "Confirm Referral"). Disabled state uses 40% opacity Cherry with Alabaster text; never unreadable low-contrast grey.
- **Secondary:** Alabaster background, 1.5px solid Dusty Rose (`#D9A2B5`) border, Cherry text, 6px radius.
- **Tertiary/Ghost:** No background, Warm Ink text with subtle underline or trailing chevron, minimum touch target maintained at 44px.

### Inputs & Form Controls
- **Text & Numeric Inputs:** Alabaster surface, 1px solid Dusty Rose border, 6px radius, Warm Ink value text. Top-aligned label in `DM Sans Semibold` Warm Ink. On focus: 1.5px Cherry border with no glow rings.
- **Clinical Units:** Appended directly within the input field container using Warm Ink at 70% opacity (e.g., `mmHg`, `weeks`, `g/dL`).
- **Checkboxes & Radios:** 20 × 20px boxes/circles with 1.5px Warm Ink border on Alabaster. Checked state displays solid Cherry fill with an Alabaster checkmark or dot.

### Cards & Groupings
- **Summary & Case Cards:** 12px corner radius, Alabaster surface, framed by a 1px solid Dusty Rose perimeter. Internal padding of 16px (mobile) to 24px (desktop).
- **No Card Nesting:** Secondary data groups within cards must be structured with subtle Dusty Rose hairline rules (`1px solid #D9A2B5`) rather than nested cards.

### Badges & Status Indicators
- **Form Factor:** Fully rounded pill (`9999px`), internal padding 4px vertical, 12px horizontal.
- **Default/Info:** Dusty Rose background with Warm Ink text.
- **Urgent/Attention:** Cherry background with Alabaster text, paired alongside a high-contrast clinical icon (e.g., alert triangle) to guarantee non-chromatic comprehension.

### Synchronization & Offline Indicators
- **Offline States:** Visible pinned utility bar on Alabaster with a 1px solid Dusty Rose bottom border. Uses an offline icon accompanied by clear text: "Saved offline. Will sync automatically."
- **Pending/Synced Status:** Distinct text tags ("Pending Sync", "Synced") set in Warm Ink label typography beside maternal visit logs.