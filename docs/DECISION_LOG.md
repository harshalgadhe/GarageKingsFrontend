# GarageKings Decision Log

This log registers the critical architectural, security, and product-flow decisions made throughout the lifecycle of the GarageKings application.

---

## [2026-06-28] Deprecate Guest Checkout & Enforce Strict Login
- **Decision:** Remove the ability for unauthenticated guest users to check out. Force all checkout operations to require a logged-in account.
- **Reason:** Prevent security loop-holes and customer record proliferation. Unauthenticated user records (e.g. creating user entries labeled `guest_...` on checkout) made tracking customer order history complex and left open opportunities for API abuse. By enforcing login first, we ensure that every order has a validated collector profile mapping.
- **Alternatives Considered:** Allowing optional login with guest fallback. This was rejected because the owner wants a high-quality CRM record where buyers are verified.
- **Impact:**
  - Frontend: `Checkout.jsx` redirects unauthenticated visitors to `/login?returnTo=...` immediately.
  - Backend: Added `@UseGuards(AuthGuard('jwt'))` to `products/reserve` and `products/reserve-cart` endpoints, and deleted the guest user registration fallback block from `reserveProduct` and `reserveProductsCart` in `ApiService`.
- **Migration Notes:** None. Active orders belonging to guest users remain, but all new orders will be tied to verified user IDs.

---

## [2026-06-28] E-commerce UPI Payment QR & Address Transition
- **Decision:** Change default payment UPI destination to `sanchitjain0801@oksbi` and update the QR image displayed during checkout.
- **Reason:** Migrate payment routes to the correct business owner account and remove legacy placeholder text "Scan QR to Pay" from the image box when loading failed.
- **Impact:**
  - Copy new QR image to `public/upi-qr.png`.
  - Update `global_settings` table in the database to override company UPI ID properties.
  - Remove frontend onError fallback that replaced image elements with text strings in `PaymentInstructions.jsx`.
