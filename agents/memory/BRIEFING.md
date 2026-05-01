# Project Briefing
> Plain English. Both agents update this after every significant action.
> **David reads this to know exactly what's happening.**

---

## What we're building
JackPal — Nigerian student audio learning platform. "NotebookLM + Nigerian voices + offline."

## What happened (2026-05-01, session 2)
- **Voice names status**: "Ezinne" and "Abeo" removed from ALL landing page components. Using generic "Female / Male / Neutral / Deep" voice labels until final names decided.
- **Em dashes removed**: All " — " in user-visible text replaced with commas or periods
- **AudioPlayerMock cleaned up**: Removed transcript section and voice pill buttons. Now shows only: Now Playing header, waveform bars, progress bar, transport controls, "LIVE" badge (no speaker name)
- **Light mode added**: Full CSS variable system with `[data-theme="light"]` override. Toggle is a Sun/Moon button in the Navbar. Theme persists via localStorage. Anti-flash script in layout.tsx.
- **Three.js waveform animation added**: `HeroWave.tsx` uses `@react-three/fiber` (already installed). Shows 7 animated sine wave lines with envelope shaping and brand blue color. Renders as the Hero section background. Transparent canvas, doesn't obstruct content.

## What happened (2026-05-01, session 3)
- **React key error fixed**: HowItWorks desktop map used `<>` fragment without a key — switched to `<Fragment key={step.id}>` from React.
- **FinalCTA visual responsive**: Hardcoded `width: 340px` container clamped to `clamp(220px, 80vw, 340px)` so it never overflows on narrow phones.
- **FeatureAnimation panels responsive padding**: All 3 inner panels (Listen, Podcast, Upload) changed from `padding: "40px"` to `p-5 sm:p-10` Tailwind classes (20px mobile → 40px sm+).
- **VoiceFeature perf optimized**: Reduced bars from 48→36, interval 55ms→75ms, gap 2px→3px. Cuts Framer Motion animation work ~35% on low-end phones.
- **ConditionsSection + ReferralCTA card padding**: Changed `padding: "40px"` inline style to `p-6 sm:p-10` — breathes on mobile.

## Current state
Landing page is complete and mobile-optimized. Main app (dashboard) redesign is next.

## Design system (for dashboard redesign)
- Dark BG: `var(--lp-bg)` = `#0D0B0F`
- Light BG: `var(--lp-bg)` = `#F9F8F6` (switches via data-theme)
- Surface: `var(--lp-surface)` / `var(--lp-surface-2)`
- Border: `var(--lp-border)`
- Text: `var(--lp-text-1)` / `var(--lp-text-2)` / `var(--lp-text-3)`
- Accent: `var(--lp-amber)` = `#2C7BE5` dark / `#1A6DD4` light (brand blue)
- Display font: `var(--font-display)` = Fraunces
- UI font: `var(--font-syne)` = Syne
- Three.js (`@react-three/fiber`, `@react-three/drei`, `three`) already installed and working

## Pending
- Dashboard redesign (same palette system)
- Final voice names (to replace "Female / Male / Neutral / Deep" placeholders)
- Real app screenshots for landing page (after dashboard redesign)
