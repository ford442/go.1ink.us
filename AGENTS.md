# AGENTS.md

## The Portal Curator's Journal 🌌

This file tracks the design philosophy, UX decisions, and technical implementation details that give the `go.1ink.us` dashboard its premium feel.

### UX/UI Philosophy
- **Discovery:** Users need help finding things (Search, Filtering, Categories).
- **Aliveness:** The dashboard shouldn't feel static. It should breathe (pulsing glows, mouse interactions).
- **Depth:** Use layering (background -> grid -> cards -> overlays) to create a sense of space.

### Technical Learnings & Patterns

#### 3D Card Effects & Glassmorphism
- **Preserving 3D Context:** To achieve true parallax depth (where inner elements float above the card background), the parent card container **cannot** use `overflow: hidden`. This flattens the 3D context.
    - *Solution:* Remove `overflow: hidden` from the parent and apply `rounded-xl` (or specific corner rounding) to the immediate child elements (images, overlays) instead.
- **"Window" Pivot:** For a premium "portal" feel, the card should rotate to face the cursor (positive rotation follows mouse), rather than lifting away from it (seesaw effect).
- **Parallax Depth:** Applying small `translateZ` values (e.g., `50px`) to inner content (titles, tags) creates a significant perception of depth when the card rotates.

#### Visual Polish (Planned/Observed)
- **Weighty Hovers:** Hover states should have a slight delay (700ms) on image zooms to feel "heavy" and deliberate, rather than twitchy.
- **Grid Masks:** Grid pattern backgrounds require a radial mask (fading to transparent at edges) to integrate seamlessly with the dark void background.
