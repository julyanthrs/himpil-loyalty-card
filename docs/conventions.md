# Development Conventions

> Read this document before writing new code, refactoring existing modules, creating components, styling UI, or adding database logic.

---

## 1. Architectural & Abstraction Principles

### Never Bypass the Service Layer
- **Rule**: React components must **never** import `@supabase/supabase-js` or make raw database/API calls.
- **Enforcement**: All backend interactions must be defined in the `LoyaltyService` interface (`src/data/service.ts`) and invoked through `service` exported from `src/data/index.ts`.
- **Dual Implementation Requirement**: When a new method is added to `LoyaltyService`, it **must** be implemented in both:
  1. `src/data/demoService.ts` (for local zero-dependency testing).
  2. `src/data/supabaseService.ts` (for production Supabase execution).

### State Isolation & Scoping
- Global loyalty state belongs in `LoyaltyContext`.
- When an account logs out or switches, `App.tsx` resets context using `<LoyaltyProvider key={user.id}>`.
- Ephemeral UI states (e.g. card flip status, modal open, scanner camera status) must remain local to their components.

---

## 2. TypeScript & Type Safety

- **Strict Type Checking**: TypeScript `strict` mode is enabled in `tsconfig.json`. Code must compile clean with zero `any` types.
- **Centralized Data Models**: Shared entities (`LoyaltyAccount`, `Profile`, `ActivityItem`, `StaffCustomerView`) must live in `src/lib/types.ts`.
- **Typed Errors**: Throw and catch `LoyaltyError` with explicit `LoyaltyErrorCode`. Avoid generic `new Error('...')` without error code categorization.
- **Path Imports**: Use relative imports (`../lib/types`) reflecting the exact file tree.

---

## 3. Styling & Tailwind CSS v4 Conventions

The codebase uses **Tailwind CSS v4** via `@tailwindcss/vite`. There is no `tailwind.config.js`.

### Color Tokens
Always use the semantic theme variables defined in `src/index.css`:

| Token | Hex | Usage |
|---|---|---|
| `bg-cream` / `text-cream` | `#F6EFE4` | Primary app background, light text on dark surfaces |
| `bg-ivory` / `text-ivory` | `#FAF5ED` | Panel containers, active modal surfaces |
| `bg-espresso` / `text-espresso` | `#3E2416` | Primary headings, dark buttons, dark status bar bands |
| `bg-mocha` / `text-mocha` | `#6B4A32` | Secondary headers, icon accents, focused borders |
| `bg-roasted` / `text-roasted` | `#A17B5B` | Faint botanicals, borders, watermark text |
| `bg-latte` / `text-latte` | `#DCC9AE` | Card outlines, dividers, inactive progress segments |
| `bg-bean` | `#4A2B1B` | Loyalty card preview surface with bean engraving |
| `text-ink` | `#2B1910` | High-contrast body prose |
| `text-subtle` | `#8A6D57` | Muted secondary text, captions, date stamps |
| `text-success` / `bg-success` | `#4F6B3A` | Positive affirmations, status tags |
| `text-danger` / `bg-danger` | `#9A3B2A` | Reversible actions, logout, error states |

### Utility Classes
- `.bean-surface`: Used on cards requiring the dark bean texture overlay.
- `.label-caps`: Upper-cased tracked headers (`text-[0.68rem] font-medium tracking-[0.22em] uppercase text-subtle`).
- `.pb-safe-nav`: Adds padding at the bottom of pages to account for the floating mobile bottom nav (`padding-bottom: calc(6.5rem + env(safe-area-inset-bottom))`).

### Typography Pairing
- Headings (`h1`, `h2`, `h3`): Serif font (`font-serif`, 'Playfair Display Variable').
- Body & Labels: Sans font (`font-sans`, 'Inter Variable').
- Baybayin glyphs: Tagalog font (`font-baybayin`, 'Noto Sans Tagalog').

---

## 4. React 19 & Component Patterns

- **Component Signatures**: Prefer standard functional components with TypeScript props interfaces:
  ```tsx
  interface Props {
    stamps: number;
    flipped: boolean;
    onFlip: () => void;
  }
  export function FlipCard({ stamps, flipped, onFlip }: Props) { ... }
  ```
- **Lazy Loading**: Route-level pages are loaded lazily via `lazy(() => import('./pages/...'))` in `src/App.tsx` and wrapped in `<Suspense fallback={<Splash />}>`.
- **Accessibility (a11y)**:
  - All icon buttons must provide `aria-label`.
  - Decorative icons must have `aria-hidden`.
  - Dynamic status changes (toasts, stamp counts) must use `aria-live="polite"` or `role="status"`.
  - Error messages must use `role="alert"`.
  - Interactive switches must use `role="switch"` and `aria-checked`.

---

## 5. Cultural & Brand Assets Integrity

- **Baybayin Spelling**: All Baybayin text must use correct Unicode characters with modern krus-kudlit (`U+1714`) for final consonant cancellation (e.g. `ᜑᜒᜋ᜔ᜉᜒᜎᜈ᜔` for *himpilan*). Always tag elements with `lang="tl-Tglg"`.
- **Card Artwork Processing**: Never modify `public/brand/card-*.webp` by hand. Always run `node scripts/build-card-art.mjs` to keep `src/brand/card-back.json` synchronized with pixel bounding boxes.
- **Logo Integrity**: Vector paths are preserved in `src/brand/logo-official.json`. Always run `npm run brand` if the logo mark updates to re-render all app icons.

