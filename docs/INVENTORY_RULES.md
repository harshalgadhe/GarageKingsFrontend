# Inventory Rules Specification

This document details the inventory tracking rules, stock locking mechanisms, and audit logging boundaries within GarageKings.

---

## 1. Core Stock Accounting
Inventory availability is calculated dynamically rather than stored statically to prevent race conditions:

$$\text{Available Quantity} = \text{Total Stock} - \text{Locked Stock} - \text{Sold Stock}$$

- **`total_stock`:** The absolute physical quantity of the casting ever loaded into the warehouse shelf.
- **`locked_stock`:** Quantity reserved by pending checkouts or pre-orders awaiting screenshot verification.
- **`sold_stock`:** Quantity successfully paid for and confirmed by admin action.

---

## 2. Dynamic Transaction Logging
Every change to inventory must be accompanied by an entry in the `inventory_transactions` table.
- **Supported Transaction Types:** `Added`, `Edited`, `Reserved`, `Sold`, `Returned`, `Cancelled`, `Deleted`.
- **Fields Logged:** `product_id`, `type`, `quantity_changed`, `reason`, `admin_user_id` (if applicable), `created_at`.
- **Integrity Rule:** These transactions serve as a ledger to reconstruct inventory levels for any past timestamp during audits.

---

## 3. Concurrency & Race Condition Prevention
To prevent multiple customers from reserving the same item when stock is low, the backend enforces:
1. **Row-Level Locking:** During checkout, the target product is selected using `SELECT ... FOR UPDATE` within a SQL Transaction block.
2. **Stock Verification:** The transaction checks if `available` stock is greater than or equal to the requested quantity. If not, the transaction immediately rolls back and throws an error.
3. **Idempotency Key:** If an identical checkout request hits the server (due to network retries), the cached response is returned instead of executing duplicate reservations.

---

## 4. Pre-Order & Pre-Booking Allocation
- Products can be flagged as `is_prebook = TRUE`.
- Prebook items define a `prebook_deposit_amount` which is the initial advance required.
- During drops, products can be allocated to drops using `drop_products` containing an `allocated_qty` limit. This limit isolates drop inventory from general vault stock.
