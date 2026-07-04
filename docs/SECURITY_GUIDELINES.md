# Security Guidelines & Core Protections

This document outlines the security policies, middleware constraints, and file signature checks enforced to protect user sessions and private assets in GarageKings.

---

## 1. File Upload Magic Bytes Signature Check

To prevent shell injections and execution of malicious code, the backend does not trust browser-supplied file names or MIME types:
- **Magic Bytes Verification**: The file uploader reads the first 4–8 bytes of the binary stream to verify signature headers:
  - **JPEG**: `FF D8 FF`
  - **PNG**: `89 50 4E 47`
  - **WEBP**: `52 49 46 46` ... `57 45 42 50`
- **Rejection Policy**: If the magic bytes do not match permitted image formats, the request is immediately rejected with a `400 Bad Request` before the file is written to storage.

---

## 2. Private Uploads & Streaming Guard

Payment screenshot uploads (`screenshot_url` and `advance_screenshot_url`) and receipts/invoices are considered highly sensitive assets:
- **Private S3 Buckets**: Files are stored in private directories inaccessible via public HTTP urls.
- **Backend Streaming Endpoint**: Files are retrieved and served only via authenticated routes:
  - `GET /api/v1/orders/:id/screenshot`
- **Permissions Validation**: The controller verifies that the requesting user is either:
  1. The original order creator (matching the `user_id` inside the session cookie).
  2. An authenticated `Admin` or `Owner`.
- If unauthorized, the API returns a `403 Forbidden` error.

---

## 3. Session Cookie Security

Session tokens are delivered as HTTP-only cookies:
- **SameSite=Strict**: Restricts cookie transmission entirely on cross-site requests, blocking CSRF attacks.
- **Secure Flag**: Ensures cookies are only sent over encrypted HTTPS connections.
- **HttpOnly**: Blocks JavaScript access to the cookie, mitigating XSS extraction risks.
- **No Local Storage Storage**: Token strings must never be copied or stored in LocalStorage.
