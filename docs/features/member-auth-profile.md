# Feature: Member Authentication & Profile

> Read this document when modifying login, registration, email confirmation, profile settings, or member code display.

---

## 1. Feature Purpose & Overview

The Member Authentication & Profile system governs customer onboarding, identity verification, account settings, and personal member credentials:
- Seamless sign-in and registration pages styled with the Himpil cultural aesthetic.
- Automatic customer loyalty card generation upon registration.
- Profile dashboard displaying avatar, member since date, lifetime statistics, notification toggles, and member code.
- Demo mode simulation that allows immediate exploration without credentials.

---

## 2. Authentication Flow

### Files Involved
- `src/pages/Auth.tsx` (`Login`, `Register`, `AuthLayout`)
- `src/context/AuthContext.tsx`
- `src/data/service.ts` (`signIn`, `signUp`, `signOut`, `getSession`, `onAuthChange`)

### Registration Flow
1. Customer submits full name, email, and password.
2. In Supabase mode, calls `supabase.auth.signUp(...)`:
   - Metadata `full_name` is passed in registration options.
   - Database trigger `on_auth_user_created` fires in Postgres, creating matching rows in `public.profiles` and `public.loyalty_accounts`.
   - A unique member code (`HMP-XXXX-XXXX`) is assigned automatically.
   - If email confirmation is enabled, UI renders the "Check your inbox" screen.
3. In Demo mode:
   - Immediately creates a fresh sample account in `localStorage` with 0 stamps and signs in without a password.

### Sign-In Flow
1. Customer enters credentials.
2. `RequireAuth` in `src/App.tsx` redirects unauthenticated visitors to `/login`, preserving the intended destination in `location.state.from`.
3. Upon authentication, customer is redirected back to their intended route.

---

## 3. Profile Management (`src/pages/Profile.tsx`)

The Profile page provides self-service account controls:

### 1. Name Editing
- Customers can inline-edit their display name (constrained to 80 characters).
- Dispatches `service.updateProfile({ fullName })`.
- Handled via optimistic local state update backed by PostgreSQL column-level update grants on `public.profiles.full_name`.

### 2. Member Code & Clipboard Utility
- Displays the customer's permanent ID (`HMP-XXXX-XXXX`).
- Formatted with monospace typography (`font-mono tracking-[0.14em]`).
- Includes a "Copy" button using `navigator.clipboard.writeText`.
- Gracefully alerts with a toast if clipboard permissions are restricted.

### 3. Notification Preferences
Two interactive toggle switches:
- **Stamp & reward updates** (`notify_stamps`): Alerts when a stamp is awarded or reward unlocked.
- **News from Himpil** (`notify_offers`): Café announcements and seasonal drinks.
- Toggling immediately updates `public.profiles` via `service.updateProfile`.

### 4. Barista Console Shortcut
- If the logged-in user possesses a staff role (`service.isStaff()`) or the app is running in Demo mode, a direct shortcut button to `/staff` is presented on the Profile page.

### 5. Session Termination & Demo Reset
- **Log Out**: Terminates session (`service.signOut()`) and redirects to `/login`.
- **Reset Demo Data** (Demo Mode Only): Restores the original sample member "Alex Rivera" with 7/9 stamps and 3 completed cards via `demo.reset()`.

