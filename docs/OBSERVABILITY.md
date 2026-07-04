# Observability & Telemetry Framework

This document outlines the logging, error tracking, fingerprinting, and performance metrics systems integrated into the GarageKings platform.

---

## 1. Aggregated Error Tracking & Fingerprinting

To prevent database bloating and provide actionable bug reports, runtime errors are aggregated before storage:

```mermaid
graph TD
    Err[Runtime Exception] --> hash[Fingerprint hashing]
    hash --> DB{Fingerprint Exists in DB?}
    DB -->|Yes| Upd[Increment occurrence_count & update timestamp]
    DB -->|No| Ins[Insert new telemetry_errors record]
```

- **Fingerprint Algorithm**: A unique SHA-256 hash is computed using:
  - Error type/source.
  - Message summary.
  - Core stack trace patterns (omitting variable parameters).
- **Logged Metadata**:
  - `route` and `endpoint` where the exception occurred.
  - Browser details (`latest_browser`, `latest_device`).
  - Latest correlation identifier.
  - Payloads and duration stats.

---

## 2. Performance & Latency Metrics

A lightweight interceptor captures performance statistics:
- **Metrics Collected**:
  - `api_latency` (in milliseconds).
  - `query_duration` (for heavy DB operations).
  - Payload sizes.
- **Filtering**: Highly performant telemetry limits overhead to avoid degrading customer checkout operations.

---

## 3. Telemetry Log Inspection

Admins can view errors directly via:
- `GET /api/v1/admin/telemetry/errors`
This endpoints queries the aggregated error trace collection ordered by latest occurrence.
