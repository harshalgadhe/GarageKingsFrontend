# Architecture Overview

This document details the architectural layers, system relationships, and data flows of the GarageKings system.

---

## 1. High-Level System Architecture
GarageKings operates on a classic Client-Server layout built using lightweight technologies. The backend acts as a monolithic REST API hosting authentication, CRM management, catalog listing, orders, receipts, expenses, splits, and settings.

```mermaid
graph TD
    Client[React Frontend App] -->|HTTPS Requests| API[NestJS Backend API]
    API -->|Auth Actions| Cognito[AWS Cognito Auth]
    API -->|S3 Uploads| S3[AWS S3 Screenshots / Invoices]
    API -->|Local File Stream| Storage[Local storage fallback]
    API -->|Query Runner| DB[(PostgreSQL Database)]
```

---

## 2. Authentication Flow
Authentication is built on AWS Cognito with a local cookie-based session token guard.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant UI as React UI
    participant API as NestJS API
    participant Cognito as AWS Cognito

    User->>UI: Enter Email & Password
    UI->>API: POST /auth/login
    API->>Cognito: Admin Initiate Auth (Validation)
    Cognito-->>API: Authentication Tokens (JWT)
    API->>API: Generate local signed JWT session cookie (gk_access_token)
    API-->>UI: Serve User Role & metadata
    UI->>UI: Save user details in LocalStorage (gk_user)
```

---

## 3. Database Entity Relationship Model (Subset)

```mermaid
erDiagram
    USERS ||--o| PROFILES : "has profile"
    USERS ||--o{ ORDERS : "places order"
    PRODUCTS ||--o{ ORDER_ITEMS : "ordered in"
    ORDERS ||--|{ ORDER_ITEMS : "contains"
    CUSTOMERS ||--o{ RECEIPTS : "billed to"
    ORDERS ||--o| RECEIPTS : "generates"
    RECEIPTS ||--|{ RECEIPT_ITEMS : "lists"
```

---

## 4. Role & Permission Matrix
The system enforces role permissions at the backend controller level.

| Role | Catalog View | Cart/Checkout | My Profile | Expenses/Splits View | Admin Panel | Catalog Management | Settings Edit |
|---|---|---|---|---|---|---|---|
| **Viewer** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Admin** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Owner** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
