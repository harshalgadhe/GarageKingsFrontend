---
name: observability
description: Documents error fingerprinting, performance telemetry logging, and system notifications.
---

# observability

This skill card describes error logging and metrics collection.

---

## 1. Exception Fingerprinting & Aggregation
- Runtime backend errors are hashed using SHA-256 on the message and stack trace.
- Multiple occurrences increment `occurrence_count` on existing records rather than writing separate entries, preventing database bloating.

---

## 2. Notification Dispatch
- Critical discrepancies (e.g. database reconciliation mismatches) must trigger a system notification inside the database (`system_notifications`) for admin visibility.
