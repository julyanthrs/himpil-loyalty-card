# Decision: Digitized Physical Card Rendering

## Context
Many virtual loyalty applications use generic CSS gradient cards with emoji or plain icon stamps. For Himpil Coffee, the physical punch card artwork represents a core brand asset with hand-drawn coffee cups, engraved background details, and specific tactile appeal.

## Decision
Digitize the physical card artwork directly into the web application:
1. Process the physical card scans via `scripts/build-card-art.mjs`.
2. Clean and infill the printed paragraph, replacing it with live text in `CardArt.tsx` (correcting typos from the physical print file).
3. Generate a pre-filled artwork file (`card-back-filled.webp`) where all cups are color-filled.
4. Calculate cup bounding boxes into `src/brand/card-back.json`.
5. Reveal collected stamps programmatically using CSS `clipPath: inset(...)` over the clean card back artwork.

## Reasoning
- Preserves 100% brand fidelity with the physical coffee shop experience.
- Corrects typographical errors in the original physical print file without altering the authentic underlying illustration.
- Enables high-performance CSS animations (`animate-stamp-pop`) by revealing pre-computed vector/raster layers rather than dynamically synthesizing complex graphics in canvas.

## Alternatives
- Pure CSS/SVG recreation of the entire card (high effort, loses subtle print engraving textures).
- Showing only the physical card photo with SVG circles stamped on top (looks artificial and fails to match the intricate cup line drawings).

## Consequences
- If the physical card artwork is redesigned, the developer must re-run `node scripts/build-card-art.mjs` to re-extract cup coordinates and re-generate webp files.

