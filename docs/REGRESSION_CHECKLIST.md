# Regression Checklist

This checklist must be executed before compiling any code changes or merging them into production. It ensures that system behaviors, calculations, and security protections remain intact.

---

## 1. Authentication & Session Checks
- [ ] Attempt to load checkout page `/checkout` when not logged in. Confirm that the site immediately redirects to the login screen.
- [ ] Make a direct HTTP request to backend endpoints `POST /api/v1/products/reserve` without token headers. Confirm that the response is `401 Unauthorized`.
- [ ] Attempt to load `/admin` as a standard `Viewer` user. Confirm that page rendering redirects/blocks and console shows `403 Forbidden` API responses.

---

## 2. Order & Checkout Logic
- [ ] Place an order for a casting that has exactly 1 item in stock. Verify that `locked_stock` increments to 1, and subsequent checkout attempts for that product fail with "sold out".
- [ ] Confirm a pending order from the admin dashboard. Verify that:
  - Product `locked_stock` decreases by the ordered quantity.
  - Product `sold_stock` increases by the ordered quantity.
  - Receipt balance is adjusted to 0.00.
- [ ] Cancel an order in `Pending` state. Verify that product `locked_stock` decreases back to its original value.
- [ ] Cancel an order in `Confirmed` state. Verify that product `sold_stock` decreases and stock is returned to `available`.

---

## 3. Financial Splits & Calculations
- [ ] Log a new expense from the admin panel. Verify that:
  - Total expenses sum increases.
  - Debtor/creditor transfer ledger is updated to show adjusted payments required.
- [ ] Add a settlement payment. Verify that the balances recalculate and reflect in the splits overview.
- [ ] Compare aggregated financial metrics (`GET /finance/metrics`) against database counts. Verify that:
  - Profit matches $\text{Revenue} - \text{Expenses}$.
  - Pending payments matches the sum of orders in `Verification Pending` state.

---

## 4. File Signatures & Private Streams
- [ ] Attempt to upload an image screenshot with a modified extension (e.g. rename a `.txt` file containing scripts to `.jpg`). Verify that the upload fails magic bytes signature checks.
- [ ] Attempt to download a payment screenshot from another customer's order ID. Verify that the request is rejected with `403 Forbidden`.

---

## 5. Batch Inventory & FIFO Audits
- [ ] **Distributor Recalls**: Verify that querying `order_inventory_allocations` for a specific batch ID returns all order items that received stock from that batch.
- [ ] **Product Price Changes**: Change the product base price in the catalog. Verify that existing orders and allocations retain their historical purchase cost and selling price.
- [ ] **FIFO Correctness**: Receive Batch A (5 units, Cost ₹1000) and Batch B (5 units, Cost ₹1200). Order 7 units. Verify Batch A is fully depleted (quantity_available = 0, quantity_sold = 5) and Batch B is partially depleted (quantity_available = 3, quantity_sold = 2).
- [ ] **Pre-order Fair Allocation**: Put 3 pre-orders in queue (Order A, Order B, Order C). Receive a batch of 2 units. Verify that only Order A and Order B get allocated stock in chronological order, while Order C remains unallocated.
- [ ] **Batch Deletion Lock**: Attempt to delete a batch that has sold/reserved inventory. Verify that the system rejects the deletion and enforces archival.
- [ ] **Cycle Count Variances**: Perform a manual adjustment on a batch. Verify that a ledger record of type `ADJUST_ADD` or `ADJUST_REMOVE` is recorded and product caches are updated.
- [ ] **Scheduled Reconciliation**: Trigger reconciliation. Verify that any manually introduced cache discrepancies are detected and raise alert notifications.
