---
name: architecture
description: Documents high-level modular monolith design, sequence diagrams, and technology boundaries.
---

# architecture

This skill card summarizes high-level design constraints.

---

## 1. Monolith Boundaries
- **Backend**: NestJS monolithic REST API. Contains distinct logical modules:
  - `ApiModule`: Main routing containing orders, products, CRM, and founder financials.
  - `ReceiptsModule`: High-precision manual billing and PDF queue manager.
- **Frontend**: React SPA served from AWS S3 CDN. Utilizes Zustand and cookies.

---

## 2. Sequence Patterns & Boundaries
- **Order Placement**:
  1. Client sends request with unique `idempotency_key`.
  2. Server checks key.
  3. Server starts transaction, checks stock caches, updates reserves, and commits.
  4. Returns success details.
- **Batch Processing**:
  - Always separate catalog metadata operations from inventory batch receipts and ledgers.
