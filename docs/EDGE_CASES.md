# Edge Cases & Recovery Protocols

This document details known edge cases in the GarageKings system and the mechanisms used to resolve them.

---

## 1. Concurrent Checkouts on Low Stock
- **Symptom**: Two users attempt to purchase the same single casting simultaneously.
- **Handling**:
  - The backend locks the inventory rows (`SELECT ... FOR UPDATE`) in both the aggregate table `inventory` and the oldest batches in `inventory_batches` inside the checkout transaction.
  - The database serializes the evaluations: the first user succeeds, depletes the batch, and locks the stock.
  - The second user's query block waits, then evaluates `totalAvailable` and fails with a `"sold out"` exception, rolling back their transaction immediately.

---

## 2. Pre-order Chronological Queue Allocation
- **Symptom**: New inventory batches are received when multiple pre-orders are waiting.
- **Handling**:
  - The system implements a dedicated Pre-order Allocation Engine inside `receiveInventoryBatchTx()`.
  - When new inventory is received, the engine queries unallocated pre-orders sorted chronologically (`created_at ASC`).
  - Stock is assigned in strict chronological order, updating batch reserves, products, and order items. Any excess stock remains available for general catalog checkout.

---

## 3. Order Returns and State-Based Releases
- **Symptom**: An order is cancelled. How is stock returned?
- **Handling**:
  - **Cancellation of Confirmed Orders**: The stock was `Reserved` in the batches. Stock returns to `Available` on the batch, reserving cache is decremented, and the ledger logs `'RELEASE_RESERVATION'`.
  - **Cancellation of Shipped/Delivered Orders**: The stock was already physically deducted (`Sold`). The stock returns to `Returned` in the batch, sold cache is decremented, and the ledger logs `'RETURN_CUSTOMER'`.
  - Allocations in `order_inventory_allocations` are deleted.
