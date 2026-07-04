---
name: security
description: Enforces file byte headers check, private streaming constraints, and session cookies guard.
---

# security

This skill card enforces system security boundaries.

---

## 1. Upload Magic Bytes Signature Checks
- Files uploaded by users (such as screenshots) must have their magic numbers verified on the backend:
  - `JPEG`: `FF D8 FF`
  - `PNG`: `89 50 4E 47`
  - `WEBP`: `52 49 46 46` ... `57 45 42 50`

---

## 2. Private S3 Streaming
- Secure payment proofs must never be publicly accessible.
- Stream screenshots through authenticated API endpoints (`GET /api/v1/orders/:id/screenshot`) validating owner or admin privileges.
