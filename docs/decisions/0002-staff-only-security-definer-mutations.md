# Decision: Staff-Only Security Definer Mutations

## Context
In a loyalty punch-card system, stamps represent financial value (free drinks). Allowing client-side direct writes to tables holding stamp counts or redemptions creates an immediate vulnerability where malicious users can award themselves free coffee using basic browser devtools or HTTP clients.

## Decision
Strip all direct `INSERT`, `UPDATE`, `DELETE`, and `TRUNCATE` privileges on `loyalty_accounts`, `stamp_transactions`, and `reward_redemptions` from both anonymous and authenticated client roles. Expose mutations exclusively through PostgreSQL `SECURITY DEFINER` stored procedures:
- `public.staff_award_stamps()`
- `public.staff_redeem_reward()`

Every procedure verifies that the caller (`auth.uid()`) is registered in `public.staff_roles` via `public.assert_staff()`.

## Reasoning
- Guarantees zero-trust database security: even if client application code is compromised, the PostgreSQL engine refuses direct modifications.
- Centralizes business logic (9-stamp cap, 10-second cooldown, card cycle progression) inside ACID-compliant database transactions.
- Provides complete auditability: every stamp and redemption records the `staff_id` of the barista who authorized it.

## Alternatives
- Client-side updates with Row Level Security check expressions (fragile, difficult to restrict to staff without complex join policies, risks race conditions).
- Dedicated Node/Express or Edge Function API layer (adds server hosting complexity and deployment overhead compared to Supabase native RPCs).

## Consequences
- Modifying mutation logic requires writing and testing SQL migrations in `supabase/migrations/`.
- Frontend code must call `.rpc()` rather than direct table operations.

