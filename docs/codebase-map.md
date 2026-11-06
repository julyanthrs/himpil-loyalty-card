# Codebase Map

> Read this document when locating where specific functionality lives, understanding component boundaries, and checking file dependencies.

---

## 1. Directory Tree Overview

```
himpil-loyalty-card/
├── .claude/
│   └── launch.json                # VS Code / IDE debugger launch configuration
├── design/
│   ├── card-source/               # Original physical card scans (front and back)
│   ├── photo-source/              # Original café window photo
│   └── reference-mockup.webp      # Design reference specification
├── public/
│   ├── brand/                     # Digitized card art (card-front, card-back, card-back-filled) & textures
│   ├── icons/                     # Generated PWA manifest icons (192, 512, maskable)
│   ├── images/                    # Hero imagery and drink menu photography
│   ├── apple-touch-icon.png       # iOS home-screen icon
│   └── favicon.svg                # Browser tab vector icon
├── scripts/
│   ├── build-card-art.mjs         # Digitizes physical card scans into webp + extracts cup coordinates
│   ├── build-hero.mjs             # Inpaints photo hero background to allow dynamic vector logo placement
│   ├── extract-logo.mjs           # Traces vector paths from photo into logo-official.json
│   ├── fetch-images.mjs           # Downloads placeholder menu imagery
│   ├── generate-brand.mjs         # Generates bean-pattern.svg and app icons from logo
│   └── lib/photo-logo.mjs         # Geometry calculations for logo perspective mapping
├── src/
│   ├── brand/                     # Static JSON asset definitions (logo paths, card cup bounding boxes)
│   ├── components/
│   │   ├── brand/                 # Cultural design components (Logo, Backdrop, Botanical, CupStamp)
│   │   ├── layout/                # AppShell, NotificationsMenu, navigation bars
│   │   ├── loyalty/               # FlipCard, CardArt, CardStack, CardPreview, QrPanel, StampGrid, ActivityList
│   │   └── ui/                    # Base primitives: Button, Panel, ProgressSegments, Avatar, Toggle, PageHeader
│   ├── context/                   # React Contexts: AuthContext, LoyaltyContext, ToastContext
│   ├── data/                      # Backend interface and implementations (service, demoService, supabaseService)
│   ├── lib/                       # Domain models, business rules, drinks menu, formatting utilities
│   ├── pages/                     # Routed view components: Home, MyCard, Scan, Rewards, Activity, Profile, Staff, Auth
│   ├── App.tsx                    # Route definitions, Suspense fallbacks, Auth guarding
│   ├── index.css                  # Tailwind CSS v4 directives, @theme tokens, animations, flip card 3D styles
│   └── main.tsx                   # React root entry, PWA service worker registration, font loading
├── supabase/
│   └── migrations/
│       └── 0001_himpil_loyalty.sql # Canonical Postgres schema, RLS policies, staff RPCs, triggers
├── .env.example                   # Supabase environment variable template
├── index.html                     # HTML shell, PWA meta tags, font preload hints
├── package.json                   # Dependencies, scripts, package metadata
├── tsconfig.json                  # TypeScript compiler options
└── vite.config.ts                 # Vite bundler, Tailwind plugin, PWA Workbox configuration
```

---

## 2. Critical Files Deep-Dive

### Application Core & Routing

#### `src/App.tsx`
- **Purpose**: Root application component declaring the client-side routing structure.
- **Used by**: `src/main.tsx`.
- **Dependencies**: `react-router-dom`, `src/context/AuthContext`, `src/context/LoyaltyContext`, `src/context/ToastContext`, lazy-loaded page modules.
- **Important Behavior**:
  - Enforces `RequireAuth` boundary around customer routes (`/`, `/card`, `/scan`, `/rewards`, `/activity`, `/profile`).
  - When user is authenticated, mounts `LoyaltyProvider` keyed by `user.id` (`<LoyaltyProvider key={user.id}>`). This guarantees all loyalty state cleanly resets when switching accounts.
  - `/staff`, `/login`, and `/register` sit outside the customer `AppShell`.
- **Caution**: Do not remove `key={user.id}` from `LoyaltyProvider`, or loyalty state will leak across account switches.

#### `src/index.css`
- **Purpose**: Defines Tailwind CSS v4 design system tokens, 3D flip-card transforms, and global styling.
- **Used by**: `src/main.tsx`.
- **Important Behavior**:
  - Sets custom `@theme` variables: `--color-espresso`, `--color-mocha`, `--color-roasted`, `--color-latte`, `--color-cream`, `--color-ivory`, `--color-bean`, `--color-ink`, `--color-subtle`, `--color-success`, `--color-danger`.
  - Configures `@keyframes stamp-pop` for stamp collection bounce animations.
  - Provides `.flip-scene`, `.flip-inner`, and `.flip-face` with `transform-style: preserve-3d` and `backface-visibility: hidden` for 3D card flips. Includes `@media (prefers-reduced-motion: reduce)` accessible fallbacks.
- **Caution**: Uses Tailwind CSS v4 `@theme` syntax instead of legacy `tailwind.config.js`. Do not create a `tailwind.config.js` file.

---

### Data & Backend Service Layer

#### `src/data/service.ts`
- **Purpose**: Declares the `LoyaltyService` TypeScript interface that acts as the contract for all backend operations.
- **Used by**: `src/data/index.ts`, `src/data/demoService.ts`, `src/data/supabaseService.ts`, all contexts and pages.
- **Key Methods**:
  - `getSession()`, `onAuthChange()`, `signIn()`, `signUp()`, `signOut()`
  - `getProfile()`, `updateProfile()`
  - `getAccount()`, `getActivity()`, `subscribe()`
  - `isStaff()`, `staffLookup()`, `staffAwardStamps()`, `staffRedeemReward()`
- **Caution**: Any new backend capability must be added to this interface and implemented in **both** `DemoService` and `SupabaseService`.

#### `src/data/index.ts`
- **Purpose**: Singleton factory exporting the active `LoyaltyService` instance and `isDemo` boolean.
- **Used by**: Throughout application where service calls are made.
- **Logic**: Inspects `import.meta.env.VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. If both are populated, instantiates `SupabaseService`; otherwise falls back to `DemoService`.

#### `src/data/demoService.ts`
- **Purpose**: Complete in-browser mock implementation of `LoyaltyService`.
- **Key Behavior**:
  - Persists state under `himpil-demo-v2` in `localStorage`.
  - Dispatches `himpil-demo-change` and listens to `storage` events so multiple tabs (e.g. `/scan` and `/staff`) stay in sync.
  - Includes sample customer "Alex Rivera" (`HMP-7Q4K-2MXD`) with 7 stamps and 3 past redeemed cards.
  - Replicates backend error conditions (`NOT_FOUND`, `REWARD_PENDING`, `EXCEEDS_CARD`, `COOLDOWN`, `REWARD_LOCKED`).
- **Caution**: Does not enforce actual security; passwords are intentionally bypassed in demo mode.

#### `src/data/supabaseService.ts`
- **Purpose**: Production implementation connecting to Supabase Auth, PostgreSQL, Realtime, and RPCs.
- **Key Behavior**:
  - Maps Postgres errors and RPC exceptions to strongly typed `LoyaltyError` codes.
  - Subscribes to Supabase Realtime channel `loyalty-${user.id}` on table `loyalty_accounts`.
  - Executes RPCs via `this.db.rpc(...)`.

---

### Context Layer

#### `src/context/LoyaltyContext.tsx`
- **Purpose**: Supplies profile, account, activity history, and real-time event triggers to the application.
- **Key Behavior**:
  - `refresh()` compares `totalStamps` and `totalRedeemed` against a persistent ref (`prev.current`).
  - When `totalStamps` increases, sets `lastEvent` with `{ type: 'stamp' | 'unlocked', stampIndex }` and fires a toast.
  - Re-fetches data on window focus (`visibilitychange`) as a fallback if the phone slept through a WebSocket message.

#### `src/context/AuthContext.tsx`
- **Purpose**: Provides current `user: SessionUser | null` and initialization state `ready: boolean`.
- **Key Behavior**: Listens to `service.onAuthChange` and triggers component re-renders on sign-in or sign-out.

#### `src/context/ToastContext.tsx`
- **Purpose**: Global transient toast notification stack (`success`, `error`, `info`).

---

### Domain Logic & Utilities

#### `src/lib/loyalty.ts`
- **Purpose**: Defines core business rules, QR formatting, and card stacking mathematics.
- **Key Constants & Functions**:
  - `STAMPS_PER_REWARD = 9`: 9 purchases unlock the free 10th cup.
  - `CARD_SLOTS = 10`: Total slots visually displayed on cards.
  - `QR_PREFIX = 'himpil:member:'`: Prefix prepended to QR payloads.
  - `parseMemberCode(input)`: Validates and normalizes codes against `^HMP-[A-Z0-9]{4}-[A-Z0-9]{4}$`.
  - `stackedCards(account, activity)`: Groups the activity log by cycle to construct the card deck for the Rewards page without needing extra database tables.

#### `src/lib/types.ts`
- **Purpose**: Single source of truth for all domain entities, DTOs, and error codes.

#### `src/lib/drinks.ts`
- **Purpose**: Menu list and image mapping for drinks served at Himpil.
- **Items**: Caffè Latte, Spanish Latte, Cappuccino, Flat White, Americano, Iced Americano, Iced Coffee, Espresso.

---

### Presentation & Loyalty UI

#### `src/components/loyalty/FlipCard.tsx` & `CardArt.tsx`
- **Purpose**: Renders the 3D flippable digital card and stamp visualizations.
- **Key Behavior**:
  - `CardFrontArt`: Renders the original front artwork overlaying "Buy 9, Get 1 Free".
  - `CardBackArt`: Renders `card-back.webp` with live typography for the explanation paragraph.
  - Stamp rendering: Uses coordinates from `src/brand/card-back.json` to overlay `card-back-filled.webp` clipped via CSS `clipPath: inset(...)`.
  - When a stamp is newly added, triggers CSS class `animate-stamp-pop`.

#### `src/components/loyalty/CardStack.tsx`
- **Purpose**: Interactive swipeable 3D deck of current and historical completed loyalty cards on `/rewards`.
- **Key Behavior**: Implements pointer drag gestures, throwing animations, keyboard arrows, and rubber-banding.

#### `src/components/loyalty/QrPanel.tsx`
- **Purpose**: Displays the customer's QR code (`qrcode.react`) with decorative coffee-bean outlines.
- **Payload**: Contains only `himpil:member:HMP-XXXX-XXXX`.

#### `src/pages/Staff.tsx`
- **Purpose**: Barista console for camera scanning, manual lookup, awarding stamps, and redeeming rewards.
- **Key Behavior**:
  - Integrates `qr-scanner` library for live camera feed decoding.
  - Maintains `requestId.current` per action to ensure retry idempotency.
  - Enforces two-step confirmation before executing reward redemptions.

