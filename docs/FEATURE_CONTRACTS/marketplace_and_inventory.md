# Feature Contract: Marketplace & Batch Inventory

This contract defines the business and technical rules for the model casting catalog, distributors, FIFO batch depletion, and the append-only inventory ledger.

---

## 1. Purpose & Entry Points
- **Purpose**: Maintain an accurate, auditable, multi-state inventory ledger and calculate exact COGS profit margins.
- **Entry Points**:
  - `POST /api/v1/admin/inventory/batches`: Receives a new batch.
  - `POST /api/v1/admin/inventory/adjust`: Manual stock adjustments.
  - `POST /api/v1/admin/inventory/reconcile`: Manual verification check.

---

## 2. Dependencies & Database Entities
- **Dependencies**: `products` table (catalog products).
- **Key Tables**:
  - `distributors`: Registry of suppliers.
  - `inventory_batches`: Individual batch records tracking received, available, reserved, and sold quantities.
  - `inventory`: Aggregate stock caches.
  - `inventory_ledger`: Immutable append-only log of stock entries.
  - `order_inventory_allocations`: Links order items to specific batches.

---

## 3. Core Logic & Validation Rules
- **FIFO Depletion**: Deplete available stock starting from the oldest batch (`received_at ASC`).
- **Pre-order queue**: Chronologically matches newly received batches with confirmed pre-orders before making stock available to the general catalog.
- **Verification Invariant**: Available batch counts must exactly balance with ledger sums.
