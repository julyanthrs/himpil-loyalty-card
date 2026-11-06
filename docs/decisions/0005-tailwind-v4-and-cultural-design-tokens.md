# Decision: Tailwind CSS v4 and Cultural Design System Tokens

## Context
The project required a modern styling approach that could natively support mobile PWA viewports, CSS container queries, complex 3D transforms, and custom palette naming honoring Filipino cultural heritage.

## Decision
Adopt **Tailwind CSS v4** (`@tailwindcss/vite`) utilizing in-CSS `@theme` declarations in `src/index.css`.
- Define coffee-inspired semantic tokens (`espresso`, `mocha`, `roasted`, `latte`, `cream`, `ivory`, `bean`, `ink`, `subtle`).
- Pair Playfair Display (editorial serif) for headings with Inter (clean sans) for functional UI and Noto Sans Tagalog for authentic Baybayin glyphs.
- Incorporate Philippine cultural motifs: *sawali* (woven bamboo) background textures, *himpil* (stopping place) root naming, and page-specific Baybayin words with modern krus-kudlit final consonant marks.

## Reasoning
- Tailwind v4 eliminates JavaScript configuration files (`tailwind.config.js`) in favor of direct CSS theme declarations, improving build performance with Vite.
- Cultural design tokens anchor the virtual card directly to the brand's identity and story, making the app feel like a handcrafted digital artifact rather than a generic SaaS product.
- CSS container queries (`@container`, `cqw`) allow card artwork and stamp grids to scale proportionately across all mobile phone sizes.

## Alternatives
- CSS Modules or Styled Components (heavier bundle, slower developer iteration).
- Tailwind v3 with traditional `tailwind.config.js` (legacy approach, slower build pipeline).

## Consequences
- Developers must declare new theme variables inside `@theme` in `src/index.css` rather than editing a JS configuration file.
- Future AI agents must not generate or search for `tailwind.config.js`.

