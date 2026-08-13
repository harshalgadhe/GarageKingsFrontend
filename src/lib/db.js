import { getSessionCorrelationId } from './telemetry.js';

// ============================================================================
// GARAGEKINGS CLIENT REST API GATEWAY MODULE (LOCAL AUTH TRANSITION)
// Optimized for secure local session cookies
// ============================================================================

const API_BASE_URL = import.meta.env.PROD 
  ? '/api/v1' 
  : (import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1');

export function resolveMediaUrl(value) {
  if (!value || typeof value !== 'string') return value;
  if (value.startsWith('data:') || value.startsWith('blob:')) return value;

  try {
    const parsed = new URL(value, window.location.origin);
    const isLegacyLocalUrl = ['localhost', '127.0.0.1', '::1'].includes(parsed.hostname);

    if (import.meta.env.PROD && isLegacyLocalUrl) {
      return `${parsed.pathname}${parsed.search}${parsed.hash}`;
    }
  } catch {
    return value;
  }

  return value;
}

function normalizeImageEntry(image) {
  if (typeof image === 'string') return resolveMediaUrl(image);
  if (!image || typeof image !== 'object') return image;

  return {
    ...image,
    fullUrl: resolveMediaUrl(image.fullUrl),
    mediumUrl: resolveMediaUrl(image.mediumUrl),
    thumbnailUrl: resolveMediaUrl(image.thumbnailUrl),
    url: resolveMediaUrl(image.url),
    src: resolveMediaUrl(image.src),
  };
}

function imageIdentity(image) {
  if (typeof image === 'string') return resolveMediaUrl(image);
  if (!image || typeof image !== 'object') return '';
  return resolveMediaUrl(image.fullUrl || image.url || image.src || image.mediumUrl || image.thumbnailUrl || '');
}

function normalizeUniqueImages(images) {
  if (!Array.isArray(images)) return images;
  const seen = new Set();
  return images.map(normalizeImageEntry).filter((image) => {
    const identity = imageIdentity(image);
    if (!identity || seen.has(identity)) return false;
    seen.add(identity);
    return true;
  });
}

function normalizeProductMedia(product) {
  if (!product || typeof product !== 'object') return product;
  const normalizeVariant = (variant) => ({
    ...variant,
    image: resolveMediaUrl(variant?.image),
    images: normalizeUniqueImages(variant?.images),
  });

  return {
    ...product,
    image: resolveMediaUrl(product.image),
    images: normalizeUniqueImages(product.images),
    variants: Array.isArray(product.variants) ? product.variants.map(normalizeVariant) : product.variants,
    caseVariants: Array.isArray(product.caseVariants) ? product.caseVariants.map(normalizeVariant) : product.caseVariants,
  };
}

// Mocked configuration checker for backwards-compatibility checks in legacy page loads
export const isFirebaseConfigured = true;


// Automatically inject credentials: 'include' globally to transmit HttpOnly cookies
// and automatically refresh expired JWT sessions on 401 responses
const originalFetch = window.fetch;
let refreshPromise = null;

function redirectToSignIn() {
  localStorage.removeItem('gk_user');
  const currentPath = window.location.pathname + window.location.search;
  let redirectUrl = '/account';
  if (window.location.pathname !== '/account') {
    redirectUrl += `?returnTo=${encodeURIComponent(currentPath)}`;
  }
  window.location.assign(redirectUrl);
}

window.fetch = async function (url, options = {}) {
  options.credentials = 'include';
  
  // Inject Correlation ID
  const headers = options.headers || {};
  if (headers instanceof Headers) {
    headers.set('x-correlation-id', getSessionCorrelationId());
  } else if (Array.isArray(headers)) {
    headers.push(['x-correlation-id', getSessionCorrelationId()]);
  } else {
    headers['x-correlation-id'] = getSessionCorrelationId();
  }
  options.headers = headers;

  try {

    const response = await originalFetch(url, options);
    
    // If unauthorized (401), attempt to silently refresh access token via HTTP HttpOnly refresh cookie
    if (response.status === 401) {
      const urlStr = typeof url === 'string' ? url : (url.url || '');
      if (!urlStr.includes('/auth/refresh') && !urlStr.includes('/setup/status')) {
        if (!refreshPromise) {
          refreshPromise = originalFetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            credentials: 'include'
          }).finally(() => {
            refreshPromise = null;
          });
        }

        try {
          const refreshRes = await refreshPromise;
          if (!refreshRes.ok) {
            redirectToSignIn();
            return response;
          }

          const repeatedRes = await originalFetch(url, options);
          if (repeatedRes.status === 401) redirectToSignIn();
          return repeatedRes;
        } catch (_) {
          redirectToSignIn();
          return response;
        }
      }
    }
    return response;
  } catch (err) {
    throw err;
  }
};

function getAuthHeaders() {
  return {
    'Content-Type': 'application/json'
  };
}

// Global Settings endpoints
export async function getGlobalSettings() {
  try {
    const res = await fetch(`${API_BASE_URL}/settings`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error("Failed to fetch settings");
    return await res.json();
  } catch (err) {
    console.error("Error fetching settings:", err);
    return { showPrices: false };
  }
}

export async function getPublicSettings() {
  try {
    const res = await fetch(`${API_BASE_URL}/public/settings`);
    if (!res.ok) throw new Error("Failed to fetch public settings");
    return await res.json();
  } catch (err) {
    console.error("Error fetching public settings:", err);
    return {};
  }
}

export async function updateGlobalSettings(settings) {
  const res = await fetch(`${API_BASE_URL}/settings`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(settings)
  });
  if (!res.ok) throw new Error("Failed to save global settings");
  return await res.json();
}

export async function getCars(params = {}) {
  // Extract signal separately because it is not a query param
  const { signal, ...queryOptions } = params;
  try {
    const queryParams = new URLSearchParams();
    if (queryOptions.page) queryParams.append('page', queryOptions.page);
    if (queryOptions.limit) queryParams.append('limit', queryOptions.limit);
    if (queryOptions.offset !== undefined) queryParams.append('offset', queryOptions.offset);
    if (queryOptions.brand) queryParams.append('brand', queryOptions.brand);
    if (queryOptions.scale) queryParams.append('scale', queryOptions.scale);
    if (queryOptions.tag) queryParams.append('tag', queryOptions.tag);
    if (queryOptions.search) queryParams.append('search', queryOptions.search);
    if (queryOptions.inStock !== undefined) queryParams.append('inStock', queryOptions.inStock);
    if (queryOptions.preBooking !== undefined) queryParams.append('preBooking', queryOptions.preBooking);
    if (queryOptions.featured !== undefined) queryParams.append('featured', queryOptions.featured);

    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    const res = await fetch(`${API_BASE_URL}/products${queryString}`, {
      headers: getAuthHeaders(),
      ...(signal ? { signal } : {})
    });
    if (!res.ok) throw new Error("Failed to fetch castings");
    const data = await res.json();
    const normalizedProducts = (data.products || []).map(normalizeProductMedia);
    if (queryOptions.paginated) {
      return { ...data, products: normalizedProducts };
    }
    return data.products ? normalizedProducts : (Array.isArray(data) ? data.map(normalizeProductMedia) : data);
  } catch (err) {
    // Re-throw AbortError so callers can detect request cancellation
    if (err?.name === 'AbortError') throw err;
    console.error("Error fetching cars:", err);
    return queryOptions.paginated ? { products: [], total: 0 } : [];
  }
}

export async function getHomepageProducts() {
  try {
    const res = await fetch(`${API_BASE_URL}/products/homepage`);
    if (!res.ok) throw new Error('Failed to fetch homepage catalog');
    const data = await res.json();
    return {
      featured: data.featured ? normalizeProductMedia(data.featured) : null,
      recent: (data.recent || []).map(normalizeProductMedia),
    };
  } catch (err) {
    console.error('Error fetching homepage catalog:', err);
    return { featured: null, recent: [] };
  }
}

export async function getProduct(id) {
  try {
    const res = await fetch(`${API_BASE_URL}/products/${id}`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error("Failed to fetch product details");
    return normalizeProductMedia(await res.json());
  } catch (err) {
    console.error(`Error fetching product ${id}:`, err);
    return null;
  }
}

async function createApiError(response, fallbackMessage) {
  let payload = null;
  try {
    payload = await response.json();
  } catch {
    // Some infrastructure responses do not include JSON.
  }

  const message = Array.isArray(payload?.message)
    ? payload.message.join(' ')
    : (payload?.message || fallbackMessage || response.statusText || 'Request failed.');
  const error = new Error(message);
  error.status = response.status;
  error.code = payload?.error;
  error.correlationId = payload?.correlationId;
  return error;
}


export async function addCar(car) {
  const res = await fetch(`${API_BASE_URL.replace('/api/v1', '')}/api/v1/admin/products`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(car)
  });

  if (!res.ok) {
    throw await createApiError(res, 'The product could not be saved.');
  }
  return await res.json();
}

export async function checkProductSkuAvailability(sku, excludeId) {
  const params = new URLSearchParams({ sku: String(sku || '').trim() });
  if (excludeId) params.set('excludeId', excludeId);
  const res = await fetch(`${API_BASE_URL}/admin/products/sku-availability/check?${params.toString()}`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw await createApiError(res, 'SKU availability could not be checked.');
  return await res.json();
}

export async function updateCar(id, updatedFields) {
  const res = await fetch(`${API_BASE_URL.replace('/api/v1', '')}/api/v1/admin/products/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(updatedFields)
  });

  if (!res.ok) {
    throw await createApiError(res, 'The product could not be updated.');
  }
  return await res.json();
}

// Bids for Castings Endpoints
export async function getBids(carId) {
  try {
    const res = await fetch(`${API_BASE_URL}/products/${carId}/bids`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error("Failed to fetch bids");
    const data = await res.json();
    return data.bids || data;
  } catch (err) {
    console.error("Error fetching bids:", err);
    return [];
  }
}

export async function addBid(carId, bidData) {
  const res = await fetch(`${API_BASE_URL}/products/${carId}/bids`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(bidData)
  });
  if (!res.ok) throw new Error("Failed to place bid");
  return await res.json();
}

export function listenToTopBid(carId, callback) {
  getBids(carId).then(bids => {
    callback(bids && bids.length > 0 ? bids[0] : null);
  }).catch(() => callback(null));
  return () => {};
}

export function listenToBidCount(carId, callback) {
  getBids(carId).then(bids => {
    callback(bids ? bids.length : 0);
  }).catch(() => callback(0));
  return () => {};
}

export function listenToRecentBids(carId, callback, count = 5) {
  getBids(carId).then(bids => {
    callback(bids ? bids.slice(0, count) : []);
  }).catch(() => callback([]));
  return () => {};
}

export async function deleteCar(id) {
  const res = await fetch(`${API_BASE_URL}/products/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error("Failed to delete casting");
}

// Real-time Auctions endpoints
export async function getAuctions() {
  try {
    const res = await fetch(`${API_BASE_URL}/auctions`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error("Failed to fetch auctions");
    const data = await res.json();
    return data.auctions || data;
  } catch (err) {
    console.error("Error fetching auctions:", err);
    return [];
  }
}

export async function addAuction(auction) {
  const res = await fetch(`${API_BASE_URL}/auctions`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(auction)
  });
  if (!res.ok) throw new Error("Failed to create auction");
  return await res.json();
}

export async function updateAuction(id, fields) {
  const res = await fetch(`${API_BASE_URL}/auctions/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(fields)
  });
  if (!res.ok) throw new Error("Failed to update auction");
}

export async function deleteAuction(id) {
  const res = await fetch(`${API_BASE_URL}/auctions/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error("Failed to delete auction");
}

// Auction Bids Endpoints
export async function getAuctionBids(auctionId) {
  try {
    const res = await fetch(`${API_BASE_URL}/auctions/${auctionId}/bids`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error("Failed to fetch auction bids");
    const data = await res.json();
    return data.bids || data;
  } catch (err) {
    console.error("Error fetching auction bids:", err);
    return [];
  }
}

export async function addAuctionBid(auctionId, bidData) {
  const res = await fetch(`${API_BASE_URL}/auctions/${auctionId}/bids`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(bidData)
  });
  if (!res.ok) throw new Error("Failed to place auction bid");
  return await res.json();
}

export function listenToAuctionTopBid(auctionId, callback) {
  getAuctionBids(auctionId).then(bids => {
    callback(bids && bids.length > 0 ? bids[0] : null);
  }).catch(() => callback(null));
  return () => {};
}

export function listenToAuctionBidCount(auctionId, callback) {
  getAuctionBids(auctionId).then(bids => {
    callback(bids ? bids.length : 0);
  }).catch(() => callback(0));
  return () => {};
}

export function listenToAuctionRecentBids(auctionId, callback, count = 10) {
  getAuctionBids(auctionId).then(bids => {
    callback(bids ? bids.slice(0, count) : []);
  }).catch(() => callback([]));
  return () => {};
}

// Billing Receipts endpoints
export async function getReceipts(page = 1, limit = 10, search = '') {
  try {
    const res = await fetch(`${API_BASE_URL}/receipts?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error("Failed to fetch receipts");
    const data = await res.json();
    return data.receipts || data;
  } catch (err) {
    console.error("Error fetching receipts:", err);
    return [];
  }
}

export async function getReceiptDetails(id) {
  try {
    const res = await fetch(`${API_BASE_URL}/receipts/${id}`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error("Failed to fetch receipt details");
    return await res.json();
  } catch (err) {
    console.error(`Error fetching receipt ${id}:`, err);
    return null;
  }
}

export async function addReceipt(receipt) {
  const res = await fetch(`${API_BASE_URL}/receipts`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(receipt)
  });
  if (!res.ok) throw new Error("Failed to generate billing receipt");
  return await res.json();
}

export async function updateReceipt(id, receipt) {
  const res = await fetch(`${API_BASE_URL}/receipts/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(receipt)
  });
  if (!res.ok) {
    const message = await res.text().catch(() => '');
    throw new Error(message || "Failed to update receipt");
  }
  return await res.json();
}

export async function voidReceipt(id, reason) {
  const res = await fetch(`${API_BASE_URL}/receipts/${id}/void`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ reason })
  });
  if (!res.ok) {
    const message = await res.text().catch(() => '');
    throw new Error(message || 'Failed to void receipt');
  }
  return await res.json();
}

export async function deleteReceipt(id) {
  const res = await fetch(`${API_BASE_URL}/receipts/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  if (!res.ok) {
    const message = await res.text().catch(() => '');
    throw new Error(message || 'Failed to delete receipt');
  }
  return await res.json();
}

// Customer CRM Endpoints
export async function getCustomers() {
  try {
    const res = await fetch(`${API_BASE_URL}/customers`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error("Failed to fetch CRM directory");
    const data = await res.json();
    return data.customers || data;
  } catch (err) {
    console.error("Error fetching customers:", err);
    return [];
  }
}

export async function addCustomer(customer) {
  const res = await fetch(`${API_BASE_URL}/customers`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(customer)
  });
  if (!res.ok) throw new Error("Failed to save customer in CRM");
  return await res.json();
}

/**
 * Image upload operations
 * Converts client-side images to WebP format for high compression,
 * then uploads to AWS S3 via NestJS API.
 */
export async function uploadImageToStorage(file) {
  if (!file) return null;

  // 1. Convert client-side image to WebP format for high compression S3 upload
  let webpFile = file;
  try {
    webpFile = await convertToWebP(file, 1200, 0.85);
  } catch (e) {
    console.warn("WebP client-side conversion warning:", e);
  }

  // 2. Build deterministic multipart bytes. CloudFront OAC requires the
  // SHA-256 of the exact POST body before it will forward the request to the
  // IAM-protected Lambda Function URL.
  const boundary = `----GarageKingsUpload${crypto.randomUUID().replaceAll('-', '')}`;
  const encoder = new TextEncoder();
  const safeName = (webpFile.name || 'upload.webp').replace(/["\r\n]/g, '_');
  const fileType = webpFile.type || 'application/octet-stream';
  const fileBytes = new Uint8Array(await webpFile.arrayBuffer());
  const prefix = encoder.encode(
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="file"; filename="${safeName}"\r\n` +
    `Content-Type: ${fileType}\r\n\r\n`
  );
  const folderPart = encoder.encode(
    `\r\n--${boundary}\r\n` +
    'Content-Disposition: form-data; name="folder"\r\n\r\n' +
    `products\r\n--${boundary}--\r\n`
  );
  const multipartBody = new Uint8Array(prefix.length + fileBytes.length + folderPart.length);
  multipartBody.set(prefix, 0);
  multipartBody.set(fileBytes, prefix.length);
  multipartBody.set(folderPart, prefix.length + fileBytes.length);

  const digest = await crypto.subtle.digest('SHA-256', multipartBody);
  const payloadHash = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');

  const token = localStorage.getItem('gk_cognito_id_token') || localStorage.getItem('gk_cognito_access_token');
  const headers = {
    'Content-Type': `multipart/form-data; boundary=${boundary}`,
    'X-Amz-Content-Sha256': payloadHash,
    ...(token ? {
    'Authorization': `Bearer ${token}`,
    'X-Authorization': `Bearer ${token}`
    } : {})
  };

  const response = await fetch(`${API_BASE_URL}/images/upload`, {
    method: 'POST',
    headers: headers,
    body: multipartBody
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`S3 Upload failed (${response.status}): ${errorText || response.statusText}`);
  }

  const data = await response.json();
  const rawUrl = data.url || data.path || data.fileUrl || data.location || data.key;
  if (!rawUrl) {
    throw new Error(data.message || "S3 Upload failed: Server did not return an image URL.");
  }

  // Ensure full absolute S3 or backend server URL (stripping /api/v1 for static uploads)
  const serverOrigin = API_BASE_URL.replace(/\/api\/v\d+$/, '');
  const fullUrl = rawUrl.startsWith('http://') || rawUrl.startsWith('https://') || rawUrl.startsWith('data:')
    ? rawUrl 
    : `${serverOrigin}${rawUrl.startsWith('/') ? '' : '/'}${rawUrl}`;

  return resolveMediaUrl(fullUrl);
}

// Compress any DataURL string to max 400px WebP (~10KB)
export function compressDataUrl(dataUrl, maxDim = 400, quality = 0.45) {
  if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image')) {
    return Promise.resolve(dataUrl);
  }
  return new Promise((resolve) => {
    const img = new Image();
    img.src = dataUrl;
    img.onload = () => {
      let width = img.width;
      let height = img.height;
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/webp', quality));
    };
    img.onerror = () => resolve(dataUrl);
  });
}

// Helper to convert & scale any image file to WebP client-side (maxDimension: 400px)
function convertToWebP(file, maxDimension = 400, quality = 0.45) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          if (blob) {
            const webpFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".webp", {
              type: "image/webp",
              lastModified: Date.now()
            });
            resolve(webpFile);
          } else {
            reject(new Error("Canvas conversion to WebP failed"));
          }
        }, "image/webp", quality);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}

// Fallback helper converting file to Base64 (used locally if needed)
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}

// Admin Orders Management Endpoints
export async function getAdminOrders() {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/orders`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error("Failed to fetch admin orders list");
    const data = await res.json();
    return data.orders || data;
  } catch (err) {
    console.error("Error fetching admin orders:", err);
    return [];
  }
}

export async function updateOrderStatus(id, status, trackingNumber) {
  const res = await fetch(`${API_BASE_URL}/admin/orders/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ status, trackingNumber })
  });
  if (!res.ok) throw new Error("Failed to update order status");
  return await res.json();
}

export async function getCustomerOrders() {
  try {
    const res = await fetch(`${API_BASE_URL}/orders/my`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error("Failed to fetch customer orders history");
    return await res.json();
  } catch (err) {
    console.error("Error fetching customer orders:", err);
    return [];
  }
}

export async function getCustomerProfile() {
  try {
    const res = await fetch(`${API_BASE_URL}/profile/my`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error("Failed to fetch customer profile");
    return await res.json();
  } catch (err) {
    console.error("Error fetching customer profile:", err);
    return null;
  }
}

export async function updateCustomerProfile(profile) {
  const res = await fetch(`${API_BASE_URL}/profile/my`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(profile)
  });
  if (!res.ok) throw new Error("Failed to update customer profile");
  return await res.json();
}

// Supplier Purchases client Rest APIs
export async function getSuppliers() {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/suppliers`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error("Failed to fetch suppliers");
    return await res.json();
  } catch (err) {
    console.error("Error getSuppliers:", err);
    return [];
  }
}

export async function createSupplier(supplier) {
  const res = await fetch(`${API_BASE_URL}/admin/suppliers`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(supplier)
  });
  if (!res.ok) throw new Error("Failed to create supplier");
  return await res.json();
}

export async function getSupplierPurchases(page = 1, limit = 10, search = "") {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/supplier-purchases?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error("Failed to fetch supplier purchases");
    return await res.json();
  } catch (err) {
    console.error("Error getSupplierPurchases:", err);
    return { purchases: [], total: 0, totalPages: 0 };
  }
}

export async function getSupplierPurchaseDetails(id) {
  const res = await fetch(`${API_BASE_URL}/admin/supplier-purchases/${id}`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error("Failed to fetch supplier purchase details");
  return await res.json();
}

export async function addSupplierPurchase(purchase) {
  const res = await fetch(`${API_BASE_URL}/admin/supplier-purchases`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(purchase)
  });
  if (!res.ok) throw new Error("Failed to add supplier purchase");
  return await res.json();
}

export async function recordSupplierPayment(id, payment) {
  const res = await fetch(`${API_BASE_URL}/admin/supplier-purchases/${id}/pay`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payment)
  });
  if (!res.ok) throw new Error("Failed to record supplier payment");
  return await res.json();
}

export async function receiveSupplierShipment(id, receiving) {
  const res = await fetch(`${API_BASE_URL}/admin/supplier-purchases/${id}/receive`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(receiving)
  });
  if (!res.ok) throw new Error("Failed to receive supplier shipment");
  return await res.json();
}

export async function updateSupplierPurchaseStatus(id, status) {
  const res = await fetch(`${API_BASE_URL}/admin/supplier-purchases/${id}/status`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ status })
  });
  if (!res.ok) throw new Error("Failed to update supplier purchase status");
  return await res.json();
}

export async function getSupplierMetrics() {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/dashboard/supplier-metrics`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error("Failed to fetch supplier metrics");
    return await res.json();
  } catch (err) {
    console.error("Error getSupplierMetrics:", err);
    return { upcomingArrivals: 0, outstandingPayables: 0, awaitingReceiptCount: 0, delayedShipments: 0, totalSpend: 0, avgLeadTimeDays: 0, timeline: [] };
  }
}

// ==========================================
//          MASTER DATA API CALLS
// ==========================================

// Brands
export async function getBrands(adminMode = false) {
  const path = adminMode ? 'admin/brands' : 'brands';
  const res = await fetch(`${API_BASE_URL}/${path}`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error("Failed to fetch brands");
  return await res.json();
}

export async function createBrand(brand) {
  const res = await fetch(`${API_BASE_URL}/admin/brands`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(brand)
  });
  if (!res.ok) throw new Error("Failed to create brand");
  return await res.json();
}

export async function updateBrand(id, brand) {
  const res = await fetch(`${API_BASE_URL}/admin/brands/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(brand)
  });
  if (!res.ok) throw new Error("Failed to update brand");
  return await res.json();
}

export async function deleteBrand(id) {
  const res = await fetch(`${API_BASE_URL}/admin/brands/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error("Failed to archive brand");
  return await res.json();
}

// Manufacturers
export async function getManufacturers(adminMode = false) {
  const path = adminMode ? 'admin/manufacturers' : 'manufacturers';
  const res = await fetch(`${API_BASE_URL}/${path}`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error("Failed to fetch manufacturers");
  return await res.json();
}

export async function createManufacturer(manufacturer) {
  const res = await fetch(`${API_BASE_URL}/admin/manufacturers`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(manufacturer)
  });
  if (!res.ok) throw new Error("Failed to create manufacturer");
  return await res.json();
}

export async function updateManufacturer(id, manufacturer) {
  const res = await fetch(`${API_BASE_URL}/admin/manufacturers/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(manufacturer)
  });
  if (!res.ok) throw new Error("Failed to update manufacturer");
  return await res.json();
}

export async function deleteManufacturer(id) {
  const res = await fetch(`${API_BASE_URL}/admin/manufacturers/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error("Failed to archive manufacturer");
  return await res.json();
}

// Scales
export async function getScales(adminMode = false) {
  const path = adminMode ? 'admin/scales' : 'scales';
  const res = await fetch(`${API_BASE_URL}/${path}`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error("Failed to fetch scales");
  return await res.json();
}

export async function createScale(scale) {
  const res = await fetch(`${API_BASE_URL}/admin/scales`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(scale)
  });
  if (!res.ok) throw new Error("Failed to create scale");
  return await res.json();
}

export async function updateScale(id, scale) {
  const res = await fetch(`${API_BASE_URL}/admin/scales/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(scale)
  });
  if (!res.ok) throw new Error("Failed to update scale");
  return await res.json();
}

export async function deleteScale(id) {
  const res = await fetch(`${API_BASE_URL}/admin/scales/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error("Failed to archive scale");
  return await res.json();
}

// Series
export async function getSeries(adminMode = false) {
  const path = adminMode ? 'admin/series' : 'series';
  const res = await fetch(`${API_BASE_URL}/${path}`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error("Failed to fetch series");
  return await res.json();
}

export async function createSeries(series) {
  const res = await fetch(`${API_BASE_URL}/admin/series`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(series)
  });
  if (!res.ok) throw new Error("Failed to create series");
  return await res.json();
}

export async function updateSeries(id, series) {
  const res = await fetch(`${API_BASE_URL}/admin/series/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(series)
  });
  if (!res.ok) throw new Error("Failed to update series");
  return await res.json();
}

export async function deleteSeries(id) {
  const res = await fetch(`${API_BASE_URL}/admin/series/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error("Failed to archive series");
  return await res.json();
}

// ── ERP DASHBOARD AGGREGATES ──────────────────────────────────────
export async function getDashboardAggregates() {
  const res = await fetch(`${API_BASE_URL}/admin/dashboard/aggregates`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error("Failed to fetch dashboard aggregates");
  return await res.json();
}

// ── ERP VARIANTS ──────────────────────────────────────────────────
export async function getAdminVariants(page = 1, limit = 50, search = "") {
  const res = await fetch(`${API_BASE_URL}/admin/variants?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error("Failed to fetch admin variants");
  return await res.json();
}

export async function getInventoryVariantDetails(variantId) {
  const res = await fetch(`${API_BASE_URL}/admin/inventory/variants/${variantId}/details`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error("Failed to fetch variant inventory details");
  return await res.json();
}

export async function updateInventoryBatch(batchId, dto) {
  const res = await fetch(`${API_BASE_URL}/admin/inventory/batches/${batchId}`, {
    method: 'PATCH',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(dto)
  });
  if (!res.ok) throw new Error("Failed to update inventory batch");
  return await res.json();
}

// ── NEW ERP LOOKUPS ───────────────────────────────────────────────

// Categories
export async function getCategories() {
  const res = await fetch(`${API_BASE_URL}/categories`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error("Failed to fetch categories");
  return await res.json();
}
export async function createCategory(category) {
  const res = await fetch(`${API_BASE_URL}/admin/categories`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(category)
  });
  if (!res.ok) throw new Error("Failed to create category");
  return await res.json();
}
export async function updateCategory(id, category) {
  const res = await fetch(`${API_BASE_URL}/admin/categories/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(category)
  });
  if (!res.ok) throw new Error("Failed to update category");
  return await res.json();
}
export async function deleteCategory(id) {
  const res = await fetch(`${API_BASE_URL}/admin/categories/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error("Failed to delete category");
  return await res.json();
}

// Tags
export async function getTags() {
  const res = await fetch(`${API_BASE_URL}/tags`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error("Failed to fetch tags");
  return await res.json();
}
export async function createTag(tag) {
  const res = await fetch(`${API_BASE_URL}/admin/tags`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(tag)
  });
  if (!res.ok) throw new Error("Failed to create tag");
  return await res.json();
}
export async function updateTag(id, tag) {
  const res = await fetch(`${API_BASE_URL}/admin/tags/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(tag)
  });
  if (!res.ok) throw new Error("Failed to update tag");
  return await res.json();
}
export async function deleteTag(id) {
  const res = await fetch(`${API_BASE_URL}/admin/tags/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error("Failed to delete tag");
  return await res.json();
}

// Expense Categories
export async function getExpenseCategories(adminMode = false) {
  const res = await fetch(`${API_BASE_URL}/expense-categories?adminMode=${adminMode}`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error("Failed to fetch expense categories");
  return await res.json();
}
export async function createExpenseCategory(cat) {
  const res = await fetch(`${API_BASE_URL}/admin/expense-categories`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(cat)
  });
  if (!res.ok) throw new Error("Failed to create expense category");
  return await res.json();
}
export async function updateExpenseCategory(id, cat) {
  const res = await fetch(`${API_BASE_URL}/admin/expense-categories/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(cat)
  });
  if (!res.ok) throw new Error("Failed to update expense category");
  return await res.json();
}
export async function deleteExpenseCategory(id) {
  const res = await fetch(`${API_BASE_URL}/admin/expense-categories/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error("Failed to delete expense category");
  return await res.json();
}

// Payment Methods
export async function getPaymentMethods(adminMode = false) {
  const res = await fetch(`${API_BASE_URL}/payment-methods?adminMode=${adminMode}`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error("Failed to fetch payment methods");
  return await res.json();
}
export async function createPaymentMethod(method) {
  const res = await fetch(`${API_BASE_URL}/admin/payment-methods`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(method)
  });
  if (!res.ok) throw new Error("Failed to create payment method");
  return await res.json();
}
export async function updatePaymentMethod(id, method) {
  const res = await fetch(`${API_BASE_URL}/admin/payment-methods/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(method)
  });
  if (!res.ok) throw new Error("Failed to update payment method");
  return await res.json();
}
export async function deletePaymentMethod(id) {
  const res = await fetch(`${API_BASE_URL}/admin/payment-methods/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error("Failed to delete payment method");
  return await res.json();
}

// Shipping Providers
export async function getShippingProviders(adminMode = false) {
  const res = await fetch(`${API_BASE_URL}/shipping-providers?adminMode=${adminMode}`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error("Failed to fetch shipping providers");
  return await res.json();
}
export async function createShippingProvider(provider) {
  const res = await fetch(`${API_BASE_URL}/admin/shipping-providers`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(provider)
  });
  if (!res.ok) throw new Error("Failed to create shipping provider");
  return await res.json();
}
export async function updateShippingProvider(id, provider) {
  const res = await fetch(`${API_BASE_URL}/admin/shipping-providers/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(provider)
  });
  if (!res.ok) throw new Error("Failed to update shipping provider");
  return await res.json();
}
export async function deleteShippingProvider(id) {
  const res = await fetch(`${API_BASE_URL}/admin/shipping-providers/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error("Failed to delete shipping provider");
  return await res.json();
}

// Read-Only Lookups
export async function getOrderStatuses() {
  const res = await fetch(`${API_BASE_URL}/order-statuses`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error("Failed to fetch order statuses");
  return await res.json();
}
export async function getPurchaseStatuses() {
  const res = await fetch(`${API_BASE_URL}/purchase-statuses`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error("Failed to fetch purchase statuses");
  return await res.json();
}
export async function getLogisticsStatuses() {
  const res = await fetch(`${API_BASE_URL}/logistics-statuses`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error("Failed to fetch logistics statuses");
  return await res.json();
}
export async function getCurrencies() {
  const res = await fetch(`${API_BASE_URL}/currencies`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error("Failed to fetch currencies");
  return await res.json();
}
export async function getCountries() {
  const res = await fetch(`${API_BASE_URL}/countries`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error("Failed to fetch countries");
  return await res.json();
}

export async function getAllInventoryBatches(page = 1, limit = 50) {
  const res = await fetch(`${API_BASE_URL}/admin/inventory/batches/all?page=${page}&limit=${limit}`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error("Failed to fetch all inventory batches");
  return await res.json();
}

export async function getAllInventoryLedger(page = 1, limit = 50) {
  const res = await fetch(`${API_BASE_URL}/admin/inventory/ledger/all?page=${page}&limit=${limit}`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error("Failed to fetch all inventory ledger entries");
  return await res.json();
}

export async function getSupplierReceipts(page = 1, limit = 50) {
  const res = await fetch(`${API_BASE_URL}/admin/supplier-purchases/receipts?page=${page}&limit=${limit}`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error("Failed to fetch supplier receipts");
  return await res.json();
}


