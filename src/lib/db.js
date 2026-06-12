// ============================================================================
// GARAGEKINGS CLIENT REST API GATEWAY MODULE (PURE AWS ARCHITECTURE)
// Refactored off direct Firebase Firestore calls to target NestJS REST APIs
// Optimized for Vercel/CloudFront deployments and Cognito security guards
// ============================================================================

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

// Mocked configuration checker for backwards-compatibility checks in legacy page loads
export const isFirebaseConfigured = true;

// Helper to extract the Cognito ID/Access token from secure localStorage
function getAuthHeaders() {
  const token = localStorage.getItem('gk_cognito_id_token') || localStorage.getItem('gk_cognito_access_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 
      'Authorization': `Bearer ${token}`,
      'X-Authorization': `Bearer ${token}`
    } : {})
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

export async function updateGlobalSettings(settings) {
  const res = await fetch(`${API_BASE_URL}/settings`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(settings)
  });
  if (!res.ok) throw new Error("Failed to save global settings");
  return await res.json();
}

// Master Products (Casting Cars) endpoints
export async function getCars() {
  try {
    const res = await fetch(`${API_BASE_URL}/products`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error("Failed to fetch castings");
    const data = await res.json();
    return data.products || data;
  } catch (err) {
    console.error("Error fetching cars:", err);
    return [];
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
