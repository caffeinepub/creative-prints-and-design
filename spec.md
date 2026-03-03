# Creative Prints and Design

## Current State

Full-stack 3D printing storefront with:
- Email/password auth system (`useAuth`) used in `Layout.tsx` for login/logout
- `AdminDashboard.tsx` incorrectly uses `useInternetIdentity` for auth, NOT `useAuth` — this mismatch means admin works on draft (where the session persists locally) but the admin nav link and access denied state on live relies on Internet Identity being authenticated
- Checkout page shows Venmo QR code but does NOT show the Venmo handle `@Tyler-Peevy` as text
- `CheckoutPage` captures `totalPrice` from cart then calls `clearCart()` BEFORE navigating — since `totalPrice` is a getter computed from `items` and `clearCart()` wipes items, the total passed to `navigate()` may evaluate to 0

## Requested Changes (Diff)

### Add
- Display `@Tyler-Peevy` Venmo handle prominently in the Checkout payment section

### Modify
- **AdminDashboard.tsx**: Replace `useInternetIdentity` auth check with `useAuth` hook. The page should check `useAuth().isAuthenticated` and `useAuth().isAdmin()` instead of `identity` from Internet Identity. Wire the backend registration callback via `setBackendRegistrationCallback` on the actor so the email-login admin gets synced to the backend on login.
- **CheckoutPage.tsx**: Capture `totalPrice` into a local variable BEFORE calling `clearCart()`, then pass that captured value to `navigate`.
- **Layout.tsx**: Replace Internet Identity admin check (`useInternetIdentity` + `useIsCallerAdmin`) with `useAuth` so the Admin nav link shows when the email-based admin is logged in.

### Remove
- Internet Identity login/logout from Layout header (replace with email/password auth state display)
- Internet Identity dependency from AdminDashboard

## Implementation Plan

1. Fix `CheckoutPage.tsx`: capture `totalPrice` to a local const before `clearCart()` and pass it to `navigate`
2. Fix `CheckoutPage.tsx`: add `@Tyler-Peevy` text prominently in the Venmo payment card
3. Fix `AdminDashboard.tsx`: swap out `useInternetIdentity` for `useAuth`; show login prompt if not authenticated; show access denied if authenticated but not admin; show dashboard if `isAdmin()` returns true
4. Fix `Layout.tsx`: replace Internet Identity auth/logout with `useAuth` login state; show Admin nav link based on `useAuth().isAdmin()`
