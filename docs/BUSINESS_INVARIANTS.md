# Business Invariants for GarageKings

These are the system-level rules and assertions that must remain true under all circumstances. Regardless of future feature enhancements, bug fixes, or architecture redesigns, these invariants must never be violated.

---

## 1. User & Customer Invariants
- **Orders Require Authenticated Users:** An order (`orders` table) cannot exist without a valid, authenticated user (`users` table). The previous guest-checkout fallback has been completely deprecated.
- **Unique Identifier is Email:** Customer records (`customers` table) must be uniquely identified by their email. Phone numbers are no longer used as the unique key to prevent collisions when different users share contact details.
- **One User, One Role:** Each user has exactly one assigned role (`users.role`), which defaults to `Viewer` and can be set to `Admin` or `Owner`. There are no multi-role configurations.

---

## 2. Inventory & Stock Invariants
- **Non-Negative Stock:** Available stock must never be negative. Available stock is calculated dynamically as:
  $$\text{Available Stock} = \text{Total Stock} - \text{Locked Stock} - \text{Sold Stock}$$
- **Atomic Deductions:** When an order is placed, stock must be locked (`locked_stock` incremented) in the same database transaction.
- **First-Come-First-Served:** The active 15-second reservation timer cleanup worker has been disabled. Checkouts operate on a first-come-first-served basis where stock is locked at checkout start and confirmed/released at admin verification.

---

## 3. Order & Payment Invariants
- **Single Payment Receipt Association:** Every receipt (`receipts` table) must belong to exactly one e-commerce order (`orders.id`) or manual billing log.
- **Receipt Immutable State Logs:** Manual billing invoices generated via the admin panel must atomically create a backing order with `Confirmed` or `Pre-Order` status, deduct stock, and write an entry into `audit_logs`.
- **Payment Verification Audit Trail:** An order status transition to `Confirmed`, `Shipped`, or `Delivered` requires the manual receipt pending balance to be zeroed and logged in `audit_logs` for financial accountability.
- **Refund Audit Trails:** Any cancelation or refund must release locked or sold stock (as appropriate based on the previous state) and write an audit trail entry.

---

## 4. Security & Middleware Invariants
- **Backend Overrides Frontend:** All security and business validations (e.g. user authentication, admin role check, stock level confirmation) must be performed on the backend. Frontend validations are purely for user experience and must never be trusted.
- **Private File Protection:** All payment screenshots (`screenshot_url`, `advance_screenshot_url`) are private assets and must never be exposed publicly. They must only be accessible via authorized, role-checked backend streaming endpoints.
- **Strict File Type Validation:** File uploads must pass byte-signature checks (checking magic numbers, not just extensions) to prevent execution of malicious code. Only `image/jpeg`, `image/png`, and `image/webp` are permitted.
