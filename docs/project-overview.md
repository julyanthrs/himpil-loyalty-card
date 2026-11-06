# Project Overview

> Read this document when onboarding to the project, understanding business context, customer journey, brand pillars, or project scope.

---

## 1. Executive Summary

**Himpil — Virtual Loyalty Card** is a mobile-first Progressive Web Application (PWA) and responsive web application designed for **Himpil Coffee**, an artisanal coffee shop brand rooted in Filipino culture.

The core business proposition is a classic punch-card loyalty model: **"Buy 9, Get 1 Free"**.
- A customer buys coffee drinks and collects digital stamps on their virtual loyalty card.
- Collecting 9 stamps unlocks the 10th cup for free.
- Once redeemed by a barista, a new card cycle begins, and the completed card is archived into the customer's permanent reward history stack.

---

## 2. Problem Solved

Physical paper loyalty punch cards suffer from:
1. Frequent loss, water damage, or forgetting the card at home.
2. Fraud vulnerabilities (unauthorized stamping or punch imitation).
3. Zero customer insight or persistent relationship between the café and patron.
4. Friction at checkout when baristas have to physically punch or stamp paper.

Himpil solves this by providing:
- A frictionless web-based card accessible from any smartphone browser without requiring an app store download.
- Installable PWA capability (runs full-screen with offline asset caching and status bar styling).
- Cryptographically verifiable customer identification using high-contrast QR codes (`himpil:member:HMP-XXXX-XXXX`).
- Zero-trust staff mutations: customers cannot award themselves stamps; only authenticated staff accounts executing server-side transactional RPCs can modify stamp counts.
- Seamless dual-mode execution: an instantaneous browser-based demo mode for testing and evaluation without any backend setup, alongside an enterprise-grade Supabase Postgres + RLS live mode.

---

## 3. Customer & Staff Journeys

### Customer Journey
```
1. Access App (PWA / Browser)
   ↓
2. View Loyalty Card (Front artwork, flip to stamp back, progress indicator)
   ↓
3. Tap "Scan" or Home QR preview at counter
   ↓
4. Show QR Code to Barista (Screen Wake Lock active)
   ↓
5. Barista awards stamp → Realtime animation pops new cup on customer screen
   ↓
6. Reach 9/9 stamps → Free Drink unlocked
   ↓
7. Barista redeems reward → New card cycle starts (Cycle n+1), prior card archived in Rewards stack
```

### Barista Journey
```
1. Open Barista Console (/staff)
   ↓
2. Camera Scan customer QR (or manual entry of HMP-XXXX-XXXX)
   ↓
3. View Customer Summary (Name, Member Code, Cycle, Current Stamps)
   ↓
4. Select Drink and Stamp Quantity (constrained by remaining card slots)
   ↓
5. Press "Add Stamp(s)" → Atomic server RPC executes with idempotency key
   ↓
6. If 9 stamps completed → Press "Redeem Free Drink" with 2-step confirmation
```

---

## 4. Brand & Cultural Identity System

The brand identity is inspired by Philippine cultural heritage and artisanal coffee traditions:

| Cultural Anchor | Implementation in App | Asset / Code Reference |
|---|---|---|
| **Himpil (Himpilan)** | Meaning "a stopping place, a pause along the journey". Forms the thematic foundation for café hospitality. | `src/components/brand/Backdrop.tsx` |
| **Sawali Texture** | Faint woven-bamboo wall texture placed across body backgrounds, reminiscent of a traditional *bahay kubo*. | `public/brand/sawali.svg`, `src/index.css` |
| **Baybayin Script** | Each route has a distinct Baybayin word spelled with the modern krus-kudlit (U+1714) for final consonants, rendered in *Noto Sans Tagalog*. | `src/components/brand/Backdrop.tsx`, `src/main.tsx` |
| **Engraved Botanicals** | Coffee branch line-art in top corners and card containers derived from the café branding kit. | `src/components/brand/Botanical.tsx` |
| **Original Card Art** | Direct digitization of physical print cards (`card-front.jpg`, `card-back.jpg`), with live text re-setting and pixel-mapped stamp reveals. | `design/card-source/`, `scripts/build-card-art.mjs`, `src/components/loyalty/CardArt.tsx` |
| **Official Hero Photo** | Coffee shop window scene with in-situ vector logo placement (`LogoOnPhoto`) matching exact photo geometry. | `design/photo-source/hero-himpil.webp`, `scripts/build-hero.mjs`, `src/components/brand/Logo.tsx` |

### Route-Level Baybayin Signatures
- `/` (Home) → **ᜑᜒᜋ᜔ᜉᜒᜎᜈ᜔** (*himpilan* — stopping place)
- `/card` (My Card) → **ᜃᜉᜒ** (*kape* — coffee)
- `/rewards` (Rewards) → **ᜄᜈ᜔ᜆᜒᜋ᜔ᜉᜎ** (*gantimpala* — reward)
- `/activity` (Activity) → **ᜀᜎᜀᜎ** (*alaala* — memory)
- `/profile` (Profile) → **ᜃᜁᜊᜒᜄᜈ᜔** (*kaibigan* — friend)
- `/scan` (Scan) → **ᜐᜎᜋᜆ᜔** (*salamat* — thank you)
- `/login` & `/register` → **ᜋᜊᜓᜑᜌ᜔** (*mabuhay* — welcome)
- `/staff` (Console) → **ᜆᜒᜋ᜔ᜉ᜔ᜎ** (*timpla* — the brew)

---

## 5. Dual Execution Modes

The application runs seamlessly in two distinct environments determined exclusively by environment variables:

```
VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY present?
  ├── YES → Live Mode (SupabaseService)
  └── NO  → Demo Mode (DemoService)
```

1. **Demo Mode (Default)**:
   - Zero-configuration sandbox.
   - Initialized with sample member **Alex Rivera** (7/9 stamps on Cycle 4, 3 completed historical cards).
   - Stored in browser `localStorage` (with graceful in-memory fallback).
   - Real-time cross-tab synchronization via `window.dispatchEvent` and `StorageEvent`.
   - Accessible barista console at `/staff` for anyone testing the flow.
   - Clearly labeled with demo banners and a "Reset demo data" control in Profile.

2. **Live Mode (Supabase)**:
   - Full production architecture using Supabase Auth and Postgres.
   - Row-Level Security (RLS) restricts read/write permissions.
   - Barista console restricted to users with active role entries in `public.staff_roles`.
   - Real-time updates delivered via Supabase Realtime WebSocket subscriptions on `loyalty_accounts`.

