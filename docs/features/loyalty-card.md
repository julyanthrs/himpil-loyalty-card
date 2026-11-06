# Feature: Virtual Loyalty Card

> Read this document when modifying card display, 3D flip card, stamp visualization, or digitized physical card graphics.

---

## 1. Feature Purpose & Overview

The Virtual Loyalty Card is the visual and emotional center of the Himpil application. Instead of generic CSS cards, Himpil digitizes the **exact physical card artwork** printed for the café, preserving the brand's tactile feeling while adding interactive digital capabilities:
- Interactive 3D flip to inspect front and back.
- Real-time stamp filling with bounce animation (`animate-stamp-pop`).
- Progress counters showing collected cups, remaining cups, and percentage completion.
- Accessible reduced-motion mode.

---

## 2. Technical Architecture & File Map

| Component / File | Purpose |
|---|---|
| `src/pages/MyCard.tsx` | Main Loyalty Card view. Houses the `FlipCard`, progress stats, and "How It Works" steps. |
| `src/components/loyalty/FlipCard.tsx` | Manages 3D flip transform, flip toggle button, and overlapping ivory stamp panel. |
| `src/components/loyalty/CardArt.tsx` | Renders `CardFrontArt` and `CardBackArt` using the digitized webp images and JSON coordinate maps. |
| `src/components/loyalty/CardPreview.tsx` | Compact horizontal loyalty card embedded on the Home dashboard (`/`). |
| `src/components/loyalty/StampGrid.tsx` | Renders a grid of 10 cup icons (9 purchase cups + 1 free cup). |
| `src/components/brand/CupStamp.tsx` | Individual SVG cup stamp component supporting states: `empty`, `filled`, `free`, and `free-ready`. |
| `src/brand/card-back.json` | Exact pixel coordinate bounding boxes (% of width/height) for each cup on the card back. |

---

## 3. Digitized Artwork Pipeline

The card artwork is generated from original scans in `design/card-source/` via `scripts/build-card-art.mjs`:

1. **Card Front** (`public/brand/card-front.webp`):
   - Preserves the original print background with the engraved coffee branch illustration.
   - Overlays the live typographic heading: "Buy 9, Get 1 Free".

2. **Card Back Cleaning & Live Text** (`public/brand/card-back.webp`):
   - The printed paragraph on the original card had typos and referenced "Sip Up Coffee".
   - `build-card-art.mjs` infills the text rectangle using color-matched and feathered texture from the card front.
   - The loyalty explanation is then re-rendered as crisp, accessible live text in `CardArt.tsx`.

3. **Pre-Filled Stamp Artwork** (`public/brand/card-back-filled.webp`):
   - The script performs connected-component analysis on each of the 10 cup illustrations on the card back, filling the cup body, lid, sleeve, and bean in matching brand colors.
   - `CardBackArt` renders the clean back image and overlays the filled version clipped to each cup's bounding box using CSS `clipPath: inset(...)`.
   - When a stamp is collected, only that cup's filled overlay is revealed.

---

## 4. 3D Card Flip Mechanics

The flip animation is implemented purely with CSS transforms in `src/index.css`:
```css
.flip-scene { perspective: 1400px; }
.flip-inner {
  position: relative;
  transform-style: preserve-3d;
  transition: transform 700ms cubic-bezier(0.2, 0.7, 0.2, 1);
}
.flip-inner[data-flipped='true'] { transform: rotateY(180deg); }
.flip-face {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}
.flip-back { transform: rotateY(180deg); }
```

### Accessibility & Reduced Motion
For users with `prefers-reduced-motion: reduce`:
- 3D rotations are disabled.
- Card transitions smoothly between front and back using an opacity cross-fade (`opacity 200ms ease`), ensuring users sensitive to motion are not disoriented.

---

## 5. Stamp Collection Animation

When a stamp is added while the user is viewing the card:
1. `LoyaltyContext` detects an increase in `account.totalStamps`.
2. It sets `lastEvent` with `stampIndex = account.stamps - 1`.
3. The newly filled cup receives the `.animate-stamp-pop` class:
   ```css
   @keyframes stamp-pop {
     0% { transform: scale(0.6) rotate(-8deg); opacity: 0.2; }
     60% { transform: scale(1.12) rotate(2deg); opacity: 1; }
     100% { transform: scale(1) rotate(0); }
   }
   ```
4. The stamp bounces with an elastic cubic-bezier easing (`520ms cubic-bezier(0.34, 1.56, 0.64, 1)`).

---

## 6. Edge Cases & Gotchas

- **Container Queries**: Both `CardFrontArt` and `CardBackArt` utilize `@container` and `cqw` units so text and clipping paths scale proportionately regardless of screen width.
- **Overlapping Stamp Panel**: In `FlipCard.tsx`, the ivory stamp panel sits with a negative margin (`-mt-7`) over the card front to replicate the design mockup, but shifts to `mt-3` when flipped so the full card back art is unobstructed.

