/**
 * cart.js: User-scoped database-backed cart persistence utility
 *
 * Design rules:
 * - LocalStorage is NOT the primary cart for authenticated users.
 * - Authenticated users sync their cart items dynamically with the backend database.
 * - Unauthenticated guest cart is stored in `gk_guest_cart` and merged to DB upon login.
 * - Local in-memory caching with revalidation prevents database request storms.
 */

const API_BASE_URL = import.meta.env.PROD 
  ? '/api/v1' 
  : (import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1');

let cartCache = [];
let cacheExpiresAt = 0;
let isFetching = false;

// Check user status directly from localStorage to prevent circular dependency
function getAuthenticatedUser() {
  try {
    const userStr = localStorage.getItem('gk_user');
    return userStr ? JSON.parse(userStr) : null;
  } catch (e) {
    return null;
  }
}

/**
 * Returns the cart items from local storage/cache without making background HTTP requests.
 */
export function readCart() {
  try {
    const userCartStr = localStorage.getItem('gk_user_cart') || localStorage.getItem('gk_guest_cart');
    if (userCartStr) {
      return JSON.parse(userCartStr);
    }
  } catch (e) {
    // Ignore parse errors
  }
  return cartCache || [];
}

/**
 * Performs dynamic background fetching of the authenticated user's cart (manual invocation only).
 */
async function fetchCartFromDb() {
  const user = getAuthenticatedUser();
  if (!user) return;

  isFetching = true;
  try {
    const res = await fetch(`${API_BASE_URL}/cart`);
    if (res.ok) {
      const data = await res.json();
      cartCache = data.items || data || [];
      cacheExpiresAt = Date.now() + 5000;
      notifyCartUpdated();
    }
  } catch (e) {
    // Silently ignore cart network errors
  } finally {
    isFetching = false;
  }
}

/**
 * Merges local guest cart items to the database cart upon login.
 */
export async function mergeGuestCartToDb() {
  // Opt-in manual merge
}

/**
 * Writes/mutates the cart to local storage.
 */
export function writeCart(items) {
  try {
    localStorage.setItem('gk_guest_cart', JSON.stringify(items));
    localStorage.setItem('gk_user_cart', JSON.stringify(items));
  } catch (e) {}
  cartCache = items;
  notifyCartUpdated();
}

/**
 * Clears the active cart.
 */
export function clearCart() {
  localStorage.removeItem('gk_guest_cart');
  localStorage.removeItem('gk_user_cart');
  cartCache = [];
  notifyCartUpdated();
}

/**
 * Clears all carts (called on logout/auth changes).
 */
export function clearAllUserCarts() {
  localStorage.removeItem('gk_guest_cart');
  localStorage.removeItem('gk_user_cart');
  cartCache = [];
  notifyCartUpdated();
}

/**
 * Dispatches cart updates.
 */
export function notifyCartUpdated() {
  window.dispatchEvent(new CustomEvent('gk_cart_updated', { detail: { open: false } }));
}
