# Changelog & Memory Log

> Captures meaningful architectural milestones, schema updates, and subsystem changes to give AI coding agents quick historical context.

---

## 2026-11-07

### Architectural
- **AI Second Brain & Persistent Knowledge System**: Initialized comprehensive internal documentation architecture for AI software engineers.
  - Created root operating manual: `agent.md`.
  - Created system documentation in `docs/`: architecture, codebase map, conventions, development guide, database schema, security model, feature specifications, integration guides, architectural decisions, troubleshooting, and known issues.

---

## Commit `3dd2aa7` — "revised version"

### Added
- **Digitized Card Art Pipeline**: Integrated original physical card scans from `design/card-source/`. Built `scripts/build-card-art.mjs` to infill printed text, re-set clean typography, and extract 10 cup bounding boxes into `src/brand/card-back.json`.
- **Photo Hero Integration**: Added `scripts/build-hero.mjs` and `LogoOnPhoto` component to cleanly position vector logos over official café window photography (`design/photo-source/hero-himpil.webp`).
- **Interactive 3D Card Stack**: Added `src/components/loyalty/CardStack.tsx` on `/rewards` to browse current and past completed loyalty cards using touch drag and keyboard navigation.
- **Cultural Design Polish**: Refined Baybayin glyphs per route, integrated Sawali woven-bamboo background patterns, and enhanced status bar tinting across mobile devices.

### Fixed
- Typographical errors on the printed physical card ("Sip Up Coffee") corrected in live re-rendered text.

---

## Commit `47611b9` — "Fixed logo"

### Changed
- Traced official logo mark and typography from café photography into `src/brand/logo-official.json`.
- Updated `Logo.tsx` and regenerated favicon and PWA icons using `scripts/generate-brand.mjs`.

---

## Commit `4f490c6` — "initial draft"

### Added
- Initial project creation with React 19, TypeScript, Tailwind CSS v4, and React Router.
- Built dual-mode service architecture (`LoyaltyService`, `DemoService`, `SupabaseService`).
- Created initial database migration `supabase/migrations/0001_himpil_loyalty.sql` with RLS, staff verification RPCs, and activity view.
- Implemented Barista Console (`/staff`) with optical QR scanning and manual member code lookup.

