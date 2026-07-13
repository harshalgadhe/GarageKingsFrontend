# API Contracts (Version 1 REST Specification)

This document contains structural contract schemas for request and response DTO definitions matching the versioned route directories.

---

## 1. Version Prefix Structure

All refactored endpoints map to one of the following root categories:
* `/api/v1/public/` — Unauthenticated storefront queries.
* `/api/v1/customer/` — Authenticated collector operations.
* `/api/v1/admin/` — Administrative backend access.

---

## 2. Data Transfer Objects (DTO) Specifications

### 2.1 Public Product Response DTO
Returned by: `GET /api/v1/public/products` and `GET /api/v1/public/products/:id`

```typescript
export class PublicProductResponseDto {
  id: string;
  slug: string;
  productName: string;
  brand: string;
  series: string;
  casing: string[];
  scale: string;
  description: string;
  images: {
    thumbnailUrl: string;
    mediumUrl: string;
    fullUrl: string;
  }[];
  sellingPrice: number;
  preorder: boolean;
  arrivalEstimate: string;
  availabilityState: 'IN_STOCK' | 'LOW_STOCK' | 'PREORDER' | 'COMING_SOON' | 'OUT_OF_STOCK';
}
```

### 2.2 Customer Product Response DTO
Returned by: `GET /api/v1/customer/products/:id`

```typescript
export class CustomerProductResponseDto extends PublicProductResponseDto {
  alreadyInCart: boolean;
  alreadyWishlisted: boolean;
  alreadyPrebooked: boolean;
  isPurchasable: boolean;
  availabilityMessage: string;
}
```

### 2.3 Admin Product Response DTO
Returned by: `GET /api/v1/admin/products` and `GET /api/v1/admin/products/:id`

```typescript
export class AdminProductResponseDto {
  id: string;
  sku: string;
  modelName: string;
  brand: string;
  series: string;
  scale: string;
  purchasePrice: number;
  sellingPrice: number;
  totalStock: number;
  availableStock: number;
  lockedStock: number;
  soldStock: number;
  supplier: string;
  casingTypes: string[];
  status: 'Draft' | 'Published' | 'Archived';
  isPrebook: boolean;
  prebookDepositAmount?: number;
  arrivalDate?: string;
  releaseDate?: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}
```

### 2.4 Public Global Settings DTO
Returned by: `GET /api/v1/settings` and `GET /api/v1/public/settings`

```typescript
export class PublicSettingsResponseDto {
  showPrices: boolean;
  instagramUrl: string;
  companyUpiId: string;
  upiQrImage: string;
  partnerNames: string[];
}
```

### 2.5 Admin Settings DTO
Returned by: `GET /api/v1/admin/settings`

```typescript
export class AdminSettingsResponseDto extends PublicSettingsResponseDto {
  splits: Record<string, number>;
  lowStockThreshold: number;
  reservationDuration: number;
  marketplaceMobileInitialPageSize: number;
  marketplaceDesktopInitialPageSize: number;
  shippingConfig: {
    defaultFee: number;
    freeShippingThreshold: number | null;
    regions: { code: string; flatRate: number }[];
  };
}
```
