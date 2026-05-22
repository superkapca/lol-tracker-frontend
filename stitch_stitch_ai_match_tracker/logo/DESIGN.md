---
name: Competitive Precision System
colors:
  surface: '#17130c'
  surface-dim: '#17130c'
  surface-bright: '#3e3831'
  surface-container-lowest: '#110e08'
  surface-container-low: '#1f1b14'
  surface-container: '#231f18'
  surface-container-high: '#2e2922'
  surface-container-highest: '#39342c'
  on-surface: '#ebe1d6'
  on-surface-variant: '#d2c5b1'
  inverse-surface: '#ebe1d6'
  inverse-on-surface: '#353028'
  outline: '#9b8f7d'
  outline-variant: '#4e4637'
  surface-tint: '#f0bf5c'
  primary: '#f0bf5c'
  on-primary: '#412d00'
  primary-container: '#c89b3c'
  on-primary-container: '#4b3500'
  inverse-primary: '#7b5900'
  secondary: '#bac6e7'
  on-secondary: '#24304a'
  secondary-container: '#3d4964'
  on-secondary-container: '#acb8d8'
  tertiary: '#a9c7ff'
  on-tertiary: '#003063'
  tertiary-container: '#7ea3e3'
  on-tertiary-container: '#033871'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdea4'
  primary-fixed-dim: '#f0bf5c'
  on-primary-fixed: '#261900'
  on-primary-fixed-variant: '#5d4200'
  secondary-fixed: '#d8e2ff'
  secondary-fixed-dim: '#bac6e7'
  on-secondary-fixed: '#0e1b34'
  on-secondary-fixed-variant: '#3b4762'
  tertiary-fixed: '#d6e3ff'
  tertiary-fixed-dim: '#a9c7ff'
  on-tertiary-fixed: '#001b3d'
  on-tertiary-fixed-variant: '#1b4680'
  background: '#17130c'
  on-background: '#ebe1d6'
  surface-variant: '#39342c'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-caps:
    fontFamily: Inter
    fontSize: 10px
    fontWeight: '700'
    lineHeight: 12px
    letterSpacing: 0.06em
  stat-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '700'
    lineHeight: 22px
  stat-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 16px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 12px
  margin: 16px
---

## Brand & Style

This design system is engineered for high-performance data consumption in the esports domain. It prioritizes information density, scanability, and a "HUD-like" focus that mimics modern competitive gaming interfaces. 

The design style is **Corporate Modern with a Minimalist Utility** twist. It avoids decorative fluff to favor a data-centric environment where performance metrics and match outcomes are the primary actors. The aesthetic is "Tactical Dark"—utilizing a deep, low-light environment that reduces eye strain during long sessions while allowing high-contrast status colors (Win/Loss/Gold) to pop with immediate visual hierarchy.

- **Tone**: Analytical, cold, precise, and authoritative.
- **Visual Movement**: Structured, grid-aligned, and compact. 
- **Emotional Response**: Efficiency, professional-grade insight, and competitive clarity.

## Colors

The palette is strictly functional, rooted in the tonal language of high-stakes competition.

- **Foundation**: The base layer uses a deep charcoal (#0B0B0C) to create a void-like depth, with surface elements utilizing a slightly lighter slate (#1A1C1E) to define container boundaries.
- **Accents**: 
    - **Gold-accent (#C89B3C)**: Reserved for premium states, achievements, and Tier-1 rankings. 
    - **Win-blue (#28344E)**: Used for victory states and positive delta indicators.
    - **Loss-red (#59343B)**: Used for defeat states and negative performance metrics.
- **Neutrals**: Grey scales are used to manage the hierarchy of secondary data points, ensuring that the background never competes with text legibility.

## Typography

The typography system relies exclusively on **Inter** to maximize readability across dense data tables and match histories. 

- **Data Emphasis**: Stats are treated with higher weights (600-700) to ensure they are the first thing a user sees.
- **Caps for Labels**: Small, all-caps labels are used for metadata (e.g., "MATCH DURATION", "GOLD PER MINUTE") to differentiate them from dynamic content.
- **Numerical Alignment**: When implementing, use tabular lining for numbers to ensure that columns of stats align perfectly for easy comparison.
- **Scalability**: Headlines are kept relatively compact; even the largest display style does not exceed 32px to maintain the "dashboard" feel.

## Layout & Spacing

This system utilizes a **Fixed Grid** philosophy for dashboard views and a **Strict Columnar** layout for match lists.

- **The 4px Rule**: All spacing increments must be multiples of 4px. Use `sm` (8px) for internal padding of compact components and `md` (16px) for standard gaps.
- **Match History Row**: Each row should have a fixed height or a very tight vertical padding to maximize the number of matches visible on a single screen.
- **Breakpoints**: 
    - **Desktop (1440px+)**: 12-column grid, 1120px max-width container.
    - **Tablet (768px - 1439px)**: 8-column grid, fluid width with 24px margins.
    - **Mobile (<767px)**: 4-column grid, 16px margins.
- **Data Density**: On mobile, secondary stats (CS, wards, etc.) should be hidden or moved to a secondary line to keep the Champion Icon and KDA prominent.

## Elevation & Depth

In a dark, data-dense UI, depth is created through **Tonal Layering** rather than heavy shadows.

- **Level 0 (Background)**: #0B0B0C — The canvas.
- **Level 1 (Cards/Containers)**: #1A1C1E — Primary surface for match rows and player stats.
- **Level 2 (Popovers/Tooltips)**: #2C2E33 — Used for hover states or dropdown menus.
- **Outlines**: Every card and container must use a 1px solid border (#2C2E33) to provide definition against the deep background. This is a "No Shadow" system; clear borders provide the necessary structural integrity for a professional esports look.

## Shapes

The shape language is **Soft (0.25rem / 4px base)** to maintain a technical and precise feel without being overly aggressive.

- **Component Corners**: Standard buttons and input fields use 4px (`rounded-sm`).
- **Cards/Containers**: Match history cards and profile headers use 8px (`rounded-lg`) to create a clear container identity.
- **Icons**: Champion icons, item icons, and summoner spells must remain **perfectly square** (0px radius) to align with the game's internal visual language and maintain a "slot-based" inventory feel.

## Components

- **Match Cards**: These are the heart of the system. They use a split background: the far left edge (4px wide) is colored either Win-blue or Loss-red. All content is placed on #1A1C1E.
- **Buttons**:
    - **Primary**: Gold-accent (#C89B3C) with black text for maximum contrast.
    - **Secondary**: Ghost style with #2C2E33 borders and white text.
- **Chips/Badges**: Small, high-contrast badges for "MVP," "Ace," or "Rank Up." Use a background that matches the achievement type (Gold for MVP, Blue for Win).
- **Stat Blocks**: Groups of related numbers (e.g., K/D/A) should use the `stat-lg` type for the numbers and `body-sm` for the slash separators, ensuring the numbers are the primary focus.
- **Input Fields**: Dark backgrounds (#0B0B0C) with #2C2E33 borders. Focus states should use a subtle glow from the Gold-accent color.
- **Progress Bars**: Used for HP, Mana, or XP. These should be flat, 4px tall, and utilize high-saturation versions of their respective colors (e.g., Bright Green for HP) with a #2C2E33 track background.