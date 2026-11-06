# AGENT OPERATING MANUAL: HIMPIL LOYALTY CARD

> **Primary entry point for AI software engineers.**
> Read this document first before inspecting the codebase or making any code modifications.

---

## 1. Project Identity & Problem Solved

**Himpil — Virtual Loyalty Card** is a mobile-first Progressive Web Application (PWA) and responsive web application for **Himpil Coffee**, an artisanal coffee shop brand rooted in Filipino culture.

- **Core Proposition**: "Buy 9, Get 1 Free". Customers buy 9 coffee drinks, collect stamps on their virtual card, and receive their 10th cup free.
- **The Problem It Solves**: Eliminates physical paper punch-card loss, prevents stamp fraud, and avoids customer friction at the checkout counter without requiring an App Store download.
- **Key Innovation**: Direct high-fidelity digitization of physical printed loyalty cards (`CardArt.tsx`) with pixel-mapped stamp reveals (`card-back.json`), paired with a zero-trust database security model where only verified staff can award stamps or redeem rewards.

---

## 2. Current State & Tech Stack

The application is in active production-ready development, fully implemented with:
- Complete customer flows (Sign in, view card, flip 3D card, show QR code, review activity history, browse 3D card stack on rewards, edit profile).
- Complete staff flows (Barista console at `/staff`, camera QR scanner, manual member code lookup, drink selection, stamp awarding, reward redemption).
- Dual-mode architecture (Default zero-config in-browser Demo Mode, and live Supabase Postgres + RLS Mode).

### Technology Stack & Runtime
- **Runtime & Language**: Node 20+ (developed on Node 24), TypeScript 5.8+ (`typescript` 7.0.2), Strict Mode.
- **Frontend Framework**: React 19 (`react` 19.3.1, `react-dom` 19.3.1).
- **Routing**: React Router 7 (`react-router-dom` 7.18.4) with lazy loading and route guarding.
- **Styling**: Tailwind CSS v4 (`tailwindcss` 4.3.3, `@tailwindcss/vite` 4.3.3) using in-CSS `@theme` declarations.
- **PWA & Offline**: `vite-plugin-pwa` 2.0.0 with Workbox service worker caching.
- **Database & Auth**: Supabase (`@supabase/supabase-js` 2.118.0), PostgreSQL 15+ with RLS, triggers, Realtime WAL replication, and `SECURITY DEFINER` RPCs.
- **Icons & Visuals**: `lucide-react` 1.60.0, `qrcode.react` 4.2.0, `qr-scanner` 1.4.2.
- **Typography**: `@fontsource-variable/playfair-display`, `@fontsource-variable/inter`, `@fontsource/noto-sans-tagalog` (Baybayin script).

---

## 3. High-Level Architecture & Data Flow

```
User Action (Customer or Barista)
  ↓
Presentation Layer (src/pages/*, src/components/*)
  ↓
Context State Layer (AuthContext, LoyaltyContext, ToastContext)
  ↓
Service Layer (src/data/service.ts: LoyaltyService interface)
  ↓
Runtime Implementation (src/data/index.ts)
  ├── Demo Mode (src/data/demoService.ts) → localStorage ('himpil-demo-v2') + StorageEvents
  └── Live Mode (src/data/supabaseService.ts) → Supabase Auth & PostgreSQL
        ↓
PostgreSQL Engine (supabase/migrations/0001_himpil_loyalty.sql)
  ├── Row Level Security (RLS) → Customers READ own records only
  ├── Revoked Write Privileges → Direct table INSERT/UPDATE/DELETE forbidden
  └── SECURITY DEFINER Stored Procedures → staff_award_stamps, staff_redeem_reward
```

---

## 4. Repository Map

```text
├── agent.md                        # THIS FILE: Primary AI operating manual
├── docs/                           # Living Second Brain (detailed system knowledge)
│   ├── project-overview.md         # Problem solved, customer journey, brand pillars
│   ├── architecture.md             # System topology, data flow, trust boundaries, PWA caching
│   ├── codebase-map.md             # File-by-file directory map with dependencies and cautions
│   ├── conventions.md              # Coding standards, Tailwind tokens, TypeScript rules
│   ├── development.md              # Setup, running, testing, npm scripts, asset pipelines
│   ├── database/
│   │   ├── schema.md               # Table definitions, constraints, triggers, functions
│   │   └── security-model-rls.md   # Zero-trust posture, RLS policies, staff verification
│   ├── features/
│   │   ├── loyalty-card.md         # 3D FlipCard, CardArt, clip-path stamp reveals
│   │   ├── stamp-collection.md     # Customer QR, WakeLock, Barista scanner, cooldown
│   │   ├── rewards-and-redemption.md # 9-cup rule, 3D CardStack, menu, redemption flow
│   │   ├── staff-console.md        # /staff interface, idempotency, barista authorization
│   │   └── member-auth-profile.md  # Auth flow, auto-provisioning, profile editing
│   ├── integrations/
│   │   ├── supabase.md             # Client options, Realtime, RPC error translation
│   │   └── demo-mode.md            # In-browser state, seed data, multi-tab sync
│   ├── decisions/                  # Architectural Decision Records (ADRs)
│   │   ├── 0001-dual-data-service-architecture.md
│   │   ├── 0002-staff-only-security-definer-mutations.md
│   │   ├── 0003-client-idempotency-and-anti-fraud.md
│   │   ├── 0004-digitized-physical-card-rendering.md
│   │   └── 0005-tailwind-v4-and-cultural-design-tokens.md
│   ├── troubleshooting.md          # Diagnosing scanner, Supabase errors, Realtime sync
│   ├── known-issues.md             # Technical debt, limitations, placeholder assets
│   └── changelog.md                # Project milestone history
├── public/brand/                   # Digitized card art (card-front, card-back, card-back-filled)
├── scripts/                        # Asset build pipelines (build-card-art.mjs, generate-brand.mjs)
├── src/
│   ├── brand/                      # Static JSON assets (card-back.json coordinates, logo paths)
│   ├── components/                 # UI, layout, brand, and loyalty components
│   ├── context/                    # AuthContext, LoyaltyContext, ToastContext
│   ├── data/                       # Service interface, DemoService, SupabaseService
│   ├── lib/                        # Domain logic (loyalty rules, types, formatters, drinks)
│   └── pages/                      # Routed views (Home, MyCard, Scan, Rewards, Activity, Profile, Staff, Auth)
└── supabase/migrations/            # Canonical database schema & migrations
```

---

## 5. Critical Files to Inspect Before Modifying Subsystems

| Subsystem | Primary Files to Inspect |
|---|---|
| **Loyalty Business Rules** | `src/lib/loyalty.ts`, `src/lib/types.ts` |
| **Backend Interface & Data** | `src/data/service.ts`, `src/data/index.ts`, `src/data/demoService.ts`, `src/data/supabaseService.ts` |
| **Database & Security** | `supabase/migrations/0001_himpil_loyalty.sql`, `docs/database/security-model-rls.md` |
| **Card Rendering & Graphics** | `src/components/loyalty/FlipCard.tsx`, `src/components/loyalty/CardArt.tsx`, `src/brand/card-back.json` |
| **Staff & Barista Scanner** | `src/pages/Staff.tsx`, `src/lib/loyalty.ts` (`parseMemberCode`) |
| **Customer QR Code** | `src/pages/Scan.tsx`, `src/components/loyalty/QrPanel.tsx` |
| **Rewards & 3D Card Stack** | `src/pages/Rewards.tsx`, `src/components/loyalty/CardStack.tsx` |
| **Styling & Design System** | `src/index.css`, `src/components/brand/Backdrop.tsx` |

---

## 6. Non-Negotiable Invariants ("Do Not Break")

1. **Card Rules**: Exactly 9 purchases unlock the 10th free cup (`STAMPS_PER_REWARD = 9`, `CARD_SLOTS = 10`). Never change this rule without updating database check constraints, service logic, and card art.
2. **Zero-Trust Writes**: Customers must **never** be allowed to write directly to `loyalty_accounts`, `stamp_transactions`, or `reward_redemptions`. All modifications must execute via `SECURITY DEFINER` procedures checking `public.assert_staff()`.
3. **Dual-Mode Parity**: Any new method added to `LoyaltyService` **must** be implemented in both `DemoService` and `SupabaseService`. Breaking Demo Mode breaks zero-config evaluation.
4. **Idempotency & Concurrency**: All staff mutations must provide a client-generated UUID `request_id`, acquire a `FOR UPDATE` lock on `loyalty_accounts`, and enforce the 10-second rapid-fire cooldown.
5. **Single Redemption Constraint**: A completed card cycle can only be redeemed once. The database constraint `UNIQUE (account_id, cycle)` in `reward_redemptions` must remain intact.
6. **QR Payload Structure**: The QR code must only contain `himpil:member:HMP-XXXX-XXXX`. It must never hold auth tokens or grant permissions on its own.
7. **PWA Cache Invariant**: `navigateFallbackDenylist` in `vite.config.ts` must deny `/auth` and `/rest`. Loyalty card balances must never be served from stale Service Worker cache.
8. **Tailwind v4 Setup**: Theme variables live in `src/index.css` under `@theme`. Do not introduce a `tailwind.config.js`.

---

## 7. Knowledge Hierarchy & Source of Truth

When encountering conflicting information, adhere strictly to this hierarchy:

```text
Source Code & Migrations (Ultimate Behavioral Truth)
    ↑
docs/ (System Reasoning, Contracts, and Architecture Context)
    ↑
agent.md (Navigation, Orientation, and Rules of Engagement)
```

- If code contradicts documentation: **The code is the truth.** Update the documentation immediately to eliminate the discrepancy.
- If documentation describes planned or non-existent behavior: **Verify against the code before assuming it exists.**

---

## 8. Agent Memory Rules

1. **Read Before Changing**: Always read the corresponding `docs/` file before touching a subsystem.
2. **Verify Against Code**: Never guess file paths, API contracts, or table columns. Check the actual files.
3. **Keep the Second Brain Current**: If you alter an architectural pattern, database contract, or business rule, immediately update `agent.md` and the relevant `docs/` files.
4. **Don't Overdocument**: Document architectural patterns, security assumptions, non-obvious traps, and system relationships. Do not document trivial one-line UI adjustments.
5. **Capture Decisions**: Record meaningful architectural or technological choices in `docs/decisions/` following the established ADR format.
6. **Capture Gotchas**: If you encounter an edge case or brittle behavior, add it to `docs/troubleshooting.md` or `docs/known-issues.md`.
7. **Never Invent Memory**: If historical reasoning or business intent is unknown, explicitly state: *"Historical reasoning is unknown."* Never fabricate project history.

---

## 9. Documentation Maintenance Protocol

### When You MUST Update Documentation
- Introducing or altering a database table, column, trigger, or RPC (`docs/database/schema.md`).
- Changing security policies, permissions, or RLS (`docs/database/security-model-rls.md`).
- Adding, altering, or removing methods from `LoyaltyService` (`docs/architecture.md`, `docs/codebase-map.md`).
- Modifying card math, stamp limits, or redemption flow (`docs/features/`).
- Adding or altering environment variables (`docs/integrations/supabase.md`).
- Making significant architectural choices (`docs/decisions/`).
- Completing a milestone or meaningful subsystem change (`docs/changelog.md`).

### When Documentation Updates Are NOT Required
- Trivial typo fixes or comment adjustments.
- Minor color shade or padding tweaks.
- Internal refactoring within a component that does not alter its public interface or system contract.

---

## 10. Agent Standard Operating Workflow

When given a coding task in this repository, follow this 10-step protocol:

```text
1. Read agent.md for orientation.
2. Locate the relevant subsystem in the Repository Map.
3. Read the associated document in docs/ (e.g. docs/features/loyalty-card.md).
4. Inspect the actual source code and types.
5. Identify dependencies and side effects (check dual-mode service parity).
6. Implement the smallest, cleanest, type-safe change.
7. Verify TypeScript compilation: npm run typecheck (or tsc --noEmit -p .).
8. Verify runtime behavior (test both Demo Mode and live contracts).
9. Update docs/ if architectural knowledge, schemas, or behaviors changed.
10. Summarize your changes clearly with concrete file references.
```

