# Himpil — Virtual Loyalty Card

Responsive web app (and installable PWA) for the Himpil coffee loyalty program: **Buy 9, get 1 free.**
React + TypeScript + Tailwind CSS v4 + React Router + Lucide, with Supabase for auth and data.

Customer journey: **Open Himpil → View loyalty card → Show QR code → Barista adds stamp → Redeem free coffee.**

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build (with service worker)
```

## Demo mode vs. live mode

| | Demo mode (default) | Live mode |
|---|---|---|
| Enabled when | `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` are empty | both are set in `.env` |
| Data | Sample member "Alex Rivera" (7/9 stamps), stored in this browser only | Supabase Postgres |
| Labeling | Notice on the sign-in and register pages; "demo card" and "Reset demo data" on Profile | none |
| Barista console | Open to anyone at `/staff` (to try the flow) | Only users in `staff_roles` |

Demo tip: open `/scan` in one tab and `/staff` in another (or Profile → Open console). Stamps added in the console appear on the customer's card live.

## Going live with Supabase

1. Create a Supabase project and copy `.env.example` to `.env` with the project URL and anon key.
2. In the SQL editor, run [`supabase/migrations/0001_himpil_loyalty.sql`](supabase/migrations/0001_himpil_loyalty.sql).
3. Under Authentication → URL configuration, set the Site URL to where the app is hosted.
4. Make a barista: have them register normally, then run
   ```sql
   insert into public.staff_roles (user_id, role)
   select id, 'barista' from auth.users where email = 'barista@himpil.example';
   ```

### Security model

- Customers can only **read** their own profile, card, transactions and redemptions (Row Level Security).
- Customers can only update their name and notification settings (column-level grants).
- Stamps and redemptions change **only** through `staff_award_stamps` / `staff_redeem_reward`. These are `SECURITY DEFINER` functions that check `staff_roles` first.
- Duplicate protection: each console action sends a unique `request_id` (retries are idempotent), rows are locked during updates, a 10-second cooldown blocks accidental double scans, and `unique (account_id, cycle)` makes each reward redeemable exactly once.
- The QR code holds only the member code (`himpil:member:HMP-XXXX-XXXX`). Scanning it identifies the card and grants nothing by itself.

## Project map

```
src/
  brand/logo-official.json official logo paths, traced from the hero photo (used by Logo.tsx and the icon generator)
  components/brand/        Logo, CupStamp (card cups), Botanical (coffee-branch line art)
  components/loyalty/      CardPreview, FlipCard, StampGrid, QrPanel, ActivityList
  components/layout/       AppShell (floating top nav + mobile bottom nav), notifications
  context/                 Auth, Loyalty (live updates + stamp toasts), Toast
  data/                    LoyaltyService interface + DemoService + SupabaseService
  lib/loyalty.ts           program rules (9 stamps → free 10th), messages, QR parsing
  pages/                   Home, MyCard, Scan, Rewards, Activity, Profile, Auth, Staff
supabase/migrations/       schema, RLS, staff RPCs
scripts/                   generate-brand.mjs (bean pattern + app icons), fetch-images.mjs
design/reference-mockup.webp
```

## Loyalty card artwork

The card on the Loyalty Card page uses the **original card files** in `design/card-source/` (front and back).
`node scripts/build-card-art.mjs` turns them into `public/brand/card-*.webp`:

- the front is used as is, with the app's "Buy 9, Get 1 Free" line set on top;
- the back's printed paragraph is replaced by matching bean engraving and re-set as live text (typos fixed, and "Sip Up Coffee" changed to "Himpil");
- a filled-in copy of the back is made; each collected stamp reveals one filled cup over the original drawing.

Re-run the script if the card artwork changes.

## Home hero photo

The hero uses Himpil's own photo, `design/photo-source/hero-himpil.webp`. `node scripts/build-hero.mjs` removes the logo printed on it (filling from the surrounding blurred background) and writes `public/images/hero-himpil*.webp`. The hero then draws the vector logo back in the same spot and printed color (`LogoOnPhoto`). It stays crisp and follows the photo's crop at every screen size.

## Logo

The logo (mark, "himpil" wordmark, Baybayin line) is the **official artwork**, traced from the photo by `node scripts/extract-logo.mjs` into `src/brand/logo-official.json`. Then `npm run brand` rebuilds the favicon and app icons from it.
If you get the logo as an original vector file (SVG/AI/PDF), use that instead: it will be a little crisper than the trace.

## Other brand assets: replace with the official files

These elements are still **recreations** of the mockup and should be swapped for the originals:

| Asset | Where | How to replace |
|---|---|---|
| Bean pattern on the home card preview | `public/brand/bean-pattern.svg` | Drop in the original artwork with the same filename |
| Cup stamps (home preview, stamp panel, staff console) | `src/components/brand/CupStamp.tsx` | Replace the SVG paths |

After changing the logo mark, run `npm run brand` to regenerate the favicon and PWA icons.
The photos in `public/images` come from Unsplash (Unsplash License). Swap them for Himpil's own photography whenever it's available.
