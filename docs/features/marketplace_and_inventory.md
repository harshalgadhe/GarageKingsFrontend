# Feature Contract: Marketplace & Inventory Management

---

## 1. Marketplace (The Vault)
- **Purpose:** Display castings, scheduled drops, active member listings, and bid offers.
- **Entry Points:** `/`, `/marketplace`, `/product/:id`
- **User Roles:** Public, Viewer, Admin, Owner
- **Business Rules:**
  - Standard users can view all published catalog items.
  - Drops must display countdown timers relative to `scheduled_time`.
- **API Endpoints:**
  - `GET /api/v1/products`
  - `GET /api/v1/products/paginated`
  - `GET /api/v1/products/:id`
- **Database Tables:** `products`, `product_images`, `drops`, `drop_products`, `marketplace_listings`, `offers`, `watchlists`
- **Dependencies:** None
- **Failure Scenarios:** Large listing pages time out due to missing database indices or unpaginated queries.
- **Edge Cases:** Deleted products continue to appear in cached listing.
- **Security Considerations:** Soft delete check must filter out products where `deleted_at IS NOT NULL` from public search.
- **Regression Risks:** Breaks search, drops display fail to render, countdown breaks.
- **Required Tests:** Retrieve active castings, verify paginated response structures.

---

## 2. Inventory
- **Purpose:** Tracks quantities in stock, processes locks/sales, and maintains a strict audit ledger.
- **Entry Points:** `/admin` (inventory tab)
- **User Roles:** Admin, Owner
- **Business Rules:**
  - Available stock must never drop below 0.
  - Stock updates must log `quantity_changed` and `reason` in `inventory_transactions`.
- **API Endpoints:**
  - `POST /api/v1/products` (adding product sets initial stock)
  - `PUT /api/v1/products/:id` (updating details)
  - `DELETE /api/v1/products/:id` (archiving products)
- **Database Tables:** `inventory`, `inventory_transactions`, `products`
- **Dependencies:** None
- **Failure Scenarios:** Parallel checkouts decrementing stock below zero (prevented by postgres row-level lock transaction).
- **Edge Cases:** Manually adjusting stock count of locked product.
- **Security Considerations:** Protect catalog write endpoints from unauthorized user roles (only allow Admin/Owner).
- **Regression Risks:** Inconsistent stock values, duplicate sales.
- **Required Tests:** Update product stock, assert transaction entry exists.
