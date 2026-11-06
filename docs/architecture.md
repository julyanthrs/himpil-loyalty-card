# System Architecture

> Read this document before modifying application structure, data pipelines, backend interfaces, state flow, or security layers.

---

## 1. High-Level Architectural Blueprint

Himpil uses a client-centric, service-abstracted architecture. The React application never binds directly to Supabase client calls within view components; all data operations route through the `LoyaltyService` interface.

```
┌────────────────────────────────────────────────────────────────┐
│                         Presentation                           │
│  Pages: Home, MyCard, Scan, Rewards, Activity, Profile, Staff  │
│  Components: FlipCard, CardArt, CardStack, StampGrid, QrPanel  │
└────────────────────────────────┬───────────────────────────────┘
                                 │
                                 ▼
┌────────────────────────────────────────────────────────────────┐
│                     Context & State Layer                      │
│   AuthContext        LoyaltyContext           ToastContext     │
│   (Session/User)     (Card/Activity/Realtime) (Notification)   │
└────────────────────────────────┬───────────────────────────────┘
                                 │
                                 ▼
┌────────────────────────────────────────────────────────────────┐
│                   Service Abstraction Layer                    │
│             src/data/service.ts (LoyaltyService)               │
│                src/data/index.ts (Factory)                     │
└───────────────────────┬───────────────────┬────────────────────┘
                        │                   │
         [VITE_SUPABASE_URL set]     [VITE_SUPABASE_URL unset]
                        │                   │
                        ▼                   ▼
┌───────────────────────────────┐   ┌────────────────────────────┐
│        SupabaseService        │   │        DemoService         │
│  Supabase Auth                │   │  In-Memory / LocalStorage  │
│  Postgres RLS Tables          │   │  StorageEvent Synced       │
│  Realtime WebSocket Pub/Sub   │   │  Deterministic Seed Data   │
│  SECURITY DEFINER RPCs        │   │  Simulated Barista Latency │
└───────────────┬───────────────┘   └────────────────────────────┘
                │
                ▼
┌────────────────────────────────────────────────────────────────┐
│                 Supabase Backend Infrastructure                │
│  Auth: auth.users (Cascading triggers to public profiles)      │
│  Database: PostgreSQL 15+ (profiles, accounts, transactions)   │
│  Security: Row Level Security + Granular Column Revocations    │
│  Stored Procedures: staff_lookup, staff_award_stamps, redeem   │
│  Realtime Engine: WAL-based replication on loyalty_accounts    │
└────────────────────────────────────────────────────────────────┘
```

---

## 2. Layered Responsibilities

| Layer | Files | Responsibility |
|---|---|---|
| **Entry & Shell** | `src/main.tsx`, `src/App.tsx`, `src/components/layout/AppShell.tsx` | PWA registration, font loading, routing, auth gates (`RequireAuth`), top/bottom navigation, status bar tinting. |
| **Contexts** | `src/context/AuthContext.tsx`, `src/context/LoyaltyContext.tsx`, `src/context/ToastContext.tsx` | Global reactive state, session management, optimistic profile updates, toast notifications, realtime change detection, stamp animation triggers. |
| **Domain Logic** | `src/lib/loyalty.ts`, `src/lib/types.ts`, `src/lib/drinks.ts`, `src/lib/format.ts` | 9-stamp business rules, member code validation regex, QR payload encoding, stacked card derivation, drinks menu, date formatting. |
| **Service Layer** | `src/data/service.ts`, `src/data/index.ts`, `src/data/demoService.ts`, `src/data/supabaseService.ts` | Decoupled backend contract. Automatically selects `SupabaseService` when credentials exist or `DemoService` when credentials are absent. |
| **Database & RPCs** | `supabase/migrations/0001_himpil_loyalty.sql` | Postgres schemas, foreign keys, cascade deletes, RLS policies, table grants, security-definer RPCs, member code generator. |

---

## 3. Data Flow & Mutation Pipeline

### Stamp Awarding Flow
```
Barista Console (/staff)
   │
   ├─ 1. Reads member QR payload or manual code: HMP-XXXX-XXXX
   ├─ 2. Validates code regex via parseMemberCode()
   ├─ 3. Generates unique client UUID (newRequestId())
   │
   ▼
LoyaltyService.staffAwardStamps(memberCode, drink, quantity, requestId)
   │
   ├─ If DemoMode:
   │    Updates localStorage, dispatches 'himpil-demo-change' and 'storage' event
   │
   └─ If SupabaseMode:
        Calls Postgres RPC: public.staff_award_stamps()
          ├── 1. perform public.assert_staff() [checks public.staff_roles]
          ├── 2. select * from public.loyalty_accounts for update [ROW LOCK]
          ├── 3. check idempotency: does request_id exist in stamp_transactions?
          ├── 4. validate: acct.stamps < 9, quantity <= remaining room
          ├── 5. validate cooldown: last_stamp_at > now() - interval '10 seconds'
          ├── 6. insert into public.stamp_transactions
          └── 7. update public.loyalty_accounts (stamps, total_stamps, last_stamp_at)
```

### Realtime Synchronization to Customer Screen
```
Database UPDATE on public.loyalty_accounts
   │
   ▼
Supabase Realtime Engine (WAL publication: supabase_realtime)
   │
   ▼
Customer Browser (SupabaseService.subscribe)
   │
   ▼
LoyaltyContext.refresh()
   │
   ├─ Compares new account state against prev.current
   ├─ Detects delta: a.totalStamps > before.totalStamps
   ├─ Triggers toast: "Stamp collected! You’re closer to your free drink."
   └─ Dispatches lastEvent: { type: 'stamp', at: Date.now(), stampIndex: a.stamps - 1 }
        │
        ▼
Loyalty Card UI Components (CardPreview, FlipCard, CardArt)
   └─ Triggers CSS keyframe: animate-stamp-pop on the newly filled cup
```

---

## 4. Trust Boundary & Security Architecture

1. **Zero Client Trust**:
   - The customer frontend has **no write permissions** on `loyalty_accounts`, `stamp_transactions`, or `reward_redemptions`.
   - The PostgreSQL `authenticated` role is stripped of `INSERT`, `UPDATE`, `DELETE`, and `TRUNCATE` privileges on all loyalty and transaction tables.
   - Column-level grants limit profile updates to only `full_name`, `notify_stamps`, and `notify_offers`. Customers cannot alter their email, user ID, or created dates.

2. **Security Definer Isolation**:
   - Mutations occur exclusively inside `SECURITY DEFINER` functions with fixed `search_path = ''` to prevent search-path hijacking attacks.
   - Every staff RPC invokes `public.assert_staff()`, verifying the authenticated caller (`auth.uid()`) exists in `public.staff_roles`.

3. **Concurrency & Anti-Fraud Controls**:
   - **Row Locking**: `SELECT ... FOR UPDATE` serializes concurrent transactions on the customer's account row, eliminating race conditions.
   - **Idempotency**: All mutations accept a client-generated UUID `request_id`. Retrying a network request returns the updated customer record without double-incrementing stamps.
   - **Cooldown**: A 10-second server-enforced cooldown (`last_stamp_at > now() - interval '10 seconds'`) prevents duplicate scans or barista double-taps.
   - **Unique Reward Constraint**: `unique (account_id, cycle)` in `reward_redemptions` ensures a free drink can only be redeemed once per cycle.

---

## 5. Error Propagation & Normalization

All service failures are normalized into a typed `LoyaltyError` instance with discrete error codes:

```typescript
export type LoyaltyErrorCode =
  | 'NOT_STAFF'       // User does not possess barista/manager role
  | 'NOT_FOUND'       // Member code does not match any loyalty account
  | 'REWARD_PENDING'  // Card is at 9/9 stamps; must redeem before adding more
  | 'REWARD_LOCKED'   // Attempted redemption before 9 stamps reached
  | 'EXCEEDS_CARD'    // Quantity added exceeds remaining card capacity (9 - stamps)
  | 'COOLDOWN'        // Mutation rejected because last stamp was < 10s ago
  | 'AUTH'            // Session invalid, expired, or missing
  | 'NETWORK'         // Fetch failure or disconnected device
  | 'UNKNOWN';        // Unrecognized server fault
```

The UI maps these error codes into customer-friendly, localized error text using `errorMessage(err)` in `src/lib/loyalty.ts`.

---

## 6. Progressive Web App & Caching Strategy

The application uses `vite-plugin-pwa` with Workbox configured in `vite.config.ts`:
- **Static Assets**: HTML, CSS, JS, SVG, WEBP, and WOFF2 fonts are cached for instantaneous launch.
- **Service Worker Strategy**: `registerType: 'autoUpdate'`.
- **Navigation Denylist**:
  ```typescript
  navigateFallbackDenylist: [/^\/auth/, /^\/rest/]
  ```
  **CRITICAL**: Loyalty card balances, stamp transactions, and authentication endpoints must never be served from HTTP cache. All Supabase REST and Auth endpoints bypass the Service Worker.

