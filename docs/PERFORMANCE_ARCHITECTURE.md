# Performance Architecture Principles

This document defines the immutable engineering principles for performance, loading experiences, and resource efficiency across the GarageKings application ecosystem.

---

## 1. Backend Ownership of Business Logic
- The backend remains the single source of truth for all business rules, constants, validations, and pagination strategies.
- The frontend UI acts strictly as a presentation and rendering layer. It must never perform calculations related to shipping fees, taxes, low-stock thresholds, or device-specific page sizes.
- Operational thresholds, feature flags, and logistical parameters are maintained server-side and never exposed to public or unauthenticated clients.

---

## 2. Public API Boundaries & Data Protection
- Public endpoints must follow the principle of least privilege. They must return the absolute minimum payload necessary for customer viewing.
- Unused or ERP-specific columns (such as `purchase_price`, `sku`, `casing_types`, and `supplier_id`) are excluded from public database queries.
- Entities are serialized using defined Data Transfer Objects (DTOs) before transmission. Direct export of ORM entities is strictly prohibited.

---

## 3. Mandatory Pagination & Caching
- All endpoints serving datasets or tables of dynamic size must implement pagination on the database query level.
- Public queries are cached (e.g., using memory cache layers) to minimize raw database reads for anonymous storefront traffic.
- Conditional requests using standard HTTP headers (`ETag`, `If-None-Match`, `Cache-Control`) are enforced to save network bandwidth and prevent redundant parsing of unchanged catalogs.

---

## 4. Search and Input Pipeline Optimization
- Storefront search queries are debounced to prevent database thrashing while typing.
- Normalized query checks, minimum character length thresholds, and concurrent request cancellations (using `AbortController`) are mandatory for all user inputs querying the network.
- Where possible, the client filters cached or loaded datasets locally before initiating new API requests.

---

## 5. UI Loading Experience
- All blocking operations (checkout, payment, mutations) must route through a unified, interaction-blocking loading system.
- Skeletal states must match final component dimensions exactly to eliminate layout shifts (CLS) and ensure visual continuity.
