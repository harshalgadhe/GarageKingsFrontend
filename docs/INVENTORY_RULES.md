# Inventory Rules Specification

This document details the batch inventory tracking rules, stock allocation states, FIFO depletion engines, and scheduled integrity audits within GarageKings.

---

## 1. Multi-State Stock Accounting
Inventory stock is tracked in six discrete states to reflect physical and logical status:
- **`Available`**: Physically present in the warehouse, unsold, and available for checkouts.
- **`Reserved`**: Payment verified and order approved, but item has not shipped yet.
- **`Sold`**: Order delivered/completed and physical stock removed from the inventory batch.
- **`Returned`**: Customer returns that are physically returned to stock or written off.
- **`Damaged`**: Written-off units due to damage, theft, or warehouse loss.
- **`Locked`**: Virtual holds (e.g. cart lock during checkout pre-verification, deprecated in production checkout).

---

## 2. FIFO Stock Depletion & Traceability
To ensure accurate margins and audit records, stock is depleted from distributor batches using a FIFO (First-In, First-Out) model:
1. **FIFO Batch Query**: When an order is approved, available batches (`quantity_available > 0`) are locked (`FOR UPDATE`) and sorted by receipt date (`received_at ASC`).
2. **Sequential Depletion**: Stock is depleted from the oldest batch first.
3. **Traceability Logging**: An entry is created in `order_inventory_allocations` saving the exact purchase price cost and selling price for each batch allocation, securing historical COGS calculations.

---

## 3. Pre-order Queue Allocation
Pre-orders are held in a chronological queue:
1. **No FIFO Depletion**: Pre-orders do not immediately consume FIFO stock if none is available.
2. **Chronological Fulfillment**: When a new inventory batch is received, the pre-order queue is queried. Stock is allocated to waiting pre-orders in strict chronological order of order creation (`created_at ASC`).

---

## 4. Immutable Append-Only Ledger
All inventory adjustments, receipts, and depletions must write to the `inventory_ledger` table.
- Ledger entries are append-only and immutable. Historical entries must never be edited or deleted.
- Adjustments (damage, cycle counts) are recorded as type `ADJUST_ADD`, `ADJUST_REMOVE`, or `MARK_DAMAGED`.

---

## 5. Scheduled Reconciliation
Reconciliation runs automatically at startup and nightly at 2:00 AM:
1. **Cache Sync**: Compares aggregate cache columns on `inventory` vs batch sums.
2. **Ledger Audits**: Verifies that the sum of ledger entries matches batch quantities.
3. **Alerts**: Inconsistencies generate alerts in `system_notifications` for admin review.
