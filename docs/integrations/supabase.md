# Integration: Supabase

> Read this document when configuring Supabase client, auth listeners, Realtime channels, RPC invocations, or backend environment variables.

---

## 1. Client Initialization & Configuration

The Supabase client is initialized exclusively in `src/data/supabaseService.ts`:
```typescript
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export class SupabaseService implements LoyaltyService {
  readonly mode = 'supabase' as const;
  private db: SupabaseClient;

  constructor(url: string, anonKey: string) {
    this.db = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
}
```

### Environment Variables
Required in `.env`:
```env
VITE_SUPABASE_URL=https://<your-project-id>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```
If either variable is missing, `src/data/index.ts` automatically switches the runtime to `DemoService`.

---

## 2. Authentication Subsystem

- **Session Retrieval**: `getSession()` calls `db.auth.getSession()` and returns `{ id, email }`.
- **Auth State Listener**:
  ```typescript
  onAuthChange(cb: (user: SessionUser | null) => void) {
    const { data } = this.db.auth.onAuthStateChange((_e, session) => cb(toUser(session?.user)));
    return () => data.subscription.unsubscribe();
  }
  ```
- **Sign-Up Metadata**: Full name is forwarded in user metadata during registration:
  ```typescript
  options: { data: { full_name: fullName }, emailRedirectTo: window.location.origin }
  ```
  This is extracted by Postgres trigger `handle_new_user()` to populate `public.profiles.full_name`.

---

## 3. Realtime WebSocket Subscriptions

Live updates are powered by Supabase Realtime connected to PostgreSQL write-ahead logs (WAL):
- Table `public.loyalty_accounts` is added to publication:
  ```sql
  alter publication supabase_realtime add table public.loyalty_accounts;
  ```
- Subscription lifecycle:
  ```typescript
  subscribe(cb: () => void) {
    let channel: ReturnType<SupabaseClient['channel']> | null = null;
    let cancelled = false;
    void this.uid().then((id) => {
      if (cancelled) return;
      channel = this.db
        .channel(`loyalty-${id}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'loyalty_accounts', filter: `user_id=eq.${id}` },
          cb
        )
        .subscribe();
    });
    return () => {
      cancelled = true;
      if (channel) void this.db.removeChannel(channel);
    };
  }
  ```
- Security: Realtime honors PostgreSQL Row-Level Security. Clients cannot listen to updates for accounts they do not own.

---

## 4. Stored Procedure (RPC) Invocations & Error Translation

All staff mutations execute via `db.rpc(function_name, parameters)`.

### Exception Translation
PostgreSQL `RAISE EXCEPTION` strings are intercepted in `toError()`:
```typescript
const KNOWN_CODES: LoyaltyErrorCode[] = [
  'NOT_STAFF',
  'NOT_FOUND',
  'REWARD_PENDING',
  'REWARD_LOCKED',
  'EXCEEDS_CARD',
  'COOLDOWN'
];

function toError(err: { message?: string } | null | undefined): LoyaltyError {
  const msg = err?.message ?? '';
  const code = KNOWN_CODES.find((c) => msg.includes(c));
  if (code) return new LoyaltyError(code);
  if (/fetch|network/i.test(msg)) return new LoyaltyError('NETWORK');
  if (/jwt|auth/i.test(msg)) return new LoyaltyError('AUTH');
  return new LoyaltyError('UNKNOWN', msg || undefined);
}
```
This isolates the UI from raw database exceptions and guarantees consistent user-facing error text.

