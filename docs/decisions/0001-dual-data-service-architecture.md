# Decision: Dual Data Service Architecture (Demo vs. Supabase)

## Context
The application needs to operate as a full-featured customer loyalty system backed by a secure PostgreSQL database, while also enabling immediate evaluation, UI testing, and stakeholder demos without forcing every developer or user to configure a Supabase cloud project.

## Decision
Create an abstract `LoyaltyService` interface in `src/data/service.ts`. Implement two interchangeable providers:
1. `SupabaseService`: Connects to Supabase Auth, PostgreSQL tables, Realtime channels, and stored procedures.
2. `DemoService`: Stores state in the browser's `localStorage` and uses browser event listeners for multi-tab synchronization.

A factory in `src/data/index.ts` automatically switches between implementations based on the presence of `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

## Reasoning
- Enables zero-configuration development: clone the repo, run `npm install` and `npm run dev`, and the entire app is testable immediately.
- Decouples the React UI components completely from Supabase SDK specifics, simplifying testing and future backend migrations.
- Provides a realistic multi-tab test bed where a developer can simulate customer (`/scan`) and barista (`/staff`) interactions side-by-side.

## Alternatives
- Direct Supabase calls within React components (tightly coupled, impossible to run without cloud credentials).
- Mock service worker (MSW) or API mocks (more complex setup, doesn't persist state cleanly across browser tabs as easily as `localStorage` and DOM `storage` events).

## Consequences
- Every new backend method added to `LoyaltyService` must be implemented in both `DemoService` and `SupabaseService`.
- Demo state is confined to the local browser and does not synchronize across separate physical devices.

