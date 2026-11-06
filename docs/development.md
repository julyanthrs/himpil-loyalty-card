# Development & Operations Guide

> Read this document when setting up the environment, running local dev server, building production assets, deploying migrations, or testing barista flows.

---

## 1. Prerequisites & Environment Setup

- **Node.js**: Version 20+ (Runtime verified on Node `v24.13.0`).
- **Package Manager**: npm 10+ (`npm 11.6.2`).
- **Initial Setup**:
  ```bash
  npm install
  ```

---

## 2. Running the Application

### A. Demo Mode (Zero Configuration)
If `.env` is absent or `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` are empty:
```bash
npm run dev
# Server boots at http://localhost:5173
```
- The application automatically initializes in **Demo Mode**.
- Seed member **Alex Rivera** is loaded with 7/9 stamps and 3 past card cycles.
- Barista console is open to everyone at `/staff`.
- Changes sync live between browser tabs via `storage` events.

### B. Live Mode with Supabase
To connect to an active Supabase backend:
1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Populate the keys:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```
3. Apply the database migration:
   In the Supabase SQL Editor, run [`supabase/migrations/0001_himpil_loyalty.sql`](../supabase/migrations/0001_himpil_loyalty.sql).
4. Configure Auth Settings:
   Under **Authentication → URL Configuration**, set the Site URL to your web application URL (e.g. `http://localhost:5173` or your production domain).
5. Provision a Barista Account:
   Register a customer account normally via `/register`, then grant the barista role:
   ```sql
   insert into public.staff_roles (user_id, role)
   select id, 'barista' from auth.users where email = 'barista@himpil.example';
   ```

---

## 3. NPM Scripts & Asset Pipelines

| Command | Action |
|---|---|
| `npm run dev` | Launches Vite local development server with hot-module replacement (HMR). |
| `npm run typecheck` | Executes `tsc --noEmit -p .` to verify strict TypeScript compilation. |
| `npm run build` | Runs full typecheck and compiles production bundle to `dist/` with PWA service worker. |
| `npm run preview` | Spins up a local static server serving the production `dist/` directory. |
| `npm run brand` | Re-generates `bean-pattern.svg` and PWA app icons (`icon-192`, `icon-512`, `favicon.svg`) from `src/brand/logo-official.json`. |

### Maintenance & Asset Generation Scripts

- **Rebuild Card Artwork**:
  ```bash
  node scripts/build-card-art.mjs
  ```
  Processes `design/card-source/card-front.jpg` and `card-back.jpg`. Removes printed paragraph, infills texture, calculates cup bounding boxes, and writes `src/brand/card-back.json` and `public/brand/card-*.webp`.

- **Rebuild Photo Hero**:
  ```bash
  node scripts/build-hero.mjs
  ```
  Inpaints the background in `design/photo-source/hero-himpil.webp` where the printed logo sat, outputting `public/images/hero-himpil*.webp`.

- **Extract Official Logo**:
  ```bash
  node scripts/extract-logo.mjs
  ```
  Traces vector contours from the hero photo into `src/brand/logo-official.json`.

---

## 4. Testing & Verification Playbook

### Interactive Dual-Tab Testing (Demo Mode)
1. Open Browser Tab 1 at `http://localhost:5173/scan` (Customer view showing QR code).
2. Open Browser Tab 2 at `http://localhost:5173/staff` (Barista console).
3. In Tab 2, click *"Use the demo customer’s code (HMP-7Q4K-2MXD)"* and click **Find**.
4. Select a drink (e.g. *Spanish Latte*) and click **Add stamp**.
5. Switch to Tab 1:
   - Notice the toast notification appears instantly.
   - Observe the cup bounce animation (`animate-stamp-pop`) on the card.
6. In Tab 2, increment stamps until 9/9 is reached.
7. Click **Redeem free drink** and confirm.
8. Switch to Tab 1:
   - Card resets to 0/10 with Cycle incremented.
   - Visit `/rewards` to verify the completed card appears in the historical 3D card stack.

### Testing Camera Scanner
- The camera scanner requires a secure context (HTTPS) or `localhost`.
- If camera permissions are denied or unavailable, enter the member code manually in the input box on `/staff`.

