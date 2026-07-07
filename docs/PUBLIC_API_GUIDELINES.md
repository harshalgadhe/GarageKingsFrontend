# Public API Data Guidelines

This policy protects GarageKings' proprietary business intelligence by prohibiting exposure of sensitive metrics to unauthenticated clients.

---

## 1. Protected Fields

The following data categories must **never** be exposed via public endpoint responses:
* **Cost Invariants**: `purchasePrice`, `totalCost`, supplier expenses, margins, shipping invoice costs.
* **Internal Logistical Information**: Supplier names, batch reception IDs, order ledger links.
* **Granular Stock Inventories**: Exact numbers for `totalStock`, `lockedStock`, `soldStock`, or warehouse shelf coordinates.
* **Audit Footprints**: User email tags (`createdBy`, `updatedBy`), deleted dates, and stack traces.

---

## 2. Storefront Policy (Stock Availability Rules)

Public clients must only receive availability states derived from stock levels:

* **`OUT_OF_STOCK`**: Calculated available quantity <= 0.
* **`PREORDER`**: Product marked as prebook.
* **`LOW_STOCK`**: Available stock is between 1 and 3 units (creates buyer urgency without leaking precise counts).
* **`IN_STOCK`**: Available stock > 3 units.
