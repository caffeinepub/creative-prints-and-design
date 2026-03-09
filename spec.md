# Creative Prints and Design

## Current State
Full 3D printing e-commerce storefront with email/password admin login (lanepeevy@gmail.com), product store, gallery, custom orders, Venmo checkout, and a unified orders dashboard.

## Requested Changes (Diff)

### Add
- `stable var guaranteedAdminPrincipal` in backend — persists the admin's IC principal across canister upgrades so admin recognition is instant on every call without needing a fresh profile save.
- `resetAdminSession()` export in useQueries so logout properly clears the session flag.

### Modify
- Backend `requireAdminUpdate` / `requireAdminQuery`: now checks the stable `guaranteedAdminPrincipal` first (fastest), then the profile map, then AccessControl — eliminating all race conditions and post-upgrade auth failures.
- `ensureAdminRegistered`: always calls `saveCallerUserProfile` first (not as a fallback), with a module-level flag to avoid redundant calls per session.
- `AdminDashboard` `handleLogin`: awaits backend registration before showing the dashboard, with a "Setting up admin access..." spinner.

### Remove
- Fragile fire-and-forget `tryRegister()` pattern in AdminDashboard.

## Implementation Plan
1. Backend: add stable principal var, update admin helper and require functions.
2. useQueries: simplify ensureAdminRegistered to always save profile first, add session flag and reset export.
3. AdminDashboard: await registration after login, show spinner.
