# Feature Contract: Checkout & Payment Verification

---

## 1. Checkout
- **Purpose:** Reserve casting stock, select shipping methods, and place order objects.
- **Entry Points:** `/cart`, `/checkout`
- **User Roles:** Authenticated User (Viewer, Admin, Owner)
- **Business Rules:**
  - Guests are not allowed to check out. Direct redirection to `/login` is enforced.
  - Cart item counts must not exceed product purchase limit limits (`max_qty_per_customer`).
  - Checkout calls must register an `idempotency_key`. Subsequent identical keys return cached order IDs.
- **API Endpoints:**
  - `POST /api/v1/products/reserve`
  - `POST /api/v1/products/reserve-cart`
- **Database Tables:** `orders`, `order_items`, `customers`, `reservations`, `users`
- **Dependencies:** Authentication module.
- **Failure Scenarios:** Concurrency overflow (handled by database row lock transaction), out-of-stock items (handled by checking stock availability before locking).
- **Edge Cases:** Clicking submit checkout twice in rapid succession (handled by idempotency locks).
- **Security Considerations:** Validate that the customer email matches the authenticated token email.
- **Regression Risks:** Breaks buying loop, duplicate payment/orders, stock allocation mismatches.
- **Required Tests:** Place order with valid auth, check out item over the purchase limit, double checkout with identical idempotency key.

---

## 2. Payment Verification
- **Purpose:** Securely log payment screenshots, verify funds, and confirm orders.
- **Entry Points:** `/checkout` (screenshot upload), `/admin` (order review)
- **User Roles:** Customer (to upload), Admin, Owner (to confirm/reject)
- **Business Rules:**
  - Unconfirmed orders remain as `Pending` or `Verification Pending`.
  - Payment screenshot verification requires a secure file signature check (verify file headers for image validity).
  - Admin approval transitions order to `Confirmed`, release stock lock and update receipts values.
- **API Endpoints:**
  - `POST /api/v1/orders/:id/screenshot`
  - `GET /api/v1/orders/:id/screenshot` (private stream)
  - `POST /api/v1/orders/:id/confirm`
  - `PUT /api/v1/orders/:id/status`
- **Database Tables:** `orders`, `receipts`, `audit_logs`
- **Dependencies:** Checkout module.
- **Failure Scenarios:** Screenshot upload fails (falls back to local filesystem write if S3 is configured incorrectly).
- **Edge Cases:** Customer uploads malicious executable disguised as image (handled by magic bytes signature check).
- **Security Considerations:** Screenshot retrieval requires token ownership check. Admin/Owner can fetch any screenshot, but standard users must only fetch their own order screenshots.
- **Regression Risks:** Fraudulent confirmations, leaked customer payment proofs, broken screenshot rendering.
- **Required Tests:** Upload JPEG screenshot, fetch screenshot with matching user ID, assert other users receive `403 Forbidden` on fetch.
