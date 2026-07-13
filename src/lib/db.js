import { getSessionCorrelationId } from './telemetry.js';

// ============================================================================
// GARAGEKINGS CLIENT REST API GATEWAY MODULE (LOCAL AUTH TRANSITION)
// Optimized for secure local session cookies
// ============================================================================

const API_BASE_URL = import.meta.env.PROD 
  ? '/api/v1' 
  : (import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1');

// Mocked configuration checker for backwards-compatibility checks in legacy page loads
export const isFirebaseConfigured = true;


// Automatically inject credentials: 'include' globally to transmit HttpOnly cookies
// and automatically refresh expired JWT sessions on 401 responses
const originalFetch = window.fetch;
let isRefreshing = false;
let refreshSubscribers = [];

function subscribeTokenRefresh(cb) {
  refreshSubscribers.push(cb);
}

function onRefreshed() {
  refreshSubscribers.forEach(cb => cb());
  refreshSubscribers = [];
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
      if (!urlStr.includes('/auth/login') && !urlStr.includes('/auth/refresh') && !urlStr.includes('/setup/status')) {
        if (!isRefreshing) {
          isRefreshing = true;
          try {
            const refreshRes = await originalFetch(`${API_BASE_URL}/auth/refresh`, {
              method: 'POST',
              credentials: 'include'
            });
            if (refreshRes.ok) {
              isRefreshing = false;
              onRefreshed();
            } else {
              isRefreshing = false;
              localStorage.removeItem('gk_user');
              const currentPath = window.location.pathname + window.location.search;
              let redirectUrl = '/account';
              if (window.location.pathname !== '/account') {
                redirectUrl += `?returnTo=${encodeURIComponent(currentPath)}`;
              }
              window.location.href = redirectUrl;
              return response;
            }
          } catch (err) {
            isRefreshing = false;
            localStorage.removeItem('gk_user');
            const currentPath = window.location.pathname + window.location.search;
            let redirectUrl = '/account';
            if (window.location.pathname !== '/account') {
              redirectUrl += `?returnTo=${encodeURIComponent(currentPath)}`;
            }
            window.location.href = redirectUrl;
            return response;
          }
        }
        
        // Wait for token refresh operation to complete, then repeat original request
        return new Promise((resolve) => {
          subscribeTokenRefresh(async () => {
            const repeatedRes = await originalFetch(url, options);
            if (repeatedRes.status === 401) {
              localStorage.removeItem('gk_user');
              const currentPath = window.location.pathname + window.location.search;
              let redirectUrl = '/account';
              if (window.location.pathname !== '/account') {
                redirectUrl += `?returnTo=${encodeURIComponent(currentPath)}`;
              }
              window.location.href = redirectUrl;
            }
            resolve(repeatedRes);
          });
        });
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
  try {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.offset !== undefined) queryParams.append('offset', params.offset);
    if (params.brand) queryParams.append('brand', params.brand);
    if (params.scale) queryParams.append('scale', params.scale);
    if (params.tag) queryParams.append('tag', params.tag);
    if (params.search) queryParams.append('search', params.search);
    if (params.inStock !== undefined) queryParams.append('inStock', params.inStock);
    if (params.preBooking !== undefined) queryParams.append('preBooking', params.preBooking);

    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    const res = await fetch(`${API_BASE_URL}/products${queryString}`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error("Failed to fetch castings");
    const data = await res.json();
    if (params.paginated) {
      return data;
    }
    return data.products || data;
  } catch (err) {
    console.error("Error fetching cars:", err);
    return params.paginated ? { products: [], total: 0 } : [];
  }
}export async function getProduct(id) {
  try {
    const res = await fetch(`${API_BASE_URL}/products/${id}`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error("Failed to fetch product details");
    return await res.json();
  } catch (err) {
    console.error(`Error fetching product ${id}:`, err);
    return null;
  }
}


export async function addCar(car) {
  const res = await fetch(`${API_BASE_URL}/products`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(car)
  });
  if (!res.ok) throw new Error("Failed to save casting");
  return await res.json();
}

export async function updateCar(id, updatedFields) {
  const res = await fetch(`${API_BASE_URL}/products/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(updatedFields)
  });
  if (!res.ok) throw new Error("Failed to update casting");
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
export async function getReceipts() {
  try {
    const res = await fetch(`${API_BASE_URL}/receipts`, {
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

export async function addReceipt(receipt) {
  const res = await fetch(`${API_BASE_URL}/receipts`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(receipt)
  });
  if (!res.ok) throw new Error("Failed to generate billing receipt");
  return await res.json();
}

export async function deleteReceipt(id) {
  const res = await fetch(`${API_BASE_URL}/receipts/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error("Failed to delete receipt record");
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

  // 1. Convert client-side image to WebP format for fast loads
  let webpFile = file;
  if (file.type !== 'image/webp') {
    try {
      webpFile = await convertToWebP(file);
    } catch (e) {
      console.warn("WebP client-side conversion failed, falling back to raw upload:", e);
    }
  }

  // 2. Upload to our backend's S3 endpoint
  const formData = new FormData();
  formData.append('file', webpFile);
  formData.append('folder', 'products');

  const token = localStorage.getItem('gk_cognito_id_token') || localStorage.getItem('gk_cognito_access_token');
  const headers = token ? { 
    'Authorization': `Bearer ${token}`,
    'X-Authorization': `Bearer ${token}`
  } : {};

  const response = await fetch(`${API_BASE_URL}/images/upload`, {
    method: 'POST',
    headers: headers,
    body: formData
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Archival S3 upload failed: ${errorText || response.statusText}`);
  }

  const data = await response.json();
  if (data.success && data.url) {
    return data.url;
  } else {
    throw new Error(data.message || "Archival S3 upload failed");
  }
}

// Helper to convert any image file to WebP client-side
function convertToWebP(file, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
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


