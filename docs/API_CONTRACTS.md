# API Contracts Specification

This document details the HTTP endpoints, authorization requirements, payloads, and response interfaces for the GarageKings backend monolith API.

---

## 1. Authentication & System Setup

### `GET /setup/status`
- **Description:** Checks if the first-startup Owner account configuration is required.
- **Authorization:** Public
- **Response:**
  ```json
  { "isSetupRequired": false }
  ```

### `POST /setup/owner`
- **Description:** Configures the first-time Owner account if setup is required.
- **Authorization:** Public (only functions if `isSetupRequired` is true)
- **Request Body:**
  ```json
  { "email": "admin@garagekings.in", "password": "SecurePassword123" }
  ```
- **Response:**
  ```json
  { "success": true, "message": "Owner account configured successfully." }
  ```

### `POST /auth/login`
- **Description:** Authenticates local email and password. Sets secure cookie `gk_access_token`.
- **Authorization:** Public
- **Request Body:**
  ```json
  { "email": "user@example.com", "password": "Password123" }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "user": {
      "id": "uuid-here",
      "email": "user@example.com",
      "role": "Viewer"
    }
  }
  ```

### `POST /auth/logout`
- **Description:** Invalidates the access token cookie.
- **Authorization:** Public
- **Response:**
  ```json
  { "success": true }
  ```

---

## 2. Product Catalog Management

### `GET /products`
- **Description:** Returns the list of active models.
- **Authorization:** Public (Admin receives unpublished items if parameter `adminMode=true` is sent)
- **Response:** Array of product objects.

### `POST /products`
- **Description:** Creates a new casting item in the database.
- **Authorization:** Admin or Owner (JWT guarded)
- **Request Body:**
  ```json
  {
    "brand": "Hot Wheels",
    "modelName": "Porsche 911 GT3",
    "sku": "HW-911-GT3-2026",
    "basePrice": 399.00,
    "totalStock": 10
  }
  ```
- **Response:** Product entity object.

---

## 3. Order & Reservation Management

### `POST /products/reserve`
- **Description:** Reserves stock and creates a standard or pre-order.
- **Authorization:** Authenticated User (JWT guarded)
- **Request Body:**
  ```json
  {
    "productId": "product-uuid",
    "email": "user@example.com",
    "name": "User Name",
    "phone": "9876543210",
    "address": "Shipping Address",
    "idempotencyKey": "uuid-key",
    "bookingType": "standard",
    "price": 399.00,
    "qty": 1
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "orderId": "order-uuid",
    "bookingType": "standard",
    "advanceAmount": 399.00,
    "remainingAmount": 0.00
  }
  ```

### `POST /products/reserve-cart`
- **Description:** Reserves stock for multiple cart items under one order.
- **Authorization:** Authenticated User (JWT guarded)
- **Request Body:**
  ```json
  {
    "items": [{ "productId": "uuid", "qty": 2, "price": 250.00 }],
    "email": "user@example.com",
    "name": "User Name",
    "phone": "9876543210",
    "address": "Shipping Address",
    "idempotencyKey": "uuid-key"
  }
  ```
- **Response:** Order summary object.

### `POST /orders/:id/confirm`
- **Description:** Verifies payment proof and transitions order to Confirmed.
- **Authorization:** Admin or Owner (JWT guarded)
- **Response:** `{ "success": true }`

---

## 4. Manual Invoices (Receipts)

### `POST /receipts`
- **Description:** Generates manual invoice billing and adjusts inventory.
- **Authorization:** Admin or Owner (JWT guarded)
- **Request Body:**
  ```json
  {
    "receiptNumber": "GK-2026-0001",
    "customerName": "Customer Name",
    "customerPhone": "9876543210",
    "items": [
      {
        "description": "Hot Wheels Casting",
        "qty": 2,
        "amount": 250.00,
        "productId": "product-uuid"
      }
    ]
  }
  ```
- **Response:** Receipt transaction details.
